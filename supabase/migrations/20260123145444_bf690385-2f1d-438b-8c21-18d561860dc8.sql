-- Create storage bucket for certifications
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own certifications
CREATE POLICY "Users can upload their own certifications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certifications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own certifications
CREATE POLICY "Users can update their own certifications"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certifications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own certifications
CREATE POLICY "Users can delete their own certifications"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certifications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to certifications
CREATE POLICY "Certifications are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'certifications');