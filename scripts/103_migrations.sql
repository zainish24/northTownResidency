-- ============================================
-- MIGRATION: Add missing columns
-- Run this if you already ran 100_karachi_estates_schema.sql
-- ============================================

-- Add blocked_reason and blocked_at to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- Add saved_count to listings (used in some queries)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS saved_count INT NOT NULL DEFAULT 0;

-- Add description to amenities (used in admin UI)
ALTER TABLE public.amenities
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

SELECT 'Migration complete!' as status;
