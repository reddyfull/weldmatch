-- Create table for storing profile strength analysis results
CREATE TABLE public.profile_strength_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  welder_id UUID NOT NULL UNIQUE REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL,
  profile_snapshot JSONB,
  certifications_snapshot TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_strength_results ENABLE ROW LEVEL SECURITY;

-- Create policy for welders to manage their own results
CREATE POLICY "Welders can manage own profile strength results"
ON public.profile_strength_results
FOR ALL
USING (welder_id IN (
  SELECT id FROM welder_profiles WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_profile_strength_results_updated_at
  BEFORE UPDATE ON public.profile_strength_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();