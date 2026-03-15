-- ============================================
-- PATCH: Missing columns after 102 migration
-- Run this in Supabase SQL Editor
-- ============================================

-- profiles mein blocked_reason aur blocked_at add karo
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- amenities mein description add karo (admin UI use karta hai)
ALTER TABLE public.amenities
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

SELECT 'Patch applied successfully!' as status;
