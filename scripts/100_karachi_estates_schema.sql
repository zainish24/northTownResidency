-- ============================================
-- KARACHI ESTATES - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  user_type TEXT NOT NULL DEFAULT 'individual' CHECK (user_type IN ('individual', 'agent', 'developer')),
  agency_name TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. AREAS (DHA, Clifton, Gulshan etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. DEVELOPERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  established_year INT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  min_price DECIMAL(15,2),
  max_price DECIMAL(15,2),
  total_units INT,
  completion_year INT,
  project_status TEXT NOT NULL DEFAULT 'ongoing' CHECK (project_status IN ('upcoming', 'ongoing', 'completed')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. PROPERTY TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT NOT NULL DEFAULT 'residential' CHECK (category IN ('residential', 'commercial', 'industrial')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. AMENITIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'security', 'utilities', 'facilities', 'outdoor', 'lifestyle')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Location
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Property Info
  property_type_id UUID REFERENCES public.property_types(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL DEFAULT 'sale' CHECK (purpose IN ('sale', 'rent')),
  title TEXT NOT NULL,
  description TEXT,

  -- Size
  area_size DECIMAL(10,2),
  area_unit TEXT NOT NULL DEFAULT 'sqft' CHECK (area_unit IN ('sqft', 'sqyd', 'marla', 'kanal')),

  -- Price
  price DECIMAL(15,2) NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable')),

  -- Details
  bedrooms INT,
  bathrooms INT,
  floors INT,

  -- Features
  is_corner BOOLEAN NOT NULL DEFAULT false,
  is_road_facing BOOLEAN NOT NULL DEFAULT false,
  is_park_facing BOOLEAN NOT NULL DEFAULT false,
  is_west_open BOOLEAN NOT NULL DEFAULT false,

  -- Construction
  construction_status TEXT NOT NULL DEFAULT 'empty' CHECK (construction_status IN ('empty', 'under_construction', 'completed')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'sold', 'rented', 'expired')),
  rejection_reason TEXT,

  -- Promotion
  is_featured BOOLEAN NOT NULL DEFAULT false,
  promotion_package TEXT NOT NULL DEFAULT 'free' CHECK (promotion_package IN ('free', 'featured', 'premium')),
  promotion_expires_at TIMESTAMPTZ,

  -- Stats
  views_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. LISTING IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. LISTING AMENITIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_amenities (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, amenity_id)
);

-- ============================================
-- 10. FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ============================================
-- 11. LEADS
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. ADS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT,
  placement TEXT NOT NULL CHECK (placement IN (
    'homepage_top', 'homepage_featured', 'homepage_bottom',
    'search_results_top', 'search_results_sidebar',
    'listing_page_sidebar', 'listing_page_bottom',
    'area_page_top', 'developer_page_top', 'project_page_top'
  )),
  target_type TEXT NOT NULL DEFAULT 'global' CHECK (target_type IN ('global', 'area', 'developer', 'project')),
  target_id UUID,
  priority INT NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled', 'expired')),
  clicks_count INT NOT NULL DEFAULT 0,
  impressions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. LISTING PROMOTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('featured', 'premium')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. LISTING VIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. SITE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_listings_area ON public.listings(area_id);
CREATE INDEX IF NOT EXISTS idx_listings_project ON public.listings(project_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_purpose ON public.listings(purpose);
CREATE INDEX IF NOT EXISTS idx_listings_user ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_area ON public.projects(area_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON public.projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_leads_listing ON public.leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_ads_placement ON public.ads(placement);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing ON public.listing_views(listing_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_developers_updated_at BEFORE UPDATE ON public.developers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public_read_areas" ON public.areas FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_developers" ON public.developers FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_projects" ON public.projects FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_property_types" ON public.property_types FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_amenities" ON public.amenities FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_approved_listings" ON public.listings FOR SELECT USING (status = 'approved');
CREATE POLICY "public_read_listing_images" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "public_read_listing_amenities" ON public.listing_amenities FOR SELECT USING (true);
CREATE POLICY "public_read_active_ads" ON public.ads FOR SELECT USING (status = 'active');
CREATE POLICY "public_read_site_settings" ON public.site_settings FOR SELECT USING (true);

-- Profiles
CREATE POLICY "users_read_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings - users manage own
CREATE POLICY "users_read_own_listings" ON public.listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending'));

-- Favorites
CREATE POLICY "users_manage_favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Leads
CREATE POLICY "users_insert_leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_owner_read_leads" ON public.leads FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Listing images
CREATE POLICY "users_manage_own_listing_images" ON public.listing_images FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Listing views
CREATE POLICY "anyone_insert_views" ON public.listing_views FOR INSERT WITH CHECK (true);

-- Admin full access (using service role in API routes)
