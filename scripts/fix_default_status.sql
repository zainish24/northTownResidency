-- Change default status from 'approved' to 'pending'
ALTER TABLE listings 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update any existing approved listings if needed (optional)
-- UPDATE listings SET status = 'pending' WHERE status = 'approved';
