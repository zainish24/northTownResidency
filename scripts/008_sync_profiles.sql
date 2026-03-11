-- Add missing profile for email user
INSERT INTO profiles (id, phone, full_name, role)
SELECT 
  id,
  COALESCE(phone, ''),
  COALESCE(raw_user_meta_data->>'full_name', email),
  'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT p.id, p.phone, p.full_name, p.role 
FROM profiles p
ORDER BY p.created_at DESC;
