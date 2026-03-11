-- Add image_url column to phases table
-- Run this in Supabase SQL Editor

ALTER TABLE public.phases 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add some comments
COMMENT ON COLUMN public.phases.image_url IS 'URL of the phase image for display on homepage';
