-- ============================================
-- EMPLOYER PORTAL SCHEMA EXTENSIONS
-- ============================================

-- Add new columns to employer_profiles if not exists
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS social_facebook TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS total_hires INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_time_to_hire INTEGER,
  ADD COLUMN IF NOT EXISTS safety_record TEXT,
  ADD COLUMN IF NOT EXISTS union_affiliation TEXT;

-- Company page customization settings
CREATE TABLE company_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  hero_headline TEXT DEFAULT 'Join Our Team',
  hero_subheadline TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  hero_cta_text TEXT DEFAULT 'View Open Positions',
  hero_cta_link TEXT DEFAULT '#jobs',
  brand_primary_color TEXT DEFAULT '#1E3A5F',
  brand_secondary_color TEXT DEFAULT '#FF6B35',
  brand_font TEXT DEFAULT 'Inter',
  custom_css TEXT,
  about_title TEXT DEFAULT 'About Us',
  about_content TEXT,
  mission_statement TEXT,
  founded_year INTEGER,
  headquarters_text TEXT,
  culture_title TEXT DEFAULT 'Our Culture',
  culture_description TEXT,
  benefits_title TEXT DEFAULT 'Why Work With Us',
  show_benefits BOOLEAN DEFAULT TRUE,
  show_testimonials BOOLEAN DEFAULT TRUE,
  testimonials_title TEXT DEFAULT 'What Our Team Says',
  show_open_jobs BOOLEAN DEFAULT TRUE,
  jobs_title TEXT DEFAULT 'Open Positions',
  show_contact_form BOOLEAN DEFAULT TRUE,
  contact_email TEXT,
  contact_phone TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company page sections (modular, drag-and-drop ordering)
CREATE TABLE company_page_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_page_id UUID REFERENCES company_pages(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero', 'about', 'culture', 'benefits', 'testimonials',
    'gallery', 'video', 'stats', 'team', 'certifications',
    'projects', 'safety_record', 'equipment', 'locations',
    'custom_html', 'faq', 'cta_banner', 'jobs', 'contact'
  )),
  title TEXT,
  content JSONB DEFAULT '{}',
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company benefits (structured)
CREATE TABLE company_benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'health', 'financial', 'time_off', 'professional',
    'perks', 'safety', 'travel', 'retirement', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company gallery (photos, videos, project showcase)
CREATE TABLE company_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  category TEXT CHECK (category IN (
    'workplace', 'projects', 'team', 'equipment', 'safety', 'events', 'other'
  )),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company testimonials from employees
CREATE TABLE company_testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_photo_url TEXT,
  quote TEXT NOT NULL,
  years_at_company INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company stats/metrics to showcase
CREATE TABLE company_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company locations (for multi-site employers)
CREATE TABLE company_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address_line1 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  phone TEXT,
  is_headquarters BOOLEAN DEFAULT FALSE,
  is_hiring BOOLEAN DEFAULT TRUE,
  employee_count INTEGER,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company certifications / accreditations
CREATE TABLE company_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
  cert_name TEXT NOT NULL,
  issuing_body TEXT,
  cert_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company page visit analytics
CREATE TABLE company_page_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_page_id UUID REFERENCES company_pages(id) ON DELETE CASCADE NOT NULL,
  visitor_type TEXT CHECK (visitor_type IN ('welder', 'employer', 'anonymous')),
  visitor_id UUID,
  source TEXT,
  referrer TEXT,
  device_type TEXT,
  session_duration_seconds INTEGER,
  pages_viewed INTEGER DEFAULT 1,
  applied_to_job BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employer page templates (pre-built layouts)
CREATE TABLE page_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  category TEXT CHECK (category IN (
    'industrial', 'corporate', 'startup', 'contractor', 'union', 'minimal'
  )),
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_company_pages_slug ON company_pages(slug);
CREATE INDEX idx_company_pages_employer ON company_pages(employer_id);
CREATE INDEX idx_company_page_sections_page ON company_page_sections(company_page_id);
CREATE INDEX idx_company_gallery_employer ON company_gallery(employer_id);
CREATE INDEX idx_company_benefits_employer ON company_benefits(employer_id);
CREATE INDEX idx_company_locations_employer ON company_locations(employer_id);
CREATE INDEX idx_company_page_analytics_page ON company_page_analytics(company_page_id);
CREATE INDEX idx_employer_profiles_slug ON employer_profiles(slug);

-- RLS Policies
ALTER TABLE company_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;

-- Employers manage their own data
CREATE POLICY "Employers manage own company pages"
  ON company_pages FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view published company pages"
  ON company_pages FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Employers manage own sections"
  ON company_page_sections FOR ALL
  USING (company_page_id IN (
    SELECT id FROM company_pages WHERE employer_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Public can view sections of published pages"
  ON company_page_sections FOR SELECT
  USING (company_page_id IN (SELECT id FROM company_pages WHERE is_published = TRUE));

CREATE POLICY "Employers manage own benefits"
  ON company_benefits FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view benefits"
  ON company_benefits FOR SELECT USING (TRUE);

CREATE POLICY "Employers manage own gallery"
  ON company_gallery FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view gallery"
  ON company_gallery FOR SELECT USING (TRUE);

CREATE POLICY "Employers manage own testimonials"
  ON company_testimonials FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view approved testimonials"
  ON company_testimonials FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Employers manage own stats"
  ON company_stats FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view stats"
  ON company_stats FOR SELECT USING (TRUE);

CREATE POLICY "Employers manage own locations"
  ON company_locations FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view locations"
  ON company_locations FOR SELECT USING (TRUE);

CREATE POLICY "Employers manage own certs"
  ON company_certifications FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public can view company certs"
  ON company_certifications FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can insert analytics"
  ON company_page_analytics FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Employers view own analytics"
  ON company_page_analytics FOR SELECT
  USING (company_page_id IN (
    SELECT id FROM company_pages WHERE employer_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Anyone can view templates"
  ON page_templates FOR SELECT USING (is_active = TRUE);

-- Trigger for updating timestamps
CREATE TRIGGER update_company_pages_updated_at
  BEFORE UPDATE ON company_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_page_sections_updated_at
  BEFORE UPDATE ON company_page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default page templates
INSERT INTO page_templates (name, description, category, template_data) VALUES
('Industrial', 'Bold hero, project showcase, safety record highlight', 'industrial', '{"sections": ["hero", "stats", "about", "gallery", "safety_record", "benefits", "jobs", "contact"], "colors": {"primary": "#1E3A5F", "secondary": "#FF6B35"}}'),
('Corporate', 'Clean, stats-focused, benefits-heavy', 'corporate', '{"sections": ["hero", "about", "stats", "benefits", "testimonials", "jobs", "locations", "contact"], "colors": {"primary": "#2E5A8F", "secondary": "#28A745"}}'),
('Modern Startup', 'Team-focused, culture-forward, dynamic', 'startup', '{"sections": ["hero", "culture", "team", "gallery", "benefits", "testimonials", "jobs", "contact"], "colors": {"primary": "#6366F1", "secondary": "#EC4899"}}'),
('Contractor', 'Travel-focused, per diem highlight, mobile-first', 'contractor', '{"sections": ["hero", "stats", "benefits", "locations", "equipment", "jobs", "contact"], "colors": {"primary": "#374151", "secondary": "#F59E0B"}}'),
('Union', 'Heritage, training programs, strong benefits', 'union', '{"sections": ["hero", "about", "certifications", "benefits", "safety_record", "testimonials", "jobs", "contact"], "colors": {"primary": "#1E40AF", "secondary": "#DC2626"}}'),
('Minimal', 'Simple, jobs-first, clean and fast', 'minimal', '{"sections": ["hero", "about", "jobs", "contact"], "colors": {"primary": "#111827", "secondary": "#3B82F6"}}')