-- Enable RLS on job_aggregator_logs (only service role should access this)
ALTER TABLE public.job_aggregator_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view aggregator logs
CREATE POLICY "Admins can view aggregator logs"
  ON public.job_aggregator_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));