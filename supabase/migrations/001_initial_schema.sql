-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  captain_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create function to check team member limit
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM team_members 
      WHERE team_id = NEW.team_id 
      AND status = 'accepted') >= 10 THEN
    RAISE EXCEPTION 'Team roster limit of 10 players reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team member limit
DROP TRIGGER IF EXISTS enforce_team_member_limit ON team_members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION check_team_member_limit();

-- Create seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  recurring_config JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create season_teams table
CREATE TABLE IF NOT EXISTS public.season_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  total_sets_won INTEGER DEFAULT 0,
  total_sets_lost INTEGER DEFAULT 0,
  UNIQUE(season_id, team_id)
);

-- Create game_days table
CREATE TABLE IF NOT EXISTS public.game_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_results table
CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID NOT NULL REFERENCES public.game_days(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sets_won INTEGER NOT NULL DEFAULT 0,
  sets_lost INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_day_id, team_id)
);

-- Create function to update season_teams totals
CREATE OR REPLACE FUNCTION update_season_teams_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_season_id UUID;
BEGIN
  -- Get season_id from game_day
  SELECT season_id INTO v_season_id
  FROM game_days
  WHERE id = NEW.game_day_id;

  -- Update or insert season_teams record
  INSERT INTO season_teams (season_id, team_id, total_sets_won, total_sets_lost)
  VALUES (v_season_id, NEW.team_id, NEW.sets_won, NEW.sets_lost)
  ON CONFLICT (season_id, team_id)
  DO UPDATE SET
    total_sets_won = season_teams.total_sets_won - COALESCE(OLD.sets_won, 0) + NEW.sets_won,
    total_sets_lost = season_teams.total_sets_lost - COALESCE(OLD.sets_lost, 0) + NEW.sets_lost;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update season_teams
DROP TRIGGER IF EXISTS auto_update_season_teams ON game_results;
CREATE TRIGGER auto_update_season_teams
  AFTER INSERT OR UPDATE ON game_results
  FOR EACH ROW
  EXECUTE FUNCTION update_season_teams_totals();

-- Create newsletters table
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin users policies
CREATE POLICY "Anyone can view admins" ON public.admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage admins" ON public.admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Teams policies
CREATE POLICY "Anyone can view teams" ON public.teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update their teams" ON public.teams
  FOR UPDATE USING (captain_id = auth.uid());

CREATE POLICY "Captains can delete their teams" ON public.teams
  FOR DELETE USING (captain_id = auth.uid());

-- Team members policies
CREATE POLICY "Anyone can view team members" ON public.team_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Captains can manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND captain_id = auth.uid())
  );

CREATE POLICY "Users can accept invitations" ON public.team_members
  FOR UPDATE USING (user_id = auth.uid());

-- Seasons policies
CREATE POLICY "Anyone can view seasons" ON public.seasons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage seasons" ON public.seasons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Season teams policies
CREATE POLICY "Anyone can view season teams" ON public.season_teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage season teams" ON public.season_teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Game days policies
CREATE POLICY "Anyone can view game days" ON public.game_days
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage game days" ON public.game_days
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Game results policies
CREATE POLICY "Anyone can view game results" ON public.game_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage game results" ON public.game_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Newsletters policies
CREATE POLICY "Anyone can view published newsletters" ON public.newsletters
  FOR SELECT USING (
    auth.role() = 'authenticated' AND published_at IS NOT NULL
  );

CREATE POLICY "Admins can view all newsletters" ON public.newsletters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Only admins can manage newsletters" ON public.newsletters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Only admins can update newsletters" ON public.newsletters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Only admins can delete newsletters" ON public.newsletters
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create storage bucket for schedule images
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-images', 'schedule-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for schedule images
CREATE POLICY "Anyone can view schedule images" ON storage.objects
  FOR SELECT USING (bucket_id = 'schedule-images');

CREATE POLICY "Admins can upload schedule images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'schedule-images' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update schedule images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'schedule-images' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete schedule images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'schedule-images' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

