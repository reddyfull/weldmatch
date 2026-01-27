import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerProfile } from "./useUserProfile";
import { useToast } from "./use-toast";

export interface JobTemplate {
  id: string;
  employer_id: string;
  name: string;
  description: string;
  job_title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useJobTemplates() {
  const { data: employerProfile } = useEmployerProfile();

  return useQuery({
    queryKey: ["job_templates", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];

      const { data, error } = await supabase
        .from("job_templates")
        .select("*")
        .eq("employer_id", employerProfile.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as JobTemplate[];
    },
    enabled: !!employerProfile?.id,
  });
}

export function useSaveJobTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: employerProfile } = useEmployerProfile();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      jobTitle,
      metadata,
    }: {
      name: string;
      description: string;
      jobTitle?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!employerProfile?.id) throw new Error("Employer profile not found");

      const { data, error } = await supabase
        .from("job_templates")
        .insert({
          employer_id: employerProfile.id,
          name,
          description,
          job_title: jobTitle || null,
          metadata: metadata || {},
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_templates", employerProfile?.id] });
      toast({
        title: "Template Saved",
        description: "Your job description template has been saved.",
      });
    },
    onError: (error) => {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteJobTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: employerProfile } = useEmployerProfile();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("job_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_templates", employerProfile?.id] });
      toast({
        title: "Template Deleted",
        description: "Your template has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });
}
