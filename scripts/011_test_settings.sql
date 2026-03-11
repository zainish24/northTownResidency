-- Test: Update site settings
UPDATE site_settings SET setting_value = 'My Custom Site' WHERE setting_key = 'site_name';
UPDATE site_settings SET setting_value = 'Custom Tagline' WHERE setting_key = 'site_tagline';
UPDATE site_settings SET setting_value = 'https://via.placeholder.com/150' WHERE setting_key = 'site_logo';

-- Verify
SELECT setting_key, setting_value FROM site_settings 
WHERE setting_key IN ('site_name', 'site_tagline', 'site_logo');
