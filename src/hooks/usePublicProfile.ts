import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "./useUserProfile";

export interface PublicProfileData {
  welder_profile: {
    id: string;
    user_id: string;
    username: string | null;
    profile_visibility: string;
    looking_for_work: boolean;
    open_to_opportunities: boolean;
    cover_photo_url: string | null;
    professional_title: string | null;
    tagline: string | null;
    bio: string | null;
    highlights: string[];
    city: string | null;
    state: string | null;
    years_experience: number | null;
    weld_processes: string[];
    weld_positions: string[];
    willing_to_travel: boolean;
    travel_scope: string | null;
    willing_to_relocate: boolean;
    relocation_preferences: string[];
    available_date: string | null;
    work_types: string[];
    minimum_hourly_rate: number | null;
    rate_negotiable: boolean;
    desired_salary_min: number | null;
    desired_salary_max: number | null;
    show_phone: boolean;
    show_email: boolean;
    linkedin_url: string | null;
    instagram_url: string | null;
    profile_views: number;
    is_available: boolean;
  };
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  certifications: Array<{
    id: string;
    cert_type: string;
    cert_name: string | null;
    issuing_body: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    verification_status: string;
  }>;
  work_experience: Array<{
    id: string;
    company_name: string;
    job_title: string;
    location: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
    highlights: string[];
  }>;
  portfolio_items: Array<{
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
    project_type: string | null;
    date_completed: string | null;
    is_featured: boolean;
  }>;
  equipment: Array<{
    id: string;
    equipment_type: string;
    brand: string | null;
    model: string | null;
    owned: boolean;
    proficiency: string;
  }>;
  work_samples: Array<{
    id: string;
    file_url: string;
    description: string | null;
    file_type: string | null;
  }>;
}

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ["public_profile", username],
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .rpc("get_public_profile", { p_username: username });

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0] as { profile_data: unknown; is_public: boolean };
      if (!result.is_public) {
        return null;
      }

      return result.profile_data as PublicProfileData;
    },
    enabled: !!username,
  });
}

export function useCheckUsername() {
  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase
        .rpc("check_username_available", { p_username: username });

      if (error) throw error;
      return data as { available: boolean; reason: string | null };
    },
  });
}

export function useClaimUsername() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // First check availability
      const { data: checkResult, error: checkError } = await supabase
        .rpc("check_username_available", { p_username: username });

      if (checkError) throw checkError;
      
      const result = checkResult as { available: boolean; reason: string | null };
      if (!result.available) {
        throw new Error(result.reason || "Username not available");
      }

      // Claim the username
      const { error } = await supabase
        .from("welder_profiles")
        .update({ username })
        .eq("user_id", user.id);

      if (error) throw error;
      return username;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welder_profile"] });
    },
  });
}

export function useLogProfileAccess() {
  return useMutation({
    mutationFn: async ({
      welderId,
      accessType,
    }: {
      welderId: string;
      accessType: "view" | "resume_download" | "contact_click" | "share";
    }) => {
      const { error } = await supabase.from("profile_access_logs").insert({
        welder_id: welderId,
        access_type: accessType,
        viewer_user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });

      if (error) throw error;
    },
  });
}

export function useProfileAnalytics() {
  const { data: welderProfile } = useWelderProfile();

  return useQuery({
    queryKey: ["profile_analytics", welderProfile?.id],
    queryFn: async () => {
      if (!welderProfile?.id) return null;

      // Get total views
      const { count: totalViews } = await supabase
        .from("profile_access_logs")
        .select("*", { count: "exact", head: true })
        .eq("welder_id", welderProfile.id)
        .eq("access_type", "view");

      // Get resume downloads
      const { count: resumeDownloads } = await supabase
        .from("profile_access_logs")
        .select("*", { count: "exact", head: true })
        .eq("welder_id", welderProfile.id)
        .eq("access_type", "resume_download");

      // Get contact clicks
      const { count: contactClicks } = await supabase
        .from("profile_access_logs")
        .select("*", { count: "exact", head: true })
        .eq("welder_id", welderProfile.id)
        .eq("access_type", "contact_click");

      // Get views by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentViews } = await supabase
        .from("profile_access_logs")
        .select("accessed_at")
        .eq("welder_id", welderProfile.id)
        .eq("access_type", "view")
        .gte("accessed_at", thirtyDaysAgo.toISOString())
        .order("accessed_at", { ascending: true });

      // Group by day
      const viewsByDay: Record<string, number> = {};
      recentViews?.forEach((log) => {
        const day = new Date(log.accessed_at).toISOString().split("T")[0];
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      });

      return {
        totalViews: totalViews || 0,
        resumeDownloads: resumeDownloads || 0,
        contactClicks: contactClicks || 0,
        viewsByDay,
      };
    },
    enabled: !!welderProfile?.id,
  });
}

// Calculate profile completeness score
export function calculateProfileCompleteness(profile: PublicProfileData | null): {
  score: number;
  missing: string[];
} {
  if (!profile) return { score: 0, missing: [] };

  const missing: string[] = [];
  let score = 0;

  // Basic info (20%)
  if (profile.profile.full_name && profile.profile.avatar_url) {
    score += 10;
  } else {
    missing.push("Profile photo");
  }
  if (profile.welder_profile.professional_title) {
    score += 10;
  } else {
    missing.push("Professional title");
  }

  // Certifications (20%)
  if (profile.certifications.length > 0) {
    score += 20;
  } else {
    missing.push("Certifications");
  }

  // Work experience (20%)
  if (profile.work_experience.length > 0) {
    score += 20;
  } else {
    missing.push("Work experience");
  }

  // Skills/processes (15%)
  if (profile.welder_profile.weld_processes.length > 0 && profile.welder_profile.weld_positions.length > 0) {
    score += 15;
  } else {
    missing.push("Skills & processes");
  }

  // Portfolio items (15%)
  if (profile.portfolio_items.length >= 3 || profile.work_samples.length >= 3) {
    score += 15;
  } else {
    missing.push("Portfolio photos (min 3)");
  }

  // Availability info (10%)
  if (profile.welder_profile.work_types.length > 0 || profile.welder_profile.available_date) {
    score += 10;
  } else {
    missing.push("Availability info");
  }

  return { score, missing };
}
