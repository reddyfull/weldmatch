-- Tighten employer_profiles SELECT policy: ONLY owners can read from the main table directly.
-- Welders and other non-owners should query the employer_profiles_public view instead.

-- Drop the current policy that allows viewing employer profiles with active jobs
DROP POLICY IF EXISTS "Authenticated users can view public employer info" ON public.employer_profiles;

-- Create a strict owner-only SELECT policy
CREATE POLICY "Owners can view own employer profile"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());