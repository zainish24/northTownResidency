-- Agents table for Contact Agent section
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  photo_url TEXT,
  designation TEXT DEFAULT 'Property Consultant',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active, display_order);

-- Insert default agents
INSERT INTO public.agents (name, phone, whatsapp, email, designation, display_order) VALUES
('Ahmed Khan', '+923001234567', '+923001234567', 'ahmed@ntrproperties.com', 'Senior Property Consultant', 1),
('Fatima Ali', '+923009876543', '+923009876543', 'fatima@ntrproperties.com', 'Property Advisor', 2),
('Hassan Raza', '+923007654321', '+923007654321', 'hassan@ntrproperties.com', 'Sales Manager', 3);
