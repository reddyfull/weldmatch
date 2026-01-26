-- Create the external_jobs table
CREATE TABLE public.external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- External identifiers
  external_id TEXT UNIQUE NOT NULL,
  
  -- Basic job info
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  
  -- Location
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  is_remote BOOLEAN DEFAULT false,
  
  -- Job details
  description TEXT,
  description_snippet TEXT,
  employment_type TEXT,
  
  -- Salary
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_period TEXT,
  salary_display TEXT,
  
  -- Apply info
  apply_link TEXT NOT NULL,
  apply_is_direct BOOLEAN DEFAULT false,
  
  -- Source tracking
  source TEXT,
  source_link TEXT,
  
  -- Dates
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Requirements
  required_experience_months INTEGER,
  required_skills TEXT[],
  required_education TEXT,
  
  -- Search metadata
  search_query TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for external_jobs
CREATE INDEX idx_external_jobs_external_id ON public.external_jobs(external_id);
CREATE INDEX idx_external_jobs_location ON public.external_jobs(city, state);
CREATE INDEX idx_external_jobs_posted_at ON public.external_jobs(posted_at DESC);
CREATE INDEX idx_external_jobs_is_active ON public.external_jobs(is_active);
CREATE INDEX idx_external_jobs_company ON public.external_jobs(company);

-- Enable RLS on external_jobs
ALTER TABLE public.external_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can read active external jobs
CREATE POLICY "External jobs are viewable by everyone"
  ON public.external_jobs FOR SELECT
  USING (is_active = true);

-- Create welder_job_interactions table
CREATE TABLE public.welder_job_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  external_job_id UUID NOT NULL REFERENCES public.external_jobs(id) ON DELETE CASCADE,
  
  -- AI matching
  match_score INTEGER,
  match_reason TEXT,
  missing_skills TEXT[],
  
  -- User actions
  status TEXT DEFAULT 'new',
  
  -- Timestamps
  first_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  saved_at TIMESTAMPTZ,
  clicked_apply_at TIMESTAMPTZ,
  marked_applied_at TIMESTAMPTZ,
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User notes
  notes TEXT,
  
  -- Unique constraint
  UNIQUE(welder_id, external_job_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for welder_job_interactions
CREATE INDEX idx_welder_job_interactions_welder ON public.welder_job_interactions(welder_id);
CREATE INDEX idx_welder_job_interactions_status ON public.welder_job_interactions(welder_id, status);

-- Enable RLS on welder_job_interactions
ALTER TABLE public.welder_job_interactions ENABLE ROW LEVEL SECURITY;

-- Welders can view their own interactions
CREATE POLICY "Welders can view own interactions"
  ON public.welder_job_interactions FOR SELECT
  USING (welder_id IN (
    SELECT id FROM public.welder_profiles WHERE user_id = auth.uid()
  ));

-- Welders can insert their own interactions
CREATE POLICY "Welders can insert own interactions"
  ON public.welder_job_interactions FOR INSERT
  WITH CHECK (welder_id IN (
    SELECT id FROM public.welder_profiles WHERE user_id = auth.uid()
  ));

-- Welders can update their own interactions
CREATE POLICY "Welders can update own interactions"
  ON public.welder_job_interactions FOR UPDATE
  USING (welder_id IN (
    SELECT id FROM public.welder_profiles WHERE user_id = auth.uid()
  ));

-- Create job_aggregator_logs table
CREATE TABLE public.job_aggregator_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run info
  run_type TEXT NOT NULL,
  search_query TEXT,
  location TEXT,
  
  -- Results
  jobs_fetched INTEGER DEFAULT 0,
  jobs_added INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_skipped INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'running',
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at on external_jobs
CREATE TRIGGER update_external_jobs_updated_at
  BEFORE UPDATE ON public.external_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on welder_job_interactions
CREATE TRIGGER update_welder_job_interactions_updated_at
  BEFORE UPDATE ON public.welder_job_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();