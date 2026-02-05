-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_type AS ENUM ('welder', 'employer', 'admin');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'expired', 'invalid');
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'per_diem');
CREATE TYPE public.pay_type AS ENUM ('hourly', 'salary', 'doe');
CREATE TYPE public.job_status AS ENUM ('draft', 'active', 'paused', 'filled', 'expired');
CREATE TYPE public.application_status AS ENUM ('new', 'reviewing', 'interview', 'offer', 'hired', 'rejected');
CREATE TYPE public.company_size AS ENUM ('1-10', '11-50', '51-200', '200+');
CREATE TYPE public.subscription_plan AS ENUM ('free_trial', 'starter', 'pro', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');
CREATE TYPE public.salary_type AS ENUM ('hourly', 'annual');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table (for admin access control)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type public.user_type NOT NULL DEFAULT 'welder',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Welder profiles
CREATE TABLE public.welder_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  years_experience INTEGER DEFAULT 0,
  weld_processes TEXT[] DEFAULT '{}',
  weld_positions TEXT[] DEFAULT '{}',
  desired_salary_min DECIMAL(10, 2),
  desired_salary_max DECIMAL(10, 2),
  salary_type public.salary_type,
  willing_to_travel BOOLEAN DEFAULT FALSE,
  bio TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications
CREATE TABLE public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  welder_id UUID REFERENCES public.welder_profiles(id) ON DELETE CASCADE NOT NULL,
  cert_type TEXT NOT NULL,
  cert_number TEXT,
  cert_name TEXT,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  verification_status public.verification_status DEFAULT 'pending',
  ai_extracted_data JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employer profiles
CREATE TABLE public.employer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  industry TEXT,
  company_size public.company_size,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  stripe_customer_id TEXT,
  subscription_plan public.subscription_plan DEFAULT 'free_trial',
  subscription_status public.subscription_status DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  job_type public.job_type NOT NULL DEFAULT 'full_time',
  pay_type public.pay_type,
  pay_min DECIMAL(10, 2),
  pay_max DECIMAL(10, 2),
  required_certs TEXT[] DEFAULT '{}',
  required_processes TEXT[] DEFAULT '{}',
  required_positions TEXT[] DEFAULT '{}',
  experience_min INTEGER DEFAULT 0,
  benefits TEXT[] DEFAULT '{}',
  start_date DATE,
  status public.job_status DEFAULT 'draft',
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Applications
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  welder_id UUID REFERENCES public.welder_profiles(id) ON DELETE CASCADE NOT NULL,
  cover_message TEXT,
  status public.application_status DEFAULT 'new',
  match_score INTEGER,
  employer_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, welder_id)
);

-- Work samples
CREATE TABLE public.work_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  welder_id UUID REFERENCES public.welder_profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_welder_location ON public.welder_profiles(lat, lng);
CREATE INDEX idx_welder_processes ON public.welder_profiles USING GIN(weld_processes);
CREATE INDEX idx_welder_positions ON public.welder_profiles USING GIN(weld_positions);
CREATE INDEX idx_welder_available ON public.welder_profiles(is_available) WHERE is_available = true;
CREATE INDEX idx_job_location ON public.jobs(lat, lng);
CREATE INDEX idx_job_certs ON public.jobs USING GIN(required_certs);
CREATE INDEX idx_job_processes ON public.jobs USING GIN(required_processes);
CREATE INDEX idx_job_status ON public.jobs(status) WHERE status = 'active';
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_welder ON public.applications(welder_id);
CREATE INDEX idx_certs_status ON public.certifications(verification_status);
CREATE INDEX idx_certs_welder ON public.certifications(welder_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_samples ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get user type
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id UUID)
RETURNS public.user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for welder_profiles
CREATE POLICY "Welders can manage own profile" ON public.welder_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Employers can view welder profiles" ON public.welder_profiles
  FOR SELECT USING (
    public.get_user_type(auth.uid()) = 'employer'
  );

CREATE POLICY "Welders can insert own profile" ON public.welder_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for certifications
CREATE POLICY "Welders can manage own certs" ON public.certifications
  FOR ALL USING (
    welder_id IN (SELECT id FROM public.welder_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Employers can view certs" ON public.certifications
  FOR SELECT USING (
    public.get_user_type(auth.uid()) = 'employer'
  );

-- RLS Policies for employer_profiles
CREATE POLICY "Employers can manage own profile" ON public.employer_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone authenticated can view employer profiles" ON public.employer_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Employers can insert own profile" ON public.employer_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for jobs
CREATE POLICY "Anyone can view active jobs" ON public.jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Employers can view own jobs" ON public.jobs
  FOR SELECT USING (
    employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Employers can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Employers can update own jobs" ON public.jobs
  FOR UPDATE USING (
    employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Employers can delete own jobs" ON public.jobs
  FOR DELETE USING (
    employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for applications
CREATE POLICY "Welders can view own applications" ON public.applications
  FOR SELECT USING (
    welder_id IN (SELECT id FROM public.welder_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Welders can insert applications" ON public.applications
  FOR INSERT WITH CHECK (
    welder_id IN (SELECT id FROM public.welder_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Welders can update own applications" ON public.applications
  FOR UPDATE USING (
    welder_id IN (SELECT id FROM public.welder_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Employers can view applications to their jobs" ON public.applications
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM public.jobs j 
      JOIN public.employer_profiles ep ON j.employer_id = ep.id 
      WHERE ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update applications to their jobs" ON public.applications
  FOR UPDATE USING (
    job_id IN (
      SELECT j.id FROM public.jobs j 
      JOIN public.employer_profiles ep ON j.employer_id = ep.id 
      WHERE ep.user_id = auth.uid()
    )
  );

-- RLS Policies for work_samples
CREATE POLICY "Welders can manage own samples" ON public.work_samples
  FOR ALL USING (
    welder_id IN (SELECT id FROM public.welder_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone authenticated can view samples" ON public.work_samples
  FOR SELECT TO authenticated USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'welder'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_welder_profiles_updated_at 
  BEFORE UPDATE ON public.welder_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_employer_profiles_updated_at 
  BEFORE UPDATE ON public.employer_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON public.jobs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON public.applications 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to increment application count on jobs
CREATE OR REPLACE FUNCTION public.increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs 
  SET applications_count = applications_count + 1 
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-increment application count
CREATE TRIGGER on_application_created
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.increment_application_count();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(_welder_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  welder RECORD;
  cert_count INTEGER;
BEGIN
  SELECT * INTO welder FROM public.welder_profiles WHERE id = _welder_id;
  
  IF welder IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Basic info (30%)
  IF welder.city IS NOT NULL AND welder.city != '' THEN completion := completion + 10; END IF;
  IF welder.state IS NOT NULL AND welder.state != '' THEN completion := completion + 10; END IF;
  IF welder.years_experience IS NOT NULL AND welder.years_experience > 0 THEN completion := completion + 10; END IF;
  
  -- Skills (30%)
  IF array_length(welder.weld_processes, 1) > 0 THEN completion := completion + 15; END IF;
  IF array_length(welder.weld_positions, 1) > 0 THEN completion := completion + 15; END IF;
  
  -- Preferences (20%)
  IF welder.desired_salary_min IS NOT NULL THEN completion := completion + 10; END IF;
  IF welder.bio IS NOT NULL AND welder.bio != '' THEN completion := completion + 10; END IF;
  
  -- Certifications (20%)
  SELECT COUNT(*) INTO cert_count FROM public.certifications WHERE welder_id = _welder_id;
  IF cert_count > 0 THEN completion := completion + 20; END IF;
  
  RETURN completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update profile completion on welder profile changes
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion := public.calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_welder_profile_completion
  BEFORE UPDATE ON public.welder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();