-- Fix RLS infinite recursion between profiles <-> welder_profiles
-- The existing welder_profiles SELECT policy calls get_user_type(), which SELECTs from profiles.
-- profiles SELECT policies reference welder_profiles, creating a recursion loop and 500 errors.

DROP POLICY IF EXISTS "Employers can view welder profiles" ON public.welder_profiles;

CREATE POLICY "Employers can view welder profiles"
ON public.welder_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.employer_profiles ep
    WHERE ep.user_id = auth.uid()
  )
);
