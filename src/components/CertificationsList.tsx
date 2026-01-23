import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { verifyCertification, CertType } from '@/lib/n8n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  ExternalLink,
  Award,
  Calendar,
  RefreshCw,
  Loader2,
  ChevronDown,
  FileText,
  ZoomIn,
  Download,
  X
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

interface Certification {
  id: string;
  cert_type: string;
  cert_name: string | null;
  cert_number: string | null;
  issuing_body: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  verification_status: 'pending' | 'verified' | 'expired' | 'invalid' | null;
  created_at: string | null;
}

interface Props {
  welderId: string;
  onCertificationsChange?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  invalid: {
    label: 'Invalid',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const CERT_TYPE_LABELS: Record<string, string> = {
  AWS: 'AWS (American Welding Society)',
  ASME: 'ASME Section IX',
  API: 'API (American Petroleum Institute)',
  NCCER: 'NCCER',
  CWI: 'CWI (Certified Welding Inspector)',
  OTHER: 'Other',
};

// Helper to check if URL is an image
const isImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
};

export function CertificationsList({ welderId, onCertificationsChange }: Props) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('welder_id', welderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (welderId) {
      fetchCertifications();
    }
  }, [welderId]);

  const handleDelete = async (certId: string) => {
    try {
      setDeleting(certId);
      
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certId);

      if (error) throw error;

      setCertifications((prev) => prev.filter((c) => c.id !== certId));
      onCertificationsChange?.();
      
      toast({
        title: 'Certification Deleted',
        description: 'The certification has been removed.',
      });
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete certification',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleRerunVerification = async (cert: Certification) => {
    if (!cert.document_url) {
      toast({
        title: 'Cannot Verify',
        description: 'No document URL available for this certification.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setVerifying(cert.id);

      const aiResult = await verifyCertification({
        certificationId: cert.id,
        welderId: welderId,
        imageUrl: cert.document_url,
        certType: cert.cert_type as CertType,
      });

      // Always save extracted data regardless of verification status
      const updateData: Record<string, unknown> = {
        ai_extracted_data: aiResult.extraction,
        cert_number: aiResult.extraction?.certificationNumber || null,
        cert_name: aiResult.extraction?.holderName || null,
        issuing_body: aiResult.extraction?.issuingOrganization || null,
        issue_date: aiResult.extraction?.issueDate || null,
        expiry_date: aiResult.extraction?.expiryDate || null,
      };

      // Set verification status based on result
      if (aiResult.success && aiResult.status === 'VERIFIED') {
        updateData.verification_status = 'verified';
        updateData.verified_at = new Date().toISOString();
      } else if (aiResult.verification?.isExpired) {
        updateData.verification_status = 'expired';
      } else if (aiResult.status === 'NEEDS_REVIEW') {
        // Keep as pending but data is saved for manual review
        updateData.verification_status = 'pending';
      } else {
        updateData.verification_status = 'invalid';
      }

      const { error: updateError } = await supabase
        .from('certifications')
        .update(updateData)
        .eq('id', cert.id);

      if (updateError) throw updateError;

      // Refresh the list
      await fetchCertifications();
      onCertificationsChange?.();

      toast({
        title: aiResult.status === 'VERIFIED' ? 'Certification Verified!' : 'Processing Complete',
        description: aiResult.status === 'VERIFIED' 
          ? 'Your certification has been verified successfully.'
          : 'Your certification needs manual review.',
      });
    } catch (error) {
      console.error('Error verifying certification:', error);
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to verify certification',
        variant: 'destructive',
      });
    } finally {
      setVerifying(null);
    }
  };

  // Admin function to manually update verification status
  const handleAdminStatusChange = async (certId: string, newStatus: 'verified' | 'invalid' | 'pending') => {
    try {
      setUpdatingStatus(certId);

      const cert = certifications.find(c => c.id === certId);
      
      const updateData: Record<string, unknown> = {
        verification_status: newStatus,
      };

      if (newStatus === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id;
      }

      const { error } = await supabase
        .from('certifications')
        .update(updateData)
        .eq('id', certId);

      if (error) throw error;

      // Send email notification
      if (cert) {
        try {
          await supabase.functions.invoke('send-cert-notification', {
            body: {
              certificationId: certId,
              newStatus,
              certType: cert.cert_type,
              certName: cert.cert_name,
            },
          });
        } catch (emailError) {
          console.error('Error sending notification:', emailError);
          // Don't fail the whole operation if email fails
        }
      }

      await fetchCertifications();
      onCertificationsChange?.();

      toast({
        title: 'Status Updated',
        description: `Certification marked as ${newStatus}. Notification sent.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openLightbox = (url: string, name: string) => {
    setLightboxImage({ url, name });
    setLightboxOpen(true);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'certificate';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const getStatusConfig = (cert: Certification) => {
    // Check if expired based on expiry_date even if status says verified
    if (cert.expiry_date && isPast(parseISO(cert.expiry_date))) {
      return STATUS_CONFIG.expired;
    }
    return STATUS_CONFIG[cert.verification_status || 'pending'];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Certifications
        </h3>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Certifications
        </h3>
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No certifications uploaded yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your welding certifications to increase your profile visibility.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Certifications
          <Badge variant="secondary" className="ml-2">
            {certifications.length}
          </Badge>
        </h3>
      </div>

      <div className="space-y-3">
        {certifications.map((cert) => {
          const statusConfig = getStatusConfig(cert);
          const StatusIcon = statusConfig.icon;
          const hasImage = isImageUrl(cert.document_url);

          return (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {cert.document_url && (
                    <div 
                      className="flex-shrink-0 cursor-pointer group relative"
                      onClick={() => openLightbox(cert.document_url!, cert.cert_name || cert.cert_type)}
                    >
                      {hasImage ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
                          <img 
                            src={cert.document_url} 
                            alt={cert.cert_name || 'Certificate'} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ZoomIn className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">
                        {cert.cert_name || CERT_TYPE_LABELS[cert.cert_type] || cert.cert_type}
                      </h4>
                      {/* Admin can change status via dropdown, others just see badge */}
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-auto py-0.5 px-2 ${statusConfig.className}`}
                              disabled={updatingStatus === cert.id}
                            >
                              {updatingStatus === cert.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <StatusIcon className="h-3 w-3 mr-1" />
                              )}
                              {statusConfig.label}
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => handleAdminStatusChange(cert.id, 'verified')}
                              className="text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Verified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdminStatusChange(cert.id, 'invalid')}
                              className="text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark as Invalid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdminStatusChange(cert.id, 'pending')}
                              className="text-amber-700"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Mark as Pending
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge className={statusConfig.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {cert.issuing_body && (
                        <p>Issued by: {cert.issuing_body}</p>
                      )}
                      {cert.cert_number && (
                        <p>Certificate #: {cert.cert_number}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        {cert.issue_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Issued: {formatDate(cert.issue_date)}
                          </span>
                        )}
                        {cert.expiry_date && (
                          <span className={`flex items-center gap-1 ${
                            isPast(parseISO(cert.expiry_date)) ? 'text-destructive' : ''
                          }`}>
                            <Calendar className="h-3 w-3" />
                            Expires: {formatDate(cert.expiry_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Rerun verification button for pending/invalid certs */}
                    {(cert.verification_status === 'pending' || cert.verification_status === 'invalid') && cert.document_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRerunVerification(cert)}
                        disabled={verifying === cert.id}
                        title="Rerun AI verification"
                      >
                        {verifying === cert.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {cert.document_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={cert.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleting === cert.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Certification</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this certification? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cert.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{lightboxImage?.name || 'Certificate'}</DialogTitle>
              <div className="flex items-center gap-2">
                {lightboxImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(lightboxImage.url, `${lightboxImage.name || 'certificate'}.jpg`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-muted/30 overflow-auto max-h-[calc(90vh-80px)]">
            {lightboxImage && (
              isImageUrl(lightboxImage.url) ? (
                <img 
                  src={lightboxImage.url} 
                  alt={lightboxImage.name} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">This document cannot be previewed directly.</p>
                  <Button asChild>
                    <a href={lightboxImage.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
