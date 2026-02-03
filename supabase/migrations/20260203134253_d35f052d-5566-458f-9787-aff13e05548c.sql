-- Fix RLS policy for welder_profiles - UPDATE needs WITH CHECK clause
-- The existing policy has USING but no WITH CHECK, causing updates to silently fail

-- Drop the problematic all-in-one policy
DROP POLICY IF EXISTS "Welders can manage own profile" ON public.welder_profiles;

-- Create separate policies with proper WITH CHECK clauses
CREATE POLICY "Welders can select own profile"
ON public.welder_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Welders can update own profile"
ON public.welder_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Welders can delete own profile"
ON public.welder_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());