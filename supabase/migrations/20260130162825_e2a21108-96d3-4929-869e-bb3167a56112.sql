-- Create market intelligence results table for caching
CREATE TABLE public.market_intelligence_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL,
  request_context JSONB,
  profile_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT market_intelligence_results_welder_id_key UNIQUE (welder_id)
);

-- Enable RLS
ALTER TABLE public.market_intelligence_results ENABLE ROW LEVEL SECURITY;

-- Create policy for welders to manage their own results
CREATE POLICY "Welders can manage own market intelligence results"
  ON public.market_intelligence_results
  FOR ALL
  USING (welder_id IN (
    SELECT id FROM welder_profiles WHERE user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_market_intelligence_results_updated_at
  BEFORE UPDATE ON public.market_intelligence_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();