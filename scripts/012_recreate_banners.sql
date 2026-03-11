-- Recreate Banners Table
-- Run this in Supabase SQL Editor

-- Drop existing table
DROP TABLE IF EXISTS public.banners CASCADE;

-- Create banners table with all columns
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  position TEXT DEFAULT 'home_top',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  clicks_count INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_banners_active ON public.banners(is_active);
CREATE INDEX idx_banners_position ON public.banners(position);

-- Disable RLS completely
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated roles
GRANT ALL ON public.banners TO anon;
GRANT ALL ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
