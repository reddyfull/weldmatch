import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { getPlanLimits } from "@/lib/stripe";

export function useCandidateViewLimits() {
  const { subscription } = useAuth();
  const { data: employerProfile } = useEmployerProfile();
  const queryClient = useQueryClient();

  // Count unique candidate views for this employer
  const { data: viewedCandidatesCount = 0, isLoading } = useQuery({
    queryKey: ["candidate_views_count", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return 0;

      const { count, error } = await supabase
        .from("candidate_profile_views")
        .select("*", { count: "exact", head: true })
        .eq("employer_id", employerProfile.id);

      if (error) {
        console.error("Error counting candidate views:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!employerProfile?.id,
  });

  // Get list of viewed welder IDs
  const { data: viewedWelderIds = [] } = useQuery({
    queryKey: ["viewed_welder_ids", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];

      const { data, error } = await supabase
        .from("candidate_profile_views")
        .select("welder_id")
        .eq("employer_id", employerProfile.id);

      if (error) {
        console.error("Error fetching viewed welders:", error);
        return [];
      }

      return data.map((v) => v.welder_id);
    },
    enabled: !!employerProfile?.id,
  });

  // Record a new candidate view
  const recordViewMutation = useMutation({
    mutationFn: async ({
      welderId,
      applicationId,
    }: {
      welderId: string;
      applicationId?: string;
    }) => {
      if (!employerProfile?.id) throw new Error("No employer profile");

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase.from("candidate_profile_views").upsert(
        {
          employer_id: employerProfile.id,
          welder_id: welderId,
          application_id: applicationId || null,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "employer_id,welder_id",
          ignoreDuplicates: true,
        }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate_views_count", employerProfile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["viewed_welder_ids", employerProfile?.id],
      });
    },
  });

  const plan = subscription.plan;
  const limits = getPlanLimits(plan);
  const maxViews = limits.maxCandidateViews;
  const isUnlimited = maxViews === -1;
  const canViewMore = isUnlimited || viewedCandidatesCount < maxViews;
  const remainingViews = isUnlimited
    ? ("unlimited" as const)
    : Math.max(0, maxViews - viewedCandidatesCount);

  // Check if a specific welder has been viewed
  const hasViewedWelder = (welderId: string) => viewedWelderIds.includes(welderId);

  // Check if can view a specific welder (already viewed or has remaining views)
  const canViewWelder = (welderId: string) => {
    if (isUnlimited) return true;
    if (hasViewedWelder(welderId)) return true;
    return viewedCandidatesCount < maxViews;
  };

  return {
    viewedCandidatesCount,
    maxCandidateViews: maxViews,
    canViewMore,
    remainingViews,
    isUnlimited,
    isLoading,
    plan,
    viewedWelderIds,
    hasViewedWelder,
    canViewWelder,
    recordView: recordViewMutation.mutate,
    isRecordingView: recordViewMutation.isPending,
  };
}
