export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          user_id: string
          granted_at: string
        }
        Insert: {
          user_id: string
          granted_at?: string
        }
        Update: {
          user_id?: string
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_users_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          captain_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          captain_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          captain_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_captain_id_fkey'
            columns: ['captain_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          status: 'pending' | 'accepted'
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          status?: 'pending' | 'accepted'
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          status?: 'pending' | 'accepted'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      seasons: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          recurring_config: Json
          status: 'draft' | 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          recurring_config: Json
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          recurring_config?: Json
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
        Relationships: []
      }
      season_teams: {
        Row: {
          id: string
          season_id: string
          team_id: string
          total_sets_won: number
          total_sets_lost: number
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          total_sets_won?: number
          total_sets_lost?: number
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          total_sets_won?: number
          total_sets_lost?: number
        }
        Relationships: [
          {
            foreignKeyName: 'season_teams_season_id_fkey'
            columns: ['season_id']
            referencedRelation: 'seasons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'season_teams_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      game_days: {
        Row: {
          id: string
          season_id: string
          game_date: string
          description: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          season_id: string
          game_date: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          game_date?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_days_season_id_fkey'
            columns: ['season_id']
            referencedRelation: 'seasons'
            referencedColumns: ['id']
          },
        ]
      }
      game_results: {
        Row: {
          id: string
          game_day_id: string
          team_id: string
          sets_won: number
          sets_lost: number
          recorded_at: string
          reported_by: string | null
        }
        Insert: {
          id?: string
          game_day_id: string
          team_id: string
          sets_won: number
          sets_lost: number
          recorded_at?: string
          reported_by?: string | null
        }
        Update: {
          id?: string
          game_day_id?: string
          team_id?: string
          sets_won?: number
          sets_lost?: number
          recorded_at?: string
          reported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'game_results_game_day_id_fkey'
            columns: ['game_day_id']
            referencedRelation: 'game_days'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_results_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_results_reported_by_fkey'
            columns: ['reported_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      game_day_players: {
        Row: {
          id: string
          game_day_id: string
          team_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          game_day_id: string
          team_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          game_day_id?: string
          team_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_day_players_game_day_id_fkey'
            columns: ['game_day_id']
            referencedRelation: 'game_days'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_day_players_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_day_players_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      player_stats: {
        Row: {
          user_id: string
          total_sets_won: number
          total_sets_lost: number
          games_played: number
          updated_at: string
        }
        Insert: {
          user_id: string
          total_sets_won?: number
          total_sets_lost?: number
          games_played?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_sets_won?: number
          total_sets_lost?: number
          games_played?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_stats_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      newsletters: {
        Row: {
          id: string
          title: string
          content: string
          created_by: string
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_by: string
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_by?: string
          created_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'newsletters_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          invited_by: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          email?: string
          invited_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_invites_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_invites_invited_by_fkey'
            columns: ['invited_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      player_leaderboard: {
        Row: {
          user_id: string
          display_name: string | null
          email: string
          total_sets_won: number
          total_sets_lost: number
          games_played: number
          win_percentage: number
          teams_played_on: string[] | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
