-- Fix notifications foreign key constraint
-- Run this in Supabase SQL Editor

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_created_by_fkey'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
