-- North Town Residency - Seed Data
-- UPDATED: Complete phases and blocks based on detailed information

-- Insert Phases
INSERT INTO public.phases (name, location, description, display_order, is_active) VALUES
('Phase 1', 'Surjani Town, near Northern Bypass (M-10)', 'The flagship phase of North Town Residency with premium commercial and residential options. Around 40-45 acres with 1000 plots.', 1, true),
('Phase 2', 'Surjani Town, near Northern Bypass (M-10)', 'Expanded residential options after Phase 1 success with modern blocks and flexible payment plans.', 2, true),
('Phase 3', 'Surjani Town, near Northern Bypass (M-10)', 'Focuses on constructed houses and villas instead of plots, targeting ready homes.', 3, true),
('Phase 4', 'Surjani Town, near Northern Bypass (M-10)', 'Largest new expansion with 300 acres, premium blocks near Gulshan-e-Maymar.', 4, true)
ON CONFLICT (name) DO NOTHING;

-- Insert Blocks for Phase 1
INSERT INTO public.blocks (phase_id, name, block_type, description, is_active)
SELECT p.id, b.name, b.block_type, b.description, true
FROM public.phases p
CROSS JOIN (VALUES
  ('Titanium Block', 'mixed', 'Premium block with residential and commercial options'),
  ('Commercial Areas', 'commercial', 'Includes GFS Mega Bazaar, Chase Mall Commercial Shops, Anarkali Jewellery Market, Global Mobile Market'),
  ('Mehran Block', 'residential', 'Family residential area with 80 & 120 sq yards plots')
) AS b(name, block_type, description)
WHERE p.name = 'Phase 1'
ON CONFLICT (phase_id, name) DO NOTHING;

-- Insert Blocks for Phase 2
INSERT INTO public.blocks (phase_id, name, block_type, description, is_active)
SELECT p.id, b.name, b.block_type, b.description, true
FROM public.phases p
CROSS JOIN (VALUES
  ('Bolan Executive Block', 'residential', 'Premium residential block'),
  ('Mehran Block', 'residential', 'Residential plots with flexible installment plans'),
  ('Premium Block', 'mixed', 'Premium block with exclusive plots'),
  ('Phase 6 Block (Bolan Executive Phase 6)', 'residential', 'Extended residential development')
) AS b(name, block_type, description)
WHERE p.name = 'Phase 2'
ON CONFLICT (phase_id, name) DO NOTHING;

-- Insert Blocks for Phase 3
INSERT INTO public.blocks (phase_id, name, block_type, description, is_active)
SELECT p.id, b.name, b.block_type, b.description, true
FROM public.phases p
CROSS JOIN (VALUES
  ('Villas Block', 'residential', 'Constructed villas and ready houses, mostly 120 sq yard villas'),
  ('Family Residential', 'residential', 'Family-oriented residential environment with parks and mosques')
) AS b(name, block_type, description)
WHERE p.name = 'Phase 3'
ON CONFLICT (phase_id, name) DO NOTHING;

-- Insert Blocks for Phase 4
INSERT INTO public.blocks (phase_id, name, block_type, description, is_active)
SELECT p.id, b.name, b.block_type, b.description, true
FROM public.phases p
CROSS JOIN (VALUES
  ('General Block', 'residential', 'Large residential zone with 300 acres, planned community'),
  ('Bolan Platinum Block', 'residential', 'Most premium block near Northern Bypass (M-10) and Gulshan-e-Maymar')
) AS b(name, block_type, description)
WHERE p.name = 'Phase 4'
ON CONFLICT (phase_id, name) DO NOTHING;

-- Insert default admin profile
INSERT INTO public.profiles (id, phone, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', '+923001234567', 'NTR Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Seed data complete!' as status;
SELECT COUNT(*) as phases FROM public.phases;
SELECT COUNT(*) as blocks FROM public.blocks;
