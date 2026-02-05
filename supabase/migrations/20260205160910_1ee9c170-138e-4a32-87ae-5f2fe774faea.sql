-- Add RLS policies to market_intelligence_results table
-- The table uses welder_id column for both welders and employers (reused)

-- Ensure RLS is enabled
ALTER TABLE market_intelligence_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own market intelligence" ON market_intelligence_results;
DROP POLICY IF EXISTS "Users can view own market intelligence" ON market_intelligence_results;
DROP POLICY IF EXISTS "Users can update own market intelligence" ON market_intelligence_results;
DROP POLICY IF EXISTS "Users can delete own market intelligence" ON market_intelligence_results;

-- Allow authenticated users to INSERT their own results
-- The welder_id column stores the profile ID (either welder_profiles.id or employer_profiles.id)
CREATE POLICY "Users can insert own market intelligence"
  ON market_intelligence_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid())
    OR welder_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );

-- Allow authenticated users to SELECT their own results
CREATE POLICY "Users can view own market intelligence"
  ON market_intelligence_results
  FOR SELECT
  TO authenticated
  USING (
    welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid())
    OR welder_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );

-- Allow authenticated users to UPDATE their own results
CREATE POLICY "Users can update own market intelligence"
  ON market_intelligence_results
  FOR UPDATE
  TO authenticated
  USING (
    welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid())
    OR welder_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid())
    OR welder_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );

-- Allow authenticated users to DELETE their own results
CREATE POLICY "Users can delete own market intelligence"
  ON market_intelligence_results
  FOR DELETE
  TO authenticated
  USING (
    welder_id IN (SELECT id FROM welder_profiles WHERE user_id = auth.uid())
    OR welder_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );