import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWelderProfile } from "./useUserProfile";
import { ResumeResponse } from "@/lib/ai-phase2";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface StoredResume {
  id: string;
  welder_id: string;
  resume_data: Json;
  form_data: Json | null;
  ats_score: number | null;
  suggestions: string[] | null;
  format_style: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedStoredResume {
  id: string;
  welder_id: string;
  resume_data: ResumeResponse;
  form_data: any;
  ats_score: number;
  suggestions: string[];
  format_style: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGeneratedResume() {
  const { data: welderProfile } = useWelderProfile();

  return useQuery({
    queryKey: ["generated_resume", welderProfile?.id],
    queryFn: async (): Promise<ParsedStoredResume | null> => {
      if (!welderProfile?.id) return null;

      const { data, error } = await supabase
        .from("generated_resumes")
        .select("*")
        .eq("welder_id", welderProfile.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching resume:", error);
        return null;
      }

      if (!data) return null;

      // Parse the stored data
      return {
        id: data.id,
        welder_id: data.welder_id,
        resume_data: data.resume_data as unknown as ResumeResponse,
        form_data: data.form_data,
        ats_score: data.ats_score || 75,
        suggestions: data.suggestions || [],
        format_style: data.format_style || "professional",
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
    enabled: !!welderProfile?.id,
  });
}

export function useSaveResume() {
  const queryClient = useQueryClient();
  const { data: welderProfile } = useWelderProfile();

  return useMutation({
    mutationFn: async ({
      resumeData,
      formData,
      atsScore,
      suggestions,
      formatStyle,
    }: {
      resumeData: ResumeResponse;
      formData: any;
      atsScore: number;
      suggestions: string[];
      formatStyle: string;
    }) => {
      if (!welderProfile?.id) throw new Error("No welder profile found");

      // Check if resume already exists
      const { data: existing } = await supabase
        .from("generated_resumes")
        .select("id")
        .eq("welder_id", welderProfile.id)
        .maybeSingle();

      const resumeJson = JSON.parse(JSON.stringify(resumeData)) as Json;
      const formJson = JSON.parse(JSON.stringify(formData)) as Json;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("generated_resumes")
          .update({
            resume_data: resumeJson,
            form_data: formJson,
            ats_score: atsScore,
            suggestions: suggestions,
            format_style: formatStyle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
        return existing.id;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("generated_resumes")
          .insert({
            welder_id: welderProfile.id,
            resume_data: resumeJson,
            form_data: formJson,
            ats_score: atsScore,
            suggestions: suggestions,
            format_style: formatStyle,
          })
          .select("id")
          .single();

        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_resume"] });
      toast({
        title: "Resume Saved",
        description: "Your resume has been saved to your profile.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  const { data: welderProfile } = useWelderProfile();

  return useMutation({
    mutationFn: async () => {
      if (!welderProfile?.id) throw new Error("No welder profile found");

      const { error } = await supabase
        .from("generated_resumes")
        .delete()
        .eq("welder_id", welderProfile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_resume"] });
      toast({
        title: "Resume Deleted",
        description: "Your saved resume has been deleted.",
      });
    },
  });
}
