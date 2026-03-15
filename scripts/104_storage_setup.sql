-- ============================================
-- STORAGE SETUP: Run in Supabase SQL Editor
-- ============================================

-- Allow public read on property-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload
CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- Allow public read
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'property-images');

-- Allow users to delete their own files
CREATE POLICY "auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

SELECT 'Storage setup complete!' as status;
