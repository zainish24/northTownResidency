-- Add is_active column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON public.listings(is_active);
