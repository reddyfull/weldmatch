-- Add match scoring columns to external_jobs table
ALTER TABLE external_jobs ADD COLUMN IF NOT EXISTS match_score INTEGER;
ALTER TABLE external_jobs ADD COLUMN IF NOT EXISTS match_reason TEXT;
ALTER TABLE external_jobs ADD COLUMN IF NOT EXISTS missing_skills TEXT[];

-- Index for sorting by match score
CREATE INDEX IF NOT EXISTS idx_external_jobs_match_score ON external_jobs (match_score DESC NULLS LAST);