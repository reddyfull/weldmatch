import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verifyCertification, CertVerificationResponse, CertType } from '@/lib/n8n';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, AlertTriangle, CheckCircle, XCircle, Upload } from 'lucide-react';

interface Props {
  welderId: string;
  onSuccess?: (result: CertVerificationResponse) => void;
}

interface RateLimitError {
  retryAfter: number;
  certId?: string;
  publicUrl?: string;
}

const CERT_TYPES: { value: CertType; label: string }[] = [
  { value: 'AWS', label: 'AWS (American Welding Society)' },
  { value: 'ASME', label: 'ASME Section IX' },
  { value: 'API', label: 'API (American Petroleum Institute)' },
  { value: 'NCCER', label: 'NCCER' },
  { value: 'CWI', label: 'CWI (Certified Welding Inspector)' },
  { value: 'OTHER', label: 'Other' },
];

export function CertificationUpload({ welderId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [certType, setCertType] = useState<CertType>('AWS');
  const [result, setResult] = useState<CertVerificationResponse | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Countdown timer for rate limit
  useEffect(() => {
    if (countdown <= 0) {
      setRateLimitInfo(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const processVerification = useCallback(async (certId: string, publicUrl: string) => {
    setProcessing(true);
    setResult(null);

    try {
      const aiResult = await verifyCertification({
        certificationId: certId,
        welderId: welderId,
        imageUrl: publicUrl,
        certType: certType,
      });

      setResult(aiResult);

      const updateData: Record<string, unknown> = {
        ai_extracted_data: aiResult.extraction,
      };

      if (aiResult.success && aiResult.status === 'VERIFIED') {
        updateData.verification_status = 'verified';
        updateData.cert_number = aiResult.extraction?.certificationNumber;
        updateData.cert_name = aiResult.extraction?.holderName;
        updateData.issuing_body = aiResult.extraction?.issuingOrganization;
        updateData.issue_date = aiResult.extraction?.issueDate;
        updateData.expiry_date = aiResult.extraction?.expiryDate;
        updateData.verified_at = new Date().toISOString();
      } else if (aiResult.verification?.isExpired) {
        updateData.verification_status = 'expired';
      } else {
        updateData.verification_status = 'pending';
      }

      const { error: updateError } = await supabase
        .from('certifications')
        .update(updateData)
        .eq('id', certId);

      if (updateError) throw updateError;

      setProcessing(false);
      setRateLimitInfo(null);

      toast({
        title: aiResult.status === 'VERIFIED' ? 'Certification Verified!' : 'Processing Complete',
        description: aiResult.status === 'VERIFIED' 
          ? 'Your certification has been verified successfully.'
          : 'Your certification needs manual review.',
      });

      onSuccess?.(aiResult);
    } catch (error: unknown) {
      setProcessing(false);

      // Check for rate limit error
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        const retryMatch = error.message.match(/retryAfter[:\s]+(\d+)/i);
        const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;

        setRateLimitInfo({ retryAfter, certId, publicUrl });
        setCountdown(retryAfter);

        toast({
          title: 'Too Many Requests',
          description: `Please wait ${retryAfter} seconds before trying again.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process certification',
        variant: 'destructive',
      });
    }
  }, [welderId, certType, toast, onSuccess]);

  const handleRetry = () => {
    if (rateLimitInfo?.certId && rateLimitInfo?.publicUrl) {
      processVerification(rateLimitInfo.certId, rateLimitInfo.publicUrl);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setResult(null);

      // 1. Upload to Supabase Storage - use user.id for folder to match RLS policy
      const userId = user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(fileName);

      // 3. Create pending cert record in Supabase
      const { data: cert, error: insertError } = await supabase
        .from('certifications')
        .insert({
          welder_id: welderId,
          cert_type: certType,
          document_url: publicUrl,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploading(false);

      // 4. Process verification (handles rate limiting internally)
      await processVerification(cert.id, publicUrl);

    } catch (error: unknown) {
      console.error('Error:', error);
      setUploading(false);
      setProcessing(false);

      // Check for rate limit error during upload phase
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        const retryMatch = error.message.match(/retryAfter[:\s]+(\d+)/i);
        const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;

        setRateLimitInfo({ retryAfter });
        setCountdown(retryAfter);

        toast({
          title: 'Too Many Requests',
          description: `Please wait ${retryAfter} seconds before trying again.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process certification',
        variant: 'destructive',
      });
    }
  };

  const isDisabled = uploading || processing || countdown > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Upload Certification</h3>
      
      <div className="space-y-2">
        <Label htmlFor="certType">Certification Type</Label>
        <Select 
          value={certType} 
          onValueChange={(value) => setCertType(value as CertType)}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select certification type" />
          </SelectTrigger>
          <SelectContent>
            {CERT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="certFile">Upload Certificate Image/PDF</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <Input
            id="certFile"
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            disabled={isDisabled}
            className="hidden"
          />
          <label htmlFor="certFile" className={`cursor-pointer ${isDisabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
          </label>
        </div>
      </div>

      {/* Status Indicators */}
      {uploading && (
        <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading file...</span>
        </div>
      )}

      {processing && (
        <div className="flex items-center gap-2 text-primary p-4 bg-primary/10 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is analyzing your certification...</span>
        </div>
      )}

      {countdown > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Rate Limit Reached</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You've made too many requests. Please wait before trying again.
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">
              Retry in: {countdown}s
            </span>
          </div>
        </div>
      )}

      {rateLimitInfo?.certId && countdown === 0 && !processing && (
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <p className="text-sm text-muted-foreground">
            Your certification was uploaded but verification was paused. Click below to continue.
          </p>
          <Button onClick={handleRetry} variant="default" size="sm">
            Continue Verification
          </Button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            {result.status === 'VERIFIED' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-amber-500" />
            )}
            <span className="font-semibold">
              {result.status === 'VERIFIED' ? 'Verified!' : 'Needs Review'}
            </span>
            <Badge variant={result.status === 'VERIFIED' ? 'default' : 'secondary'}>
              {result.confidence}% confidence
            </Badge>
          </div>

          {result.extraction && (
            <div className="grid gap-2 text-sm">
              {result.extraction.certificationNumber && (
                <p><span className="font-medium">Cert #:</span> {result.extraction.certificationNumber}</p>
              )}
              {result.extraction.holderName && (
                <p><span className="font-medium">Name:</span> {result.extraction.holderName}</p>
              )}
              {result.extraction.issuingOrganization && (
                <p><span className="font-medium">Issuer:</span> {result.extraction.issuingOrganization}</p>
              )}
              {result.extraction.issueDate && (
                <p><span className="font-medium">Issue Date:</span> {result.extraction.issueDate}</p>
              )}
              {result.extraction.expiryDate && (
                <p><span className="font-medium">Expires:</span> {result.extraction.expiryDate}</p>
              )}
              
              {result.extraction.weldProcesses?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-medium">Processes:</span>
                  {result.extraction.weldProcesses.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              )}
              
              {result.extraction.weldPositions?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-medium">Positions:</span>
                  {result.extraction.weldPositions.map((p) => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                </div>
              )}

              {result.extraction.warnings?.length > 0 && (
                <div className="mt-2 p-2 bg-amber-500/10 rounded text-amber-700 text-xs">
                  {result.extraction.warnings.map((w, i) => (
                    <p key={i}>⚠️ {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
