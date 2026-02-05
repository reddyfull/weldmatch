-- Add profile_setup_complete flag to welder_profiles
ALTER TABLE welder_profiles
ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT false;

-- Add profile_setup_complete flag to employer_profiles  
ALTER TABLE employer_profiles
ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT false;

-- Update existing profiles that have required fields to mark them as complete
UPDATE welder_profiles
SET profile_setup_complete = true
WHERE city IS NOT NULL
  AND state IS NOT NULL
  AND weld_processes IS NOT NULL
  AND array_length(weld_processes, 1) > 0;

UPDATE employer_profiles
SET profile_setup_complete = true
WHERE company_name IS NOT NULL;