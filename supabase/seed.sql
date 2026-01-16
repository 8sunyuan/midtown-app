-- Seed file for initial admin setup
-- Run this AFTER registering your admin user through the app
-- Replace 'your-admin-email@example.com' with your actual email

-- Grant admin access to initial admin user
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'your-admin-email@example.com'
ON CONFLICT (user_id) DO NOTHING;

