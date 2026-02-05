import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseResume, ProfileSuggestions } from '@/lib/n8n';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle } from 'lucide-react';

interface ResumeResult {
  success: boolean;
  profileSuggestions?: ProfileSuggestions;
  certificationSuggestions?: Array<{ name: string; certType: string }>;
}

interface Props {
  welderId: string;
  onSuggestionsReady?: (suggestions: ProfileSuggestions) => void;
}

export function ResumeUpload({ welderId, onSuggestionsReady }: Props) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setResult(null);

      // 1. Upload to Supabase Storage - use user.id for folder to match RLS policy
      const userId = user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const fileName = `${userId}/resume_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setUploading(false);
      setProcessing(true);

      // 3. Call n8n for AI parsing
      const aiResult = await parseResume({
        welderId: welderId,
        resumeUrl: publicUrl,
      });

      setResult(aiResult);
      setProcessing(false);

      if (aiResult.success) {
        toast({
          title: 'Resume Parsed!',
          description: 'Review the extracted information below.',
        });
        onSuggestionsReady?.(aiResult.profileSuggestions);
      } else {
        toast({
          title: 'Parsing Failed',
          description: 'Could not extract information from the resume.',
          variant: 'destructive',
        });
      }

    } catch (error: unknown) {
      console.error('Error:', error);
      setUploading(false);
      setProcessing(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process resume',
        variant: 'destructive',
      });
    }
  };

  const handleApplyToProfile = () => {
    if (result?.profileSuggestions) {
      onSuggestionsReady?.(result.profileSuggestions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <Label className="text-base font-medium">Upload Resume (Optional)</Label>
      </div>

      <p className="text-sm text-muted-foreground">
        Upload your resume and we'll auto-fill your profile information.
      </p>

      <div className="space-y-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={handleUpload}
          disabled={uploading || processing}
          className="cursor-pointer"
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading file...</span>
        </div>
      )}

      {processing && (
        <div className="flex items-center gap-2 text-primary p-4 bg-primary/10 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is reading your resume...</span>
        </div>
      )}

      {result?.success && result.profileSuggestions && (
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Extracted Information</span>
          </div>

          <div className="grid gap-2 text-sm">
            {result.profileSuggestions.fullName && (
              <p><span className="font-medium">Name:</span> {result.profileSuggestions.fullName}</p>
            )}
            {result.profileSuggestions.email && (
              <p><span className="font-medium">Email:</span> {result.profileSuggestions.email}</p>
            )}
            {result.profileSuggestions.phone && (
              <p><span className="font-medium">Phone:</span> {result.profileSuggestions.phone}</p>
            )}
            {result.profileSuggestions.city && (
              <p><span className="font-medium">Location:</span> {result.profileSuggestions.city}, {result.profileSuggestions.state}</p>
            )}
            {result.profileSuggestions.yearsExperience > 0 && (
              <p><span className="font-medium">Experience:</span> {result.profileSuggestions.yearsExperience} years</p>
            )}
          </div>

          {result.profileSuggestions.weldProcesses?.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Weld Processes:</span>
              <div className="flex flex-wrap gap-1">
                {result.profileSuggestions.weldProcesses.map((process) => (
                  <Badge key={process} variant="secondary">{process}</Badge>
                ))}
              </div>
            </div>
          )}

          {result.profileSuggestions.weldPositions?.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Weld Positions:</span>
              <div className="flex flex-wrap gap-1">
                {result.profileSuggestions.weldPositions.map((position) => (
                  <Badge key={position} variant="outline">{position}</Badge>
                ))}
              </div>
            </div>
          )}

          {result.certificationSuggestions?.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Certifications Found:</span>
              <div className="flex flex-wrap gap-1">
                {result.certificationSuggestions.map((cert, i) => (
                  <Badge key={i} variant="default">{cert.name}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleApplyToProfile} className="w-full mt-2">
            Apply to Profile
          </Button>
        </div>
      )}
    </div>
  );
}
