-- Drop the overly permissive policy on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more restrictive policy - users can only view their own profile
-- or profiles of users they interact with (employers viewing welder profiles, etc.)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  auth.uid() = id
  -- Employers can view profiles of welders who applied to their jobs
  OR id IN (
    SELECT wp.user_id FROM welder_profiles wp
    WHERE wp.id IN (
      SELECT a.welder_id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE ep.user_id = auth.uid()
    )
  )
  -- Welders can view employer user profiles (for job context)
  OR id IN (
    SELECT ep.user_id FROM employer_profiles ep
    WHERE ep.id IN (
      SELECT j.employer_id FROM jobs j WHERE j.status = 'active'
    )
  )
);