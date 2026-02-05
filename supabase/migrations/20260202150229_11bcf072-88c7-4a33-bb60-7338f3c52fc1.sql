-- Create table for storing generated resumes
CREATE TABLE public.generated_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  resume_data JSONB NOT NULL,
  form_data JSONB,
  ats_score INTEGER DEFAULT 75,
  suggestions TEXT[] DEFAULT '{}',
  format_style VARCHAR(50) DEFAULT 'professional',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_welder_resume UNIQUE (welder_id)
);

-- Enable RLS
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Welders can manage own resumes"
ON public.generated_resumes
FOR ALL
USING (welder_id IN (
  SELECT id FROM welder_profiles WHERE user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_generated_resumes_updated_at
BEFORE UPDATE ON public.generated_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();