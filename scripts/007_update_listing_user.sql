-- Update all listings from default user to your user
UPDATE listings 
SET user_id = '4ce4f9bc-4943-4d87-b2f7-b42483aea7d3'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Verify
SELECT id, title, user_id FROM listings;
