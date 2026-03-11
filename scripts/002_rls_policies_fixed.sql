-- North Town Residency - Row Level Security Policies (Fixed)

-- Drop existing policies first
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "phases_select_all" ON public.phases;
DROP POLICY IF EXISTS "phases_admin_all" ON public.phases;
DROP POLICY IF EXISTS "blocks_select_all" ON public.blocks;
DROP POLICY IF EXISTS "blocks_admin_all" ON public.blocks;
DROP POLICY IF EXISTS "listings_select_approved" ON public.listings;
DROP POLICY IF EXISTS "listings_select_own" ON public.listings;
DROP POLICY IF EXISTS "listings_select_admin" ON public.listings;
DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
DROP POLICY IF EXISTS "listings_update_admin" ON public.listings;
DROP POLICY IF EXISTS "listing_images_select_approved" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_select_own" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_select_admin" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_insert_own" ON public.listing_images;
DROP POLICY IF EXISTS "listing_images_delete_own" ON public.listing_images;
DROP POLICY IF EXISTS "activity_logs_admin_select" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_admin_insert" ON public.activity_logs;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES (Fixed - no recursion)
CREATE POLICY "profiles_select_all" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PHASES POLICIES
CREATE POLICY "phases_select_all" ON public.phases 
  FOR SELECT USING (is_active = true);

CREATE POLICY "phases_admin_all" ON public.phases 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- BLOCKS POLICIES
CREATE POLICY "blocks_select_all" ON public.blocks 
  FOR SELECT USING (is_active = true);

CREATE POLICY "blocks_admin_all" ON public.blocks 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- LISTINGS POLICIES
CREATE POLICY "listings_select_approved" ON public.listings 
  FOR SELECT USING (status = 'approved');

CREATE POLICY "listings_select_own" ON public.listings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "listings_select_admin" ON public.listings 
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "listings_insert_own" ON public.listings 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()) = false
  );

CREATE POLICY "listings_update_own" ON public.listings 
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "listings_delete_own" ON public.listings 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "listings_update_admin" ON public.listings 
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- LISTING IMAGES POLICIES
CREATE POLICY "listing_images_select_approved" ON public.listing_images 
  FOR SELECT USING (
    (SELECT status FROM public.listings WHERE id = listing_id) = 'approved'
  );

CREATE POLICY "listing_images_select_own" ON public.listing_images 
  FOR SELECT USING (
    (SELECT user_id FROM public.listings WHERE id = listing_id) = auth.uid()
  );

CREATE POLICY "listing_images_select_admin" ON public.listing_images 
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "listing_images_insert_own" ON public.listing_images 
  FOR INSERT WITH CHECK (
    (SELECT user_id FROM public.listings WHERE id = listing_id) = auth.uid()
  );

CREATE POLICY "listing_images_delete_own" ON public.listing_images 
  FOR DELETE USING (
    (SELECT user_id FROM public.listings WHERE id = listing_id) = auth.uid()
  );

-- ACTIVITY LOGS POLICIES
CREATE POLICY "activity_logs_admin_select" ON public.activity_logs 
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "activity_logs_admin_insert" ON public.activity_logs 
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
