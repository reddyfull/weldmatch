import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_type: "welder" | "employer" | "admin";
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WelderProfile {
  id: string;
  user_id: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
  years_experience: number;
  weld_processes: string[];
  weld_positions: string[];
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_type: "hourly" | "annual" | null;
  willing_to_travel: boolean;
  bio: string | null;
  is_available: boolean;
  profile_completion: number;
  profile_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
  industry: string | null;
  company_size: "1-10" | "11-50" | "51-200" | "200+" | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  subscription_plan: "free_trial" | "starter" | "pro" | "enterprise";
  subscription_status: "trial" | "active" | "past_due" | "cancelled";
  trial_ends_at: string | null;
  profile_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
    enabled: !!user?.id,
  });
}

export function useWelderProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["welder_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("welder_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as WelderProfile | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute - prevents stale reads
    refetchOnWindowFocus: false,
  });
}

export function useEmployerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employer_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EmployerProfile | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute - prevents stale reads
    refetchOnWindowFocus: false,
  });
}

export function useCreateWelderProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<WelderProfile>) => {
      if (!user?.id) throw new Error("No user");

      // Use upsert to handle users returning to setup after a profile already exists.
      // `welder_profiles.user_id` is UNIQUE, so insert would fail with a duplicate key error.
      const { data: profile, error } = await supabase
        .from("welder_profiles")
        .upsert(
          {
            ...data,
            user_id: user.id,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welder_profile", user?.id] });
    },
  });
}

export function useUpdateWelderProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<WelderProfile>) => {
      if (!user?.id) throw new Error("No user");

      const { data: profile, error } = await supabase
        .from("welder_profiles")
        .update(data)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welder_profile", user?.id] });
    },
  });
}

export function useCreateEmployerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<EmployerProfile>) => {
      if (!user?.id) throw new Error("No user");

      // Use upsert to handle users returning to setup after a profile already exists.
      const { data: profile, error } = await supabase
        .from("employer_profiles")
        .upsert(
          {
            ...data,
            user_id: user.id,
            company_name: data.company_name ?? "My Company",
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer_profile", user?.id] });
    },
  });
}

export function useUpdateEmployerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<EmployerProfile>) => {
      if (!user?.id) throw new Error("No user");

      const { data: profile, error } = await supabase
        .from("employer_profiles")
        .update(data)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer_profile", user?.id] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (!user?.id) throw new Error("No user");

      const { data: profile, error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
