-- Create job_templates table for saving reusable job descriptions
CREATE TABLE public.job_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  job_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

-- Employers can manage their own templates
CREATE POLICY "Employers can view own templates"
  ON public.job_templates
  FOR SELECT
  USING (employer_id IN (
    SELECT id FROM employer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Employers can insert own templates"
  ON public.job_templates
  FOR INSERT
  WITH CHECK (employer_id IN (
    SELECT id FROM employer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Employers can update own templates"
  ON public.job_templates
  FOR UPDATE
  USING (employer_id IN (
    SELECT id FROM employer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Employers can delete own templates"
  ON public.job_templates
  FOR DELETE
  USING (employer_id IN (
    SELECT id FROM employer_profiles WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_job_templates_updated_at
  BEFORE UPDATE ON public.job_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();