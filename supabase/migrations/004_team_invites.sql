-- Create team_invites table for inviting players by email before they register
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Policies for team_invites
CREATE POLICY "Team captains can manage invites for their teams" ON public.team_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND captain_id = auth.uid())
  );

CREATE POLICY "Admins can manage all invites" ON public.team_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view invites for their email" ON public.team_invites
  FOR SELECT USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Function to process pending invites when a user registers
CREATE OR REPLACE FUNCTION process_pending_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Find all pending invites for this user's email and create team_members entries
  INSERT INTO public.team_members (team_id, user_id, status)
  SELECT ti.team_id, NEW.id, 'accepted'
  FROM public.team_invites ti
  WHERE LOWER(ti.email) = LOWER(NEW.email)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- Delete processed invites
  DELETE FROM public.team_invites
  WHERE LOWER(email) = LOWER(NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process invites when a new user is created
DROP TRIGGER IF EXISTS on_user_created_process_invites ON public.users;
CREATE TRIGGER on_user_created_process_invites
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_invites();

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(LOWER(email));
