-- Make your user admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = '4ce4f9bc-4943-4d87-b2f7-b42483aea7d3';

-- Verify
SELECT id, phone, full_name, role 
FROM profiles 
WHERE role = 'admin';
