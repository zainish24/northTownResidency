-- ============================================
-- PATCH: Run this after 102_migration_to_karachi_estates.sql
-- Supabase SQL Editor mein paste karke run karo
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

ALTER TABLE public.amenities
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

SELECT 'Patch complete!' as status;
