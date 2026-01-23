-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table to store career coach results
CREATE TABLE public.career_coach_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL,
  checked_actions TEXT[] DEFAULT '{}'::TEXT[],
  profile_snapshot JSONB,
  certifications_snapshot TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(welder_id)
);

-- Enable RLS
ALTER TABLE public.career_coach_results ENABLE ROW LEVEL SECURITY;

-- Welders can manage their own career coach results
CREATE POLICY "Welders can manage own career coach results"
ON public.career_coach_results
FOR ALL
USING (welder_id IN (
  SELECT id FROM welder_profiles WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_career_coach_results_updated_at
BEFORE UPDATE ON public.career_coach_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();