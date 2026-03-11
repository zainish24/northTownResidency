-- Admin Features: Site Settings, Notifications, Property Types, Amenities, Banners
-- Run this after 005_storage_setup.sql

-- Site Settings (single row config)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name TEXT DEFAULT 'NTR Properties',
  tagline TEXT DEFAULT 'North Town Residency Classified Ads',
  contact_phone TEXT,
  contact_email TEXT,
  whatsapp_number TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  about_us TEXT,
  terms_conditions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Insert default settings
INSERT INTO public.site_settings (platform_name, tagline, contact_phone, contact_email)
VALUES ('NTR Properties', 'North Town Residency Classified Ads', '+923001234567', 'info@ntrproperties.com')
ON CONFLICT DO NOTHING;

-- Property Types (dynamic)
CREATE TABLE IF NOT EXISTS public.property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'building',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default property types
INSERT INTO public.property_types (name, slug, icon, display_order) VALUES
('Residential Plot', 'residential_plot', 'home', 1),
('Commercial Shop', 'commercial_shop', 'store', 2)
ON CONFLICT DO NOTHING;

-- Amenities/Features
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'security', 'utilities', 'facilities')),
  icon TEXT DEFAULT 'check',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default amenities
INSERT INTO public.amenities (name, slug, category, icon, display_order) VALUES
('24/7 Security', '24-7-security', 'security', 'shield', 1),
('CCTV Surveillance', 'cctv-surveillance', 'security', 'camera', 2),
('Electricity', 'electricity', 'utilities', 'zap', 3),
('Gas', 'gas', 'utilities', 'flame', 4),
('Water Supply', 'water-supply', 'utilities', 'droplet', 5),
('Sewerage', 'sewerage', 'utilities', 'pipe', 6),
('Park Nearby', 'park-nearby', 'facilities', 'trees', 7),
('Mosque Nearby', 'mosque-nearby', 'facilities', 'building', 8),
('School Nearby', 'school-nearby', 'facilities', 'graduation-cap', 9)
ON CONFLICT DO NOTHING;

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'announcement' CHECK (type IN ('announcement', 'alert', 'update', 'promotion')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'sellers')),
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notifications (inbox)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners/Ads
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT DEFAULT 'home_top' CHECK (position IN ('home_top', 'home_middle', 'listings_top', 'sidebar')),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);

-- Disable RLS
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
