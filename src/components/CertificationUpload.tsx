import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verifyCertification } from '@/lib/n8n';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  welderId: string;
  onSuccess?: () => void;
}

interface RateLimitError {
  retryAfter: number;
  certId?: string;
  publicUrl?: string;
}

export function CertificationUpload({ welderId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [certType, setCertType] = useState<'AWS' | 'ASME' | 'API' | 'NCCER' | 'CWI' | 'OTHER'>('AWS');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

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

    try {
      const result = await verifyCertification({
        certificationId: certId,
        welderId: welderId,
        imageUrl: publicUrl,
        certType: certType,
      });

      const updateData: Record<string, unknown> = {
        ai_extracted_data: result.extraction,
      };

      if (result.success && result.status === 'VERIFIED') {
        updateData.verification_status = 'verified';
        updateData.cert_number = result.extraction?.certificationNumber;
        updateData.cert_name = result.extraction?.holderName;
        updateData.issuing_body = result.extraction?.issuingOrganization;
        updateData.issue_date = result.extraction?.issueDate;
        updateData.expiry_date = result.extraction?.expiryDate;
        updateData.verified_at = new Date().toISOString();
      } else if (result.verification?.isExpired) {
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
        title: result.status === 'VERIFIED' ? 'Certification Verified!' : 'Processing Complete',
        description: result.status === 'VERIFIED' 
          ? 'Your certification has been verified successfully.'
          : 'Your certification needs manual review.',
      });

      onSuccess?.();
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

      // 1. Upload to Supabase Storage
      const fileName = `${welderId}/${Date.now()}_${file.name}`;
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
      <div className="space-y-2">
        <Label htmlFor="certType">Certification Type</Label>
        <Select 
          value={certType} 
          onValueChange={(value) => setCertType(value as typeof certType)}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select certification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AWS">AWS (American Welding Society)</SelectItem>
            <SelectItem value="ASME">ASME Section IX</SelectItem>
            <SelectItem value="API">API (American Petroleum Institute)</SelectItem>
            <SelectItem value="NCCER">NCCER</SelectItem>
            <SelectItem value="CWI">CWI (Certified Welding Inspector)</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="certFile">Upload Certificate</Label>
        <Input
          id="certFile"
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          disabled={isDisabled}
          className="cursor-pointer"
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading...</span>
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
          {rateLimitInfo?.certId && countdown === 0 && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              Retry Verification
            </Button>
          )}
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
    </div>
  );
}
