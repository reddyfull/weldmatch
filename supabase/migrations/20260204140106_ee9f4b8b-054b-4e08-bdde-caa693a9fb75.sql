-- Add policy for welders to view employer profiles only for legitimate business relationships
-- (employers with active jobs or employers whose jobs they've applied to)

CREATE POLICY "Welders can view employer profiles for active jobs or applications"
ON public.employer_profiles
FOR SELECT
USING (
  -- Allow welders to see employers who have active jobs
  (
    get_user_type(auth.uid()) = 'employer'::user_type AND user_id = auth.uid()
  )
  OR
  (
    get_user_type(auth.uid()) = 'welder'::user_type
    AND (
      -- Employer has active jobs
      EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.employer_id = employer_profiles.id
        AND j.status = 'active'
      )
      OR
      -- Welder has applied to one of employer's jobs
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN welder_profiles wp ON a.welder_id = wp.id
        WHERE j.employer_id = employer_profiles.id
        AND wp.user_id = auth.uid()
      )
    )
  )
);

-- Drop the overly permissive policies and keep only specific ones
DROP POLICY IF EXISTS "Employers can manage own profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Owners can view own employer profile" ON public.employer_profiles;

-- Keep the insert policy and add back a proper update policy
CREATE POLICY "Employers can update own profile"
ON public.employer_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employers can delete own profile"
ON public.employer_profiles
FOR DELETE
USING (user_id = auth.uid());