-- Migration: Auto-promote initial admin user
-- This creates a trigger that automatically grants admin access
-- to the first user with a specific email pattern

-- Create a config table to store the initial admin email
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the initial admin email (update this before running!)
-- You can also update this directly in the Supabase dashboard
INSERT INTO public.app_config (key, value)
VALUES ('initial_admin_email', 'admin@example.com')
ON CONFLICT (key) DO NOTHING;

-- Create function to auto-promote admin on user creation
CREATE OR REPLACE FUNCTION auto_promote_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Get the configured admin email
  SELECT value INTO admin_email
  FROM public.app_config
  WHERE key = 'initial_admin_email';
  
  -- If the new user's email matches, grant admin access
  IF NEW.email = admin_email THEN
    INSERT INTO public.admin_users (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-promote on user creation
DROP TRIGGER IF EXISTS auto_promote_admin_trigger ON public.users;
CREATE TRIGGER auto_promote_admin_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_admin();

-- RLS for app_config (admins only can modify, but function can read)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.app_config
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify config" ON public.app_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

