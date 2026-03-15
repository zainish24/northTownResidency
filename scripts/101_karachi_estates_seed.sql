-- ============================================
-- KARACHI ESTATES - Seed Data
-- Run AFTER 100_karachi_estates_schema.sql
-- ============================================

-- ============================================
-- AREAS
-- ============================================
INSERT INTO public.areas (name, slug, description, is_popular, display_order) VALUES
('DHA', 'dha', 'Defence Housing Authority - Premium residential and commercial area', true, 1),
('Clifton', 'clifton', 'One of Karachi''s most upscale neighborhoods', true, 2),
('Bahria Town', 'bahria-town', 'Modern gated community with world-class amenities', true, 3),
('Gulshan-e-Iqbal', 'gulshan-e-iqbal', 'Popular residential area in central Karachi', true, 4),
('North Nazimabad', 'north-nazimabad', 'Well-established residential area', true, 5),
('Gulistan-e-Johar', 'gulistan-e-johar', 'Rapidly developing residential area', true, 6),
('Scheme 33', 'scheme-33', 'Affordable housing schemes near Super Highway', false, 7),
('Malir', 'malir', 'Eastern Karachi residential area', false, 8),
('Korangi', 'korangi', 'Industrial and residential area', false, 9),
('PECHS', 'pechs', 'Pakistan Employees Cooperative Housing Society', true, 10),
('Nazimabad', 'nazimabad', 'Historic residential area in central Karachi', false, 11),
('Landhi', 'landhi', 'Eastern Karachi area', false, 12),
('Surjani Town', 'surjani-town', 'Northern Karachi residential area', false, 13),
('Orangi Town', 'orangi-town', 'Large residential area in western Karachi', false, 14),
('Saddar', 'saddar', 'Commercial hub of Karachi', false, 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DEVELOPERS
-- ============================================
INSERT INTO public.developers (name, slug, description, is_verified, is_featured) VALUES
('Bahria Town', 'bahria-town', 'Pakistan''s largest private real estate developer', true, true),
('DHA Karachi', 'dha-karachi', 'Defence Housing Authority Karachi', true, true),
('Emaar Properties', 'emaar', 'International real estate developer with projects in Karachi', true, true),
('Giga Group', 'giga-group', 'Leading real estate developer in Karachi', true, false),
('Saima Group', 'saima-group', 'Prominent real estate developer in Karachi', true, false),
('Creek Vista', 'creek-vista', 'Premium apartment developer in DHA', true, false),
('Precinct Builders', 'precinct-builders', 'Bahria Town project developer', false, false),
('ARY Laguna', 'ary-laguna', 'Luxury waterfront development', true, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PROPERTY TYPES
-- ============================================
INSERT INTO public.property_types (name, slug, icon, category, display_order) VALUES
('House', 'house', 'home', 'residential', 1),
('Apartment', 'apartment', 'building2', 'residential', 2),
('Residential Plot', 'residential-plot', 'map', 'residential', 3),
('Villa', 'villa', 'castle', 'residential', 4),
('Penthouse', 'penthouse', 'building', 'residential', 5),
('Commercial Plot', 'commercial-plot', 'map-pin', 'commercial', 6),
('Office', 'office', 'briefcase', 'commercial', 7),
('Shop', 'shop', 'store', 'commercial', 8),
('Warehouse', 'warehouse', 'warehouse', 'industrial', 9),
('Factory', 'factory', 'factory', 'industrial', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- AMENITIES
-- ============================================
INSERT INTO public.amenities (name, slug, icon, category, display_order) VALUES
-- General
('Parking', 'parking', 'car', 'general', 1),
('Elevator', 'elevator', 'arrow-up', 'general', 2),
('Backup Generator', 'generator', 'zap', 'general', 3),
('Central AC', 'central-ac', 'wind', 'general', 4),
-- Security
('24/7 Security', 'security', 'shield', 'security', 1),
('CCTV', 'cctv', 'camera', 'security', 2),
('Gated Community', 'gated', 'lock', 'security', 3),
('Intercom', 'intercom', 'phone', 'security', 4),
-- Utilities
('Gas', 'gas', 'flame', 'utilities', 1),
('Electricity', 'electricity', 'zap', 'utilities', 2),
('Water Supply', 'water', 'droplets', 'utilities', 3),
('Internet', 'internet', 'wifi', 'utilities', 4),
-- Facilities
('Gym', 'gym', 'dumbbell', 'facilities', 1),
('Swimming Pool', 'pool', 'waves', 'facilities', 2),
('Community Hall', 'hall', 'users', 'facilities', 3),
('Mosque', 'mosque', 'building', 'facilities', 4),
-- Outdoor
('Garden', 'garden', 'trees', 'outdoor', 1),
('Park', 'park', 'tree-pine', 'outdoor', 2),
('Play Area', 'play-area', 'gamepad', 'outdoor', 3),
('Rooftop', 'rooftop', 'sun', 'outdoor', 4),
-- Lifestyle
('School Nearby', 'school', 'graduation-cap', 'lifestyle', 1),
('Hospital Nearby', 'hospital', 'hospital', 'lifestyle', 2),
('Mall Nearby', 'mall', 'shopping-bag', 'lifestyle', 3),
('Restaurant Nearby', 'restaurant', 'utensils', 'lifestyle', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SITE SETTINGS
-- ============================================
INSERT INTO public.site_settings (key, value) VALUES
('platform_name', 'Karachi Estates'),
('tagline', 'Karachi''s Premier Real Estate Marketplace'),
('logo_url', ''),
('primary_color', '#10b981'),
('secondary_color', '#3b82f6'),
('contact_phone', '+92 300 0000000'),
('contact_email', 'info@karachiestates.com'),
('facebook_url', ''),
('instagram_url', ''),
('twitter_url', ''),
('whatsapp_number', '+92 300 0000000')
ON CONFLICT (key) DO NOTHING;

SELECT 'Karachi Estates seed data complete!' as status;
SELECT COUNT(*) as areas FROM public.areas;
SELECT COUNT(*) as developers FROM public.developers;
SELECT COUNT(*) as property_types FROM public.property_types;
SELECT COUNT(*) as amenities FROM public.amenities;
