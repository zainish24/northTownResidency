-- Create saved_listings table
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON saved_listings(listing_id);

-- Enable RLS
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own saved listings
CREATE POLICY "Users can view own saved listings"
  ON saved_listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save listings
CREATE POLICY "Users can save listings"
  ON saved_listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave listings
CREATE POLICY "Users can unsave listings"
  ON saved_listings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add saved_count column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS saved_count INTEGER DEFAULT 0;

-- Create function to update saved_count
CREATE OR REPLACE FUNCTION update_listing_saved_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET saved_count = saved_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update saved_count
DROP TRIGGER IF EXISTS trigger_update_saved_count ON saved_listings;
CREATE TRIGGER trigger_update_saved_count
  AFTER INSERT OR DELETE ON saved_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_saved_count();
