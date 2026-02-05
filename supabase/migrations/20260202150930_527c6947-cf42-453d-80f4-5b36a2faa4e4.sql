-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view employer profiles" ON public.employer_profiles;

-- Create a public view with only non-sensitive fields
CREATE VIEW public.employer_profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  company_name,
  description,
  logo_url,
  website,
  industry,
  company_size,
  city,
  state
FROM public.employer_profiles;

-- Allow authenticated users to view the public view
CREATE POLICY "Authenticated users can view public employer info"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (
  -- Employers can see their own full profile
  user_id = auth.uid()
  -- Or it's accessed through a job application context
  OR id IN (
    SELECT DISTINCT j.employer_id 
    FROM jobs j 
    WHERE j.status = 'active'
  )
);