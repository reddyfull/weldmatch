-- Fix welder_profiles_pii_exposure: Restrict employer access to only welders who applied to their jobs
-- Fix jobs_table_business_exposure: Restrict access to only active jobs for public viewing

-- First, drop existing overly permissive policies on welder_profiles
DROP POLICY IF EXISTS "Employers can view welder profiles" ON public.welder_profiles;

-- Create more restrictive policy: Employers can only view profiles of welders who applied to their jobs
CREATE POLICY "Employers can view profiles of applicants to their jobs"
ON public.welder_profiles
FOR SELECT
USING (
  -- Owner can always view their own profile
  user_id = auth.uid()
  OR
  -- Employers can view profiles of welders who applied to their jobs
  (
    get_user_type(auth.uid()) = 'employer'::user_type
    AND EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE a.welder_id = welder_profiles.id
      AND ep.user_id = auth.uid()
    )
  )
  OR
  -- Public profiles can be viewed by anyone (for /w/:username route)
  (profile_visibility = 'public')
);

-- Fix jobs table: Only show active jobs to non-owners
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are publicly viewable" ON public.jobs;

-- Create policy that only shows active jobs publicly, but owners can see all their jobs
CREATE POLICY "Active jobs are publicly viewable"
ON public.jobs
FOR SELECT
USING (
  -- Owner (employer) can see all their jobs including drafts
  EXISTS (
    SELECT 1 FROM employer_profiles ep
    WHERE ep.id = jobs.employer_id
    AND ep.user_id = auth.uid()
  )
  OR
  -- Everyone else can only see active jobs
  status = 'active'
);