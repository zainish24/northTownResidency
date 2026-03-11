-- North Town Residency - Storage Bucket Setup

-- Create the property-images bucket (run this in Supabase SQL editor or via API)
-- Note: Bucket creation is typically done via Supabase Dashboard or API
-- This script sets up the storage policies

-- Enable RLS on storage.objects for the property-images bucket
-- Users can upload to their own folder: property-images/{user_id}/*

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload property images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to all property images
CREATE POLICY "Public can view property images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');
