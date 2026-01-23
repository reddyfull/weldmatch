import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { matchCandidates, sendEmail } from '@/lib/n8n';
import { useToast } from '@/hooks/use-toast';

interface JobData {
  title: string;
  requiredCerts?: string[];
  requiredProcesses?: string[];
  requiredPositions?: string[];
  experienceMin?: number;
  location?: string;
}

interface WelderData {
  name: string;
  yearsExperience?: number;
  weldProcesses?: string[];
  weldPositions?: string[];
  certifications?: string[];
  location?: string;
}

interface ApplyParams {
  jobId: string;
  welderId: string;
  coverMessage?: string;
  jobData: JobData;
  welderData: WelderData;
  employerEmail: string;
}

interface ApplyResult {
  success: boolean;
  application?: {
    id: string;
    job_id: string;
    welder_id: string;
    cover_message: string | null;
    match_score: number | null;
    status: string;
  };
  matchScore?: number;
  error?: unknown;
}

export function useApplyToJob() {
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const apply = async ({ 
    jobId, 
    welderId, 
    coverMessage, 
    jobData, 
    welderData,
    employerEmail 
  }: ApplyParams): Promise<ApplyResult> => {
    try {
      setApplying(true);

      // 1. Get match score from n8n
      const matchResult = await matchCandidates({
        jobId,
        welderId,
        jobData: {
          title: jobData.title,
          requiredCerts: jobData.requiredCerts || [],
          requiredProcesses: jobData.requiredProcesses || [],
          requiredPositions: jobData.requiredPositions || [],
          experienceMin: jobData.experienceMin || 0,
          location: jobData.location || '',
        },
        welderData: {
          name: welderData.name,
          yearsExperience: welderData.yearsExperience || 0,
          weldProcesses: welderData.weldProcesses || [],
          weldPositions: welderData.weldPositions || [],
          certifications: welderData.certifications || [],
          location: welderData.location || '',
        },
      });

      const matchScore = matchResult.matches?.[0]?.overallScore || 0;

      // 2. Create application in Supabase
      const { data: application, error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          welder_id: welderId,
          cover_message: coverMessage,
          match_score: matchScore,
          status: 'new',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Notify employer via email
      try {
        await sendEmail({
          templateId: 'NEW_APPLICATION',
          to: employerEmail,
          data: {
            jobTitle: jobData.title,
            welderName: welderData.name,
            yearsExperience: welderData.yearsExperience || 0,
            matchScore: matchScore,
            certCount: welderData.certifications?.length || 0,
            applicationId: application.id,
          },
        });
      } catch (emailError) {
        // Don't fail the application if email fails
        console.warn('Failed to send email notification:', emailError);
      }

      setApplying(false);

      toast({
        title: 'Application Submitted!',
        description: `Your match score is ${matchScore}%. Good luck!`,
      });

      return { success: true, application, matchScore };

    } catch (error: unknown) {
      console.error('Error applying:', error);
      setApplying(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  return { apply, applying };
}
