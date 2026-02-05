-- Create table to track candidate profile views by employers
CREATE TABLE public.candidate_profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint to prevent duplicate counting for same employer-welder pair
  UNIQUE(employer_id, welder_id)
);

-- Enable RLS
ALTER TABLE public.candidate_profile_views ENABLE ROW LEVEL SECURITY;

-- Employers can view their own profile view records
CREATE POLICY "Employers can view their own profile views"
ON public.candidate_profile_views
FOR SELECT
USING (
  employer_id IN (
    SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
  )
);

-- Employers can insert their own profile views
CREATE POLICY "Employers can insert their own profile views"
ON public.candidate_profile_views
FOR INSERT
WITH CHECK (
  employer_id IN (
    SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_candidate_profile_views_employer ON public.candidate_profile_views(employer_id);
CREATE INDEX idx_candidate_profile_views_welder ON public.candidate_profile_views(welder_id);