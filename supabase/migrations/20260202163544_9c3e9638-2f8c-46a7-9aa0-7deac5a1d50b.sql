-- Eliminate 500s caused by RLS recursion by moving cross-table checks into a SECURITY DEFINER function
-- (so RLS on referenced tables is not re-entered during policy evaluation).

CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Always allow users to view their own profile
    (_profile_id = auth.uid())

    -- Employers can view profiles of welders who applied to their jobs
    OR EXISTS (
      SELECT 1
      FROM employer_profiles ep
      JOIN jobs j ON j.employer_id = ep.id
      JOIN applications a ON a.job_id = j.id
      JOIN welder_profiles wp ON wp.id = a.welder_id
      WHERE ep.user_id = auth.uid()
        AND wp.user_id = _profile_id
    )

    -- Authenticated users can view employer profiles tied to active jobs
    OR EXISTS (
      SELECT 1
      FROM employer_profiles ep
      JOIN jobs j ON j.employer_id = ep.id
      WHERE j.status = 'active'::job_status
        AND ep.user_id = _profile_id
    );
$$;

DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;

CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));
