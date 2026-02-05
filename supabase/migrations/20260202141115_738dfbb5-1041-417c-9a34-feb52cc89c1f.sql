-- Add new columns to welder_profiles for public portfolio
ALTER TABLE public.welder_profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE,
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS looking_for_work BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS open_to_opportunities BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS professional_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS tagline VARCHAR(200),
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_date DATE,
ADD COLUMN IF NOT EXISTS work_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS travel_scope VARCHAR(50),
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS relocation_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS minimum_hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rate_negotiable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_welder_profiles_username ON public.welder_profiles(username);

-- Create welder_work_experience table
CREATE TABLE IF NOT EXISTS public.welder_work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  company_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on work experience
ALTER TABLE public.welder_work_experience ENABLE ROW LEVEL SECURITY;

-- Welders can manage their own work experience
CREATE POLICY "Welders can manage own work experience"
ON public.welder_work_experience FOR ALL
USING (welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid()));

-- Anyone can view work experience (for public profiles)
CREATE POLICY "Anyone can view work experience"
ON public.welder_work_experience FOR SELECT
USING (true);

-- Create welder_portfolio_items table
CREATE TABLE IF NOT EXISTS public.welder_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  project_type VARCHAR(50),
  date_completed DATE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on portfolio items
ALTER TABLE public.welder_portfolio_items ENABLE ROW LEVEL SECURITY;

-- Welders can manage their own portfolio items
CREATE POLICY "Welders can manage own portfolio items"
ON public.welder_portfolio_items FOR ALL
USING (welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid()));

-- Anyone can view portfolio items (for public profiles)
CREATE POLICY "Anyone can view portfolio items"
ON public.welder_portfolio_items FOR SELECT
USING (true);

-- Create welder_equipment table
CREATE TABLE IF NOT EXISTS public.welder_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  equipment_type VARCHAR(50) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(100),
  owned BOOLEAN DEFAULT true,
  proficiency VARCHAR(20) DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on equipment
ALTER TABLE public.welder_equipment ENABLE ROW LEVEL SECURITY;

-- Welders can manage their own equipment
CREATE POLICY "Welders can manage own equipment"
ON public.welder_equipment FOR ALL
USING (welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid()));

-- Anyone can view equipment (for public profiles)
CREATE POLICY "Anyone can view equipment"
ON public.welder_equipment FOR SELECT
USING (true);

-- Create profile_access_logs table for analytics
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welder_id UUID NOT NULL REFERENCES public.welder_profiles(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  access_type VARCHAR(30) NOT NULL,
  referrer TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert access logs (for anonymous views)
CREATE POLICY "Anyone can log profile access"
ON public.profile_access_logs FOR INSERT
WITH CHECK (true);

-- Welders can view their own access logs
CREATE POLICY "Welders can view own access logs"
ON public.profile_access_logs FOR SELECT
USING (welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_welder_work_experience_updated_at
  BEFORE UPDATE ON public.welder_work_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_welder_portfolio_items_updated_at
  BEFORE UPDATE ON public.welder_portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get profile by username (for public access)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username VARCHAR)
RETURNS TABLE (
  profile_data JSONB,
  is_public BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_welder_id UUID;
  v_visibility VARCHAR;
BEGIN
  -- Find the welder by username
  SELECT wp.id, wp.profile_visibility INTO v_welder_id, v_visibility
  FROM welder_profiles wp
  WHERE wp.username = p_username;
  
  IF v_welder_id IS NULL THEN
    RETURN QUERY SELECT NULL::JSONB, false;
    RETURN;
  END IF;
  
  -- Check visibility
  IF v_visibility = 'private' THEN
    RETURN QUERY SELECT NULL::JSONB, false;
    RETURN;
  END IF;
  
  -- Increment view count (don't count if viewer is owner)
  IF auth.uid() IS NULL OR auth.uid() != (SELECT user_id FROM welder_profiles WHERE id = v_welder_id) THEN
    UPDATE welder_profiles SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = v_welder_id;
  END IF;
  
  -- Return profile data
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'welder_profile', row_to_json(wp),
      'profile', row_to_json(p),
      'certifications', (SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) FROM certifications c WHERE c.welder_id = wp.id),
      'work_experience', (SELECT COALESCE(jsonb_agg(row_to_json(we) ORDER BY we.start_date DESC), '[]'::jsonb) FROM welder_work_experience we WHERE we.welder_id = wp.id),
      'portfolio_items', (SELECT COALESCE(jsonb_agg(row_to_json(pi) ORDER BY pi.display_order), '[]'::jsonb) FROM welder_portfolio_items pi WHERE pi.welder_id = wp.id),
      'equipment', (SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb) FROM welder_equipment e WHERE e.welder_id = wp.id),
      'work_samples', (SELECT COALESCE(jsonb_agg(row_to_json(ws)), '[]'::jsonb) FROM work_samples ws WHERE ws.welder_id = wp.id)
    ),
    true
  FROM welder_profiles wp
  JOIN profiles p ON p.id = wp.user_id
  WHERE wp.id = v_welder_id;
END;
$$;

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(p_username VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved_words TEXT[] := ARRAY['admin', 'api', 'app', 'dashboard', 'login', 'signup', 'settings', 'profile', 'welder', 'employer', 'jobs', 'search', 'help', 'support', 'about', 'contact', 'terms', 'privacy', 'blog', 'news', 'careers', 'pricing', 'demo', 'test', 'www', 'mail', 'ftp', 'static', 'assets', 'images', 'css', 'js', 'weldmatch'];
BEGIN
  -- Check length
  IF length(p_username) < 3 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Username must be at least 3 characters');
  END IF;
  
  IF length(p_username) > 30 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Username must be 30 characters or less');
  END IF;
  
  -- Check format (lowercase letters, numbers, hyphens only)
  IF p_username !~ '^[a-z0-9-]+$' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Username can only contain lowercase letters, numbers, and hyphens');
  END IF;
  
  -- Check reserved words
  IF p_username = ANY(v_reserved_words) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This username is reserved');
  END IF;
  
  -- Check if already taken
  IF EXISTS (SELECT 1 FROM welder_profiles WHERE username = p_username) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This username is already taken');
  END IF;
  
  RETURN jsonb_build_object('available', true, 'reason', NULL);
END;
$$;