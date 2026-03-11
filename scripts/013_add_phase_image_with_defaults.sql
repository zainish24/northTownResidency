-- Add image_url column and set default images for existing phases
-- Run this in Supabase SQL Editor

-- First add the column
ALTER TABLE public.phases 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing phases with default images (if they exist)
UPDATE public.phases 
SET image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
WHERE name = 'Phase 1' AND image_url IS NULL;

UPDATE public.phases 
SET image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
WHERE name = 'Phase 2' AND image_url IS NULL;

UPDATE public.phases 
SET image_url = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'
WHERE name = 'Phase 3' AND image_url IS NULL;

UPDATE public.phases 
SET image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'
WHERE name = 'Phase 4' AND image_url IS NULL;

-- Add comment
COMMENT ON COLUMN public.phases.image_url IS 'URL of the phase image for display on homepage';
