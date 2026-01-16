-- Migration: Player Game Participation and Stats Tracking
-- Allows team captains to report scores and track which players played each game day
-- Calculates individual player win/loss records

-- =====================================================
-- 1. Track which players participated in each game day
-- =====================================================
CREATE TABLE IF NOT EXISTS public.game_day_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_day_id UUID NOT NULL REFERENCES public.game_days(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_day_id, team_id, user_id)
);

-- =====================================================
-- 2. Add reported_by to game_results for captain reporting
-- =====================================================
ALTER TABLE public.game_results 
ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES public.users(id);

-- =====================================================
-- 3. Create player_stats table to cache aggregated stats
-- =====================================================
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_sets_won INTEGER DEFAULT 0,
  total_sets_lost INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. Function to update player stats when results change
-- =====================================================
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
DECLARE
  player RECORD;
BEGIN
  -- For each player who participated in this game day for this team
  FOR player IN 
    SELECT user_id 
    FROM game_day_players 
    WHERE game_day_id = NEW.game_day_id AND team_id = NEW.team_id
  LOOP
    -- Recalculate total stats for this player
    INSERT INTO player_stats (user_id, total_sets_won, total_sets_lost, games_played, updated_at)
    SELECT 
      player.user_id,
      COALESCE(SUM(gr.sets_won), 0),
      COALESCE(SUM(gr.sets_lost), 0),
      COUNT(DISTINCT gdp.game_day_id),
      NOW()
    FROM game_day_players gdp
    JOIN game_results gr ON gr.game_day_id = gdp.game_day_id AND gr.team_id = gdp.team_id
    WHERE gdp.user_id = player.user_id
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_sets_won = EXCLUDED.total_sets_won,
      total_sets_lost = EXCLUDED.total_sets_lost,
      games_played = EXCLUDED.games_played,
      updated_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update player stats when game results change
DROP TRIGGER IF EXISTS auto_update_player_stats ON game_results;
CREATE TRIGGER auto_update_player_stats
  AFTER INSERT OR UPDATE ON game_results
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();

-- =====================================================
-- 5. Function to recalculate player stats when participation changes
-- =====================================================
CREATE OR REPLACE FUNCTION recalc_player_stats_on_participation()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate stats for the affected player
  INSERT INTO player_stats (user_id, total_sets_won, total_sets_lost, games_played, updated_at)
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(SUM(gr.sets_won), 0),
    COALESCE(SUM(gr.sets_lost), 0),
    COUNT(DISTINCT gdp.game_day_id),
    NOW()
  FROM game_day_players gdp
  JOIN game_results gr ON gr.game_day_id = gdp.game_day_id AND gr.team_id = gdp.team_id
  WHERE gdp.user_id = COALESCE(NEW.user_id, OLD.user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_sets_won = EXCLUDED.total_sets_won,
    total_sets_lost = EXCLUDED.total_sets_lost,
    games_played = EXCLUDED.games_played,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for participation changes
DROP TRIGGER IF EXISTS auto_recalc_player_stats ON game_day_players;
CREATE TRIGGER auto_recalc_player_stats
  AFTER INSERT OR DELETE ON game_day_players
  FOR EACH ROW
  EXECUTE FUNCTION recalc_player_stats_on_participation();

-- =====================================================
-- 6. Enable RLS on new tables
-- =====================================================
ALTER TABLE public.game_day_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS Policies for game_day_players
-- =====================================================

-- Anyone authenticated can view game day players
CREATE POLICY "Anyone can view game day players" ON public.game_day_players
  FOR SELECT USING (auth.role() = 'authenticated');

-- Team captains can manage their team's players for game days
CREATE POLICY "Captains can manage game day players" ON public.game_day_players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

-- Admins can manage all game day players
CREATE POLICY "Admins can manage all game day players" ON public.game_day_players
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- 8. RLS Policies for player_stats
-- =====================================================

-- Anyone authenticated can view player stats
CREATE POLICY "Anyone can view player stats" ON public.player_stats
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only triggers update player stats (no direct user access)
CREATE POLICY "System updates player stats" ON public.player_stats
  FOR ALL USING (false);

-- =====================================================
-- 9. Update game_results policies to allow captain reporting
-- =====================================================

-- Drop existing admin-only policy if it exists
DROP POLICY IF EXISTS "Only admins can manage game results" ON public.game_results;

-- Captains can report results for their team's games
CREATE POLICY "Captains can report game results" ON public.game_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

CREATE POLICY "Captains can update their game results" ON public.game_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

-- Admins can still manage all game results
CREATE POLICY "Admins can manage all game results" ON public.game_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- 10. Helper view for player leaderboard
-- =====================================================
CREATE OR REPLACE VIEW public.player_leaderboard AS
SELECT 
  ps.user_id,
  u.display_name,
  u.email,
  ps.total_sets_won,
  ps.total_sets_lost,
  ps.games_played,
  CASE 
    WHEN (ps.total_sets_won + ps.total_sets_lost) > 0 
    THEN ROUND((ps.total_sets_won::DECIMAL / (ps.total_sets_won + ps.total_sets_lost)) * 100, 1)
    ELSE 0 
  END as win_percentage,
  (
    SELECT array_agg(DISTINCT t.name)
    FROM game_day_players gdp
    JOIN teams t ON t.id = gdp.team_id
    WHERE gdp.user_id = ps.user_id
  ) as teams_played_on
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
WHERE ps.games_played > 0
ORDER BY 
  win_percentage DESC,
  ps.total_sets_won DESC,
  ps.games_played DESC;

-- Grant access to the view
GRANT SELECT ON public.player_leaderboard TO authenticated;
