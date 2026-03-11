-- North Town Residency - Property Classified Platform
-- Database Schema: Tables
-- UPDATED: Auto-approve listings, RLS disabled

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases table (Phase 1, Phase 2, Phase 4)
CREATE TABLE IF NOT EXISTS public.phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table (Titanium, Mehran, Premium, etc.)
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  block_type TEXT DEFAULT 'mixed' CHECK (block_type IN ('residential', 'commercial', 'mixed')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phase_id, name)
);

-- Listings table (main property ads)
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase_id UUID NOT NULL REFERENCES public.phases(id),
  block_id UUID NOT NULL REFERENCES public.blocks(id),
  property_type TEXT NOT NULL CHECK (property_type IN ('residential_plot', 'commercial_shop')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent')),
  -- Size fields
  plot_size_sqyd NUMERIC, -- For residential (80, 100, 120 sq yards)
  shop_size_sqft NUMERIC, -- For commercial (sq feet)
  -- Price fields
  price NUMERIC NOT NULL,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable')),
  -- Property features (for built properties)
  bedrooms INTEGER,
  bathrooms INTEGER,
  -- Position features
  is_corner BOOLEAN DEFAULT FALSE,
  is_road_facing BOOLEAN DEFAULT FALSE,
  is_park_facing BOOLEAN DEFAULT FALSE,
  is_west_open BOOLEAN DEFAULT FALSE,
  -- Construction status
  has_construction BOOLEAN DEFAULT FALSE,
  construction_status TEXT DEFAULT 'empty' CHECK (construction_status IN ('empty', 'under_construction', 'completed')),
  -- Address
  address_details TEXT,
  -- Status and admin (DEFAULT CHANGED TO 'approved')
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'sold')),
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing images table
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs for admin actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_phase ON public.listings(phase_id);
CREATE INDEX IF NOT EXISTS idx_listings_block ON public.listings(block_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_user ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(property_type, listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_blocks_phase ON public.blocks(phase_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id);

-- IMPORTANT: Disable RLS (Row Level Security)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
