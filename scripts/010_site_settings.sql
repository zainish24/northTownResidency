-- Drop existing table if exists
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
-- Branding
('site_name', 'NTR Properties', 'text', 'branding', 'Site Name', 'Website name displayed in header'),
('site_tagline', 'North Town Residency Classified Ads', 'text', 'branding', 'Site Tagline', 'Short description of the site'),
('site_logo', '/logo.png', 'image', 'branding', 'Site Logo', 'Main logo image URL'),
('site_favicon', '/favicon.ico', 'image', 'branding', 'Favicon', 'Browser tab icon'),
('primary_color', '#10b981', 'color', 'branding', 'Primary Color', 'Main brand color'),
('secondary_color', '#3b82f6', 'color', 'branding', 'Secondary Color', 'Secondary brand color'),

-- Contact
('contact_email', 'info@ntrproperties.pk', 'email', 'contact', 'Contact Email', 'Main contact email'),
('contact_phone', '+92 300 1234567', 'phone', 'contact', 'Contact Phone', 'Main contact phone'),
('contact_whatsapp', '+92 300 1234567', 'phone', 'contact', 'WhatsApp Number', 'WhatsApp contact number'),
('contact_address', 'North Town Residency, Karachi, Pakistan', 'text', 'contact', 'Address', 'Physical address'),

-- Social Media
('facebook_url', 'https://facebook.com/ntrproperties', 'url', 'social', 'Facebook URL', 'Facebook page link'),
('instagram_url', 'https://instagram.com/ntrproperties', 'url', 'social', 'Instagram URL', 'Instagram profile link'),
('twitter_url', 'https://twitter.com/ntrproperties', 'url', 'social', 'Twitter URL', 'Twitter profile link'),
('youtube_url', '', 'url', 'social', 'YouTube URL', 'YouTube channel link'),
('linkedin_url', '', 'url', 'social', 'LinkedIn URL', 'LinkedIn page link'),

-- SEO
('meta_title', 'NTR Properties - North Town Residency', 'text', 'seo', 'Meta Title', 'SEO page title'),
('meta_description', 'Find the best properties in North Town Residency, Karachi', 'text', 'seo', 'Meta Description', 'SEO description'),
('meta_keywords', 'ntr, properties, karachi, real estate', 'text', 'seo', 'Meta Keywords', 'SEO keywords'),

-- General
('site_status', 'active', 'text', 'general', 'Site Status', 'active or maintenance'),
('maintenance_message', 'Site is under maintenance', 'text', 'general', 'Maintenance Message', 'Message shown during maintenance'),
('items_per_page', '12', 'text', 'general', 'Items Per Page', 'Number of listings per page'),
('max_images_per_listing', '10', 'text', 'general', 'Max Images', 'Maximum images per listing')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON public.site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);

-- Verify
SELECT * FROM public.site_settings ORDER BY category, setting_key;
