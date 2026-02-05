import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { canPostMoreJobs, getRemainingJobPosts, getPlanLimits } from "@/lib/stripe";

export function useJobLimits() {
  const { subscription } = useAuth();
  const { data: employerProfile } = useEmployerProfile();

  // Count active jobs for this employer
  const { data: activeJobsCount = 0, isLoading } = useQuery({
    queryKey: ["active_jobs_count", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return 0;

      const { count, error } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("employer_id", employerProfile.id)
        .eq("status", "active");

      if (error) {
        console.error("Error counting active jobs:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!employerProfile?.id,
  });

  const plan = subscription.plan;
  const limits = getPlanLimits(plan);
  const canPost = canPostMoreJobs(plan, activeJobsCount);
  const remaining = getRemainingJobPosts(plan, activeJobsCount);

  return {
    activeJobsCount,
    maxActiveJobs: limits.maxActiveJobs,
    canPostJob: canPost,
    remainingJobPosts: remaining,
    isUnlimited: limits.maxActiveJobs === -1,
    isLoading,
    plan,
  };
}
