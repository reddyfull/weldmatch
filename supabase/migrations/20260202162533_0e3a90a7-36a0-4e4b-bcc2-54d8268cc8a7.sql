-- Fix overly-permissive RLS policy flagged by linter (WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can log profile access" ON public.profile_access_logs;

CREATE POLICY "Public can log profile access"
ON public.profile_access_logs
FOR INSERT
TO public
WITH CHECK (
  welder_id IS NOT NULL
  AND access_type IS NOT NULL
  AND access_type IN ('view','download_resume','contact_click')
  AND (viewer_user_agent IS NULL OR length(viewer_user_agent) <= 512)
  AND (viewer_ip IS NULL OR viewer_ip = 'unknown' OR length(viewer_ip) <= 64)
);
