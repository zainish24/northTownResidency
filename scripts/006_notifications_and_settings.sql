-- Notifications System Tables
-- Run this in Supabase SQL Editor

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'announcement' CHECK (type IN ('announcement', 'alert', 'update', 'promotion', 'warning', 'success', 'feature')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'sellers', 'agents', 'admins')),
  link_url TEXT,
  image_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  read_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notifications (junction table for tracking which users received/read notifications)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Property Types table (dynamic) - Add missing columns if table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_types' AND column_name='category') THEN
    ALTER TABLE public.property_types ADD COLUMN category TEXT DEFAULT 'residential' CHECK (category IN ('residential', 'commercial', 'industrial', 'agricultural', 'mixed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_types' AND column_name='meta_title') THEN
    ALTER TABLE public.property_types ADD COLUMN meta_title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_types' AND column_name='meta_description') THEN
    ALTER TABLE public.property_types ADD COLUMN meta_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_types' AND column_name='image_url') THEN
    ALTER TABLE public.property_types ADD COLUMN image_url TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'building',
  description TEXT,
  category TEXT DEFAULT 'residential',
  meta_title TEXT,
  meta_description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amenities table (dynamic) - Add missing columns if table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='amenities' AND column_name='category') THEN
    ALTER TABLE public.amenities ADD COLUMN category TEXT DEFAULT 'general' CHECK (category IN ('general', 'security', 'utilities', 'facilities', 'outdoor', 'lifestyle'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'sparkles',
  category TEXT DEFAULT 'general',
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing amenities (junction table)
CREATE TABLE IF NOT EXISTS public.listing_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, amenity_id)
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'color', 'image', 'url', 'email', 'phone')),
  category TEXT DEFAULT 'general',
  label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  position TEXT DEFAULT 'home' CHECK (position IN ('home', 'listings', 'dashboard', 'all')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON public.notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification ON public.user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_property_types_active ON public.property_types(is_active);
CREATE INDEX IF NOT EXISTS idx_amenities_active ON public.amenities(is_active);
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing ON public.listing_amenities(listing_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);

-- Disable RLS
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;

-- Insert default property types
INSERT INTO public.property_types (name, slug, icon, category, description, display_order, is_active) VALUES
('Residential Plot', 'residential-plot', 'home', 'residential', 'Empty residential plots for construction', 1, true),
('Commercial Shop', 'commercial-shop', 'store', 'commercial', 'Commercial shops and retail spaces', 2, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert default amenities
INSERT INTO public.amenities (name, slug, icon, category, display_order, is_active) VALUES
('24/7 Security', '24-7-security', 'shield', 'security', 1, true),
('CCTV Surveillance', 'cctv-surveillance', 'camera', 'security', 2, true),
('Electricity', 'electricity', 'zap', 'utilities', 3, true),
('Gas', 'gas', 'wind', 'utilities', 4, true),
('Water Supply', 'water-supply', 'droplets', 'utilities', 5, true),
('Sewerage', 'sewerage', 'droplets', 'utilities', 6, true),
('Mosque', 'mosque', 'building', 'facilities', 7, true),
('School', 'school', 'building', 'facilities', 8, true),
('Park', 'park', 'tree-pine', 'outdoor', 9, true),
('Community Center', 'community-center', 'users', 'facilities', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert primary color setting
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
('primary_color', '#10b981', 'color', 'general', 'Primary Color', 'Main brand color')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = '#10b981';
