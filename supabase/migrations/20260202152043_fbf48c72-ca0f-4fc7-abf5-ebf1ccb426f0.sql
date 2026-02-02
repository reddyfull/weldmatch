-- The current policy is too complex and may cause issues
-- Replace with a simpler policy that allows users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Simple policy: Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add a separate policy for viewing other profiles in context (job applications, etc.)
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Employers can view welder profiles for candidates who applied
  id IN (
    SELECT wp.user_id FROM welder_profiles wp
    WHERE wp.id IN (
      SELECT a.welder_id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      WHERE ep.user_id = auth.uid()
    )
  )
  -- Welders can view employer profiles for active jobs
  OR id IN (
    SELECT ep.user_id FROM employer_profiles ep
    WHERE ep.id IN (
      SELECT j.employer_id FROM jobs j WHERE j.status = 'active'
    )
  )
);