import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verifyCertification } from '@/lib/n8n';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  welderId: string;
  onSuccess?: () => void;
}

export function CertificationUpload({ welderId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [certType, setCertType] = useState<'AWS' | 'ASME' | 'API' | 'NCCER' | 'CWI' | 'OTHER'>('AWS');
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. Upload to Supabase Storage
      const fileName = `${welderId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
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
      setProcessing(true);

      // 4. Call n8n for AI processing (n8n does NOT write to DB)
      const result = await verifyCertification({
        certificationId: cert.id,
        welderId: welderId,
        imageUrl: publicUrl,
        certType: certType,
      });

      // 5. Update cert with AI results in Supabase (Lovable does the DB write)
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
        updateData.verification_status = 'pending'; // Needs manual review
      }

      const { error: updateError } = await supabase
        .from('certifications')
        .update(updateData)
        .eq('id', cert.id);

      if (updateError) throw updateError;

      setProcessing(false);

      toast({
        title: result.status === 'VERIFIED' ? 'Certification Verified!' : 'Processing Complete',
        description: result.status === 'VERIFIED' 
          ? 'Your certification has been verified successfully.'
          : 'Your certification needs manual review.',
      });

      onSuccess?.();

    } catch (error: unknown) {
      console.error('Error:', error);
      setUploading(false);
      setProcessing(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process certification',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="certType">Certification Type</Label>
        <Select 
          value={certType} 
          onValueChange={(value) => setCertType(value as typeof certType)}
          disabled={uploading || processing}
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
          disabled={uploading || processing}
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
    </div>
  );
}
