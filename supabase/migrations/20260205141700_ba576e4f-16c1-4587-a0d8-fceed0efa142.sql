-- Fix RLS recursion between welder_profiles <-> employer_profiles
-- by moving cross-table checks into SECURITY DEFINER helper functions.

-- 1) Helper functions (bypass RLS inside function)
CREATE OR REPLACE FUNCTION public.employer_can_view_welder_profile(_welder_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.employer_profiles ep
      JOIN public.jobs j ON j.employer_id = ep.id
      JOIN public.applications a ON a.job_id = j.id
      WHERE ep.user_id = auth.uid()
        AND a.welder_id = _welder_profile_id
    );
$$;

CREATE OR REPLACE FUNCTION public.welder_can_view_employer_profile(_employer_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      -- Welders can view employers with active jobs
      EXISTS (
        SELECT 1
        FROM public.jobs j
        WHERE j.employer_id = _employer_profile_id
          AND j.status = 'active'::public.job_status
      )
      OR
      -- Welders can view employers they have applied to
      EXISTS (
        SELECT 1
        FROM public.welder_profiles wp
        JOIN public.applications a ON a.welder_id = wp.id
        JOIN public.jobs j ON j.id = a.job_id
        WHERE wp.user_id = auth.uid()
          AND j.employer_id = _employer_profile_id
      )
    );
$$;

-- 2) Replace recursive SELECT policies
DO $$
BEGIN
  -- employer_profiles SELECT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='employer_profiles'
      AND policyname='Welders can view employer profiles for active jobs or applicati'
  ) THEN
    EXECUTE 'DROP POLICY "Welders can view employer profiles for active jobs or applicati" ON public.employer_profiles';
  END IF;

  -- welder_profiles recursive SELECT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='welder_profiles'
      AND policyname='Employers can view profiles of applicants to their jobs'
  ) THEN
    EXECUTE 'DROP POLICY "Employers can view profiles of applicants to their jobs" ON public.welder_profiles';
  END IF;
END $$;

-- employer_profiles: allow employers to view their own profile
CREATE POLICY "Employers can view own employer profile"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- employer_profiles: allow welders to view employer profiles via helper function
CREATE POLICY "Welders can view employer profiles (safe)"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (public.welder_can_view_employer_profile(id));

-- welder_profiles: allow employers to view applicant profiles via helper function
CREATE POLICY "Employers can view applicant welder profiles (safe)"
ON public.welder_profiles
FOR SELECT
TO authenticated
USING (public.employer_can_view_welder_profile(id));

-- welder_profiles: allow public viewing of explicitly public profiles
CREATE POLICY "Public can view public welder profiles"
ON public.welder_profiles
FOR SELECT
TO public
USING ((profile_visibility)::text = 'public'::text);
