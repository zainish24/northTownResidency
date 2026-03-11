-- Add missing columns to banners table
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='banners') THEN
    -- Add subtitle if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='subtitle') THEN
      ALTER TABLE public.banners ADD COLUMN subtitle TEXT;
    END IF;
    
    -- Add button_text if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='button_text') THEN
      ALTER TABLE public.banners ADD COLUMN button_text TEXT;
    END IF;
    
    -- Add display_order if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='display_order') THEN
      ALTER TABLE public.banners ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
    
    -- Add target_audience if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='target_audience') THEN
      ALTER TABLE public.banners ADD COLUMN target_audience TEXT DEFAULT 'all';
    END IF;
    
    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='description') THEN
      ALTER TABLE public.banners ADD COLUMN description TEXT;
    END IF;
  END IF;
END $$;
