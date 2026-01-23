-- Make the certifications bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'certifications';

-- Add policy to allow public read access
CREATE POLICY "Public can view certifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'certifications');

-- Ensure authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload certifications" ON storage.objects;
CREATE POLICY "Users can upload certifications"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users can update own certifications" ON storage.objects;
CREATE POLICY "Users can update own certifications"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete own certifications" ON storage.objects;
CREATE POLICY "Users can delete own certifications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);