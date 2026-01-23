import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Award,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { AdminLayout } from '@/components/layouts/AdminLayout';

interface CertificationWithWelder {
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
  welder_id: string;
  welder_profiles: {
    id: string;
    user_id: string;
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}

const CERT_TYPE_LABELS: Record<string, string> = {
  AWS: 'AWS',
  ASME: 'ASME',
  API: 'API',
  NCCER: 'NCCER',
  CWI: 'CWI',
  OTHER: 'Other',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  invalid: {
    label: 'Invalid',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export default function AdminCertifications() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [certifications, setCertifications] = useState<CertificationWithWelder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('certifications')
        .select(`
          *,
          welder_profiles (
            id,
            user_id,
            profiles:user_id (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter as 'pending' | 'verified' | 'invalid' | 'expired');
      }

      const { data, error } = await query;

      if (error) throw error;
      setCertifications((data as CertificationWithWelder[]) || []);
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
    if (isAdmin) {
      fetchCertifications();
    }
  }, [isAdmin, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(certifications.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchUpdate = async (newStatus: 'verified' | 'invalid') => {
    if (selectedIds.size === 0) return;

    try {
      setBatchUpdating(true);

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
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Batch Update Complete',
        description: `${selectedIds.size} certification(s) marked as ${newStatus}.`,
      });

      setSelectedIds(new Set());
      await fetchCertifications();
    } catch (error) {
      console.error('Error batch updating:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update certifications',
        variant: 'destructive',
      });
    } finally {
      setBatchUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusConfig = (cert: CertificationWithWelder) => {
    if (cert.expiry_date && isPast(parseISO(cert.expiry_date))) {
      return STATUS_CONFIG.expired;
    }
    return STATUS_CONFIG[cert.verification_status || 'pending'];
  };

  const getWelderName = (cert: CertificationWithWelder) => {
    return cert.welder_profiles?.profiles?.full_name || 'Unknown Welder';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Certification Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and verify welder certifications
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={fetchCertifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedIds.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} certification(s) selected
              </span>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={batchUpdating}
                    >
                      {batchUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Verify All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Verify Selected Certifications</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark {selectedIds.size} certification(s) as verified?
                        This action will update all selected records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBatchUpdate('verified')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Verify All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={batchUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark Invalid
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark as Invalid</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark {selectedIds.size} certification(s) as invalid?
                        This action will update all selected records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBatchUpdate('invalid')}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Mark Invalid
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">
                  {certifications.filter(c => c.verification_status === 'pending').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {certifications.filter(c => c.verification_status === 'verified').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invalid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {certifications.filter(c => c.verification_status === 'invalid').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">
                  {certifications.filter(c => 
                    c.expiry_date && isPast(parseISO(c.expiry_date))
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certifications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              All Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : certifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certifications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.size === certifications.length && certifications.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Welder</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cert Name/Number</TableHead>
                      <TableHead>Issuing Body</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.map((cert) => {
                      const statusConfig = getStatusConfig(cert);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(cert.id)}
                              onCheckedChange={(checked) => 
                                handleSelectOne(cert.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {getWelderName(cert)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CERT_TYPE_LABELS[cert.cert_type] || cert.cert_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {cert.cert_name || '—'}
                              {cert.cert_number && (
                                <span className="block text-muted-foreground text-xs">
                                  #{cert.cert_number}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {cert.issuing_body || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={
                              cert.expiry_date && isPast(parseISO(cert.expiry_date))
                                ? 'text-destructive font-medium'
                                : ''
                            }>
                              {formatDate(cert.expiry_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cert.document_url ? (
                              <Button
                                variant="ghost"
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
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}