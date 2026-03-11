-- Add image_url column to phases table
ALTER TABLE phases ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN phases.image_url IS 'URL of the phase image';
