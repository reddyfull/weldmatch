-- Add website_url column to welder_profiles for personal website
ALTER TABLE public.welder_profiles
ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT NULL;