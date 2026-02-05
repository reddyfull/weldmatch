-- Add positions_needed column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN positions_needed integer NOT NULL DEFAULT 1;

-- Add a comment to document the column
COMMENT ON COLUMN public.jobs.positions_needed IS 'Number of welders needed for this job posting';