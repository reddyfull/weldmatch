-- Fix the get_user_type function to bypass RLS when checking user types
-- This is needed because RLS policies call this function, creating a circular dependency

CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS public.user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE id = _user_id
$$;

-- Also fix the can_view_profile function if it exists
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Users can always view their own profile
    auth.uid() = _profile_id
    OR
    -- Employers can view profiles of applicants to their jobs
    EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      JOIN public.employer_profiles ep ON j.employer_id = ep.id
      WHERE a.welder_id IN (
        SELECT id FROM public.welder_profiles WHERE user_id = _profile_id
      )
      AND ep.user_id = auth.uid()
    )
$$;