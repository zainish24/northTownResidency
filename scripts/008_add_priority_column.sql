-- Add missing priority column to notifications table
-- Run this in Supabase SQL Editor

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
