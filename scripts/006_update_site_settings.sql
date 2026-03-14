-- Update site settings to Karachi Estates
INSERT INTO site_settings (setting_key, setting_value, label, category)
VALUES 
  ('platform_name', 'Karachi Estates', 'Platform Name', 'general'),
  ('tagline', 'Karachi Real Estate', 'Tagline', 'general'),
  ('logo_url', '/logo.png', 'Logo URL', 'general'),
  ('favicon_url', '/favicon.ico', 'Favicon URL', 'general'),
  ('meta_title', 'Karachi Estates - Karachi Real Estate', 'Meta Title', 'seo'),
  ('meta_description', 'Buy, sell, and rent properties in Karachi. Find residential plots and commercial shops.', 'Meta Description', 'seo'),
  ('footer_text', '© 2025 Karachi Estates. All rights reserved.', 'Footer Text', 'content'),
  ('about_us', 'Karachi Estates is the premier platform for buying, selling, and renting properties in Karachi.', 'About Us', 'content')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = EXCLUDED.setting_value;
