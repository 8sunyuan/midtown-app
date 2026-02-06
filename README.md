# Midtown Runs - Volleyball League Management System

A full-stack web application for managing adult volleyball leagues, built with Next.js 16, Supabase, and TypeScript.

> 🏐 Features a custom volleyball-themed design with illustrated players and scoreboard aesthetics!

## Quick Start (15 minutes)

Get your volleyball league website up and running quickly:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Clone and install:**
   ```bash
   git clone https://github.com/8sunyuan/midtown-app.git
   cd midtown-app
   npm install
   ```
3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your Supabase URL and anon key (found in your Supabase project settings > API).
4. **Run the migrations** in Supabase SQL Editor: paste and run each file in `supabase/migrations/` in order (001 through 004)
5. **Start the dev server:** `npm run dev`
6. **Register** with your admin email - you'll automatically become an admin!

For detailed instructions, see the [Setup Instructions](#setup-instructions) below.

## Features

### Admin Features
- Create and manage league seasons with recurring schedules
- Add teams to seasons
- Upload game day schedules with descriptions and images
- Enter game results (sets won/lost per team)
- Post newsletters and announcements
- Manage admin users

### User Features
- User registration and authentication
- Create and manage teams (max 10 players per team)
- Invite players to teams via email
- Report game results and track participating players
- View upcoming game schedules
- View season standings with win/loss records
- Player leaderboard with individual stats
- Read newsletters and announcements

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Authentication + Storage)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Hosting:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/8sunyuan/midtown-app.git
   cd midtown-app
   npm install
   ```

2. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the database to be provisioned

3. **Set up environment variables**
   
   Copy the example file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `INITIAL_ADMIN_EMAIL` - The email you'll register with to become the first admin

   You can find your Supabase URL and anon key in your Supabase project settings under **API**.
   
   **Important:** Without these environment variables, the build will fail. Make sure to set them before running `npm run build` or `npm run dev`.

4. **Run the database migrations**
   
   **Option A: Using Supabase CLI (Recommended for production)**
```bash
   # Install CLI (macOS)
   brew install supabase/tap/supabase
   
   # Or use npx without installing
   # npx supabase [command]
   
   # Login and link project
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Apply migrations
   supabase db push
   ```
   
   **Option B: Manual SQL (Quick start)**
   
   In your Supabase project dashboard:
   - Go to the SQL Editor
   - Copy and run each migration file in order:
     1. `supabase/migrations/001_initial_schema.sql`
     2. `supabase/migrations/002_auto_admin_promotion.sql`
     3. `supabase/migrations/003_player_stats.sql`
     4. `supabase/migrations/004_team_invites.sql`
   
   > 📖 See `MIGRATION_GUIDE.md` for detailed migration strategies and best practices.

5. **Set up the storage bucket**
   
   The migration creates a storage bucket called `schedule-images` automatically. Make sure it's set to public in the Supabase Storage settings.

6. **Configure your admin email**
   
   Migration 002 creates an `app_config` table with a default admin email (`admin@example.com`). Update it to your email before registering:
   
   ```sql
   UPDATE public.app_config 
   SET value = 'your-email@example.com' 
   WHERE key = 'initial_admin_email';
   ```
   
   Then register through the app with that email - you'll automatically be granted admin access!
   
   > 💡 Alternatively, you can manually grant admin access after registration:
   > ```sql
   > INSERT INTO public.admin_users (user_id)
   > SELECT id FROM public.users WHERE email = 'your-email@example.com';
   > ```

7. **Add volleyball images (optional)**
   
   For the full visual experience, add your volleyball-themed images to `public/images/`:
   - `volleyball-players-dark.png` - Hero section background
   - `volleyball-players-light.png` - Optional alternate version
   - `scoreboard.png` - Optional scoreboard graphic
   
   See `public/images/README.md` for image guidelines and theme colors.

8. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
midtown-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (admin)/           # Admin pages (seasons, results, newsletters, etc.)
│   │   ├── (auth)/            # Authentication pages (login, register)
│   │   ├── dashboard/         # User dashboard
│   │   ├── newsletters/       # Public newsletters page
│   │   ├── schedule/          # Game schedule page
│   │   ├── standings/         # Season standings page
│   │   └── teams/             # Teams management & game reporting
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── user/              # User-facing components (Navigation, SeasonSelector)
│   ├── lib/                   # Utility libraries
│   │   ├── supabase/          # Supabase client configs
│   │   └── utils/             # Helper functions
│   └── types/                 # TypeScript type definitions
├── supabase/
│   ├── migrations/            # Database migrations (001-004)
│   └── seed.sql               # Seed data
└── public/                    # Static assets
    └── images/                # Volleyball-themed images
```

## Database Schema

The application uses the following main tables:

- `users` - User profiles (linked to Supabase Auth)
- `admin_users` - Admin designations
- `app_config` - Application configuration (e.g., initial admin email)
- `teams` - Team information
- `team_members` - Team rosters (max 10 per team)
- `team_invites` - Pending team invitations by email
- `seasons` - League seasons with recurring schedules
- `season_teams` - Teams participating in seasons with standings
- `game_days` - Individual game days with schedules
- `game_results` - Game results (sets won/lost)
- `game_day_players` - Players who participated in each game day
- `player_stats` - Aggregated player statistics
- `newsletters` - Announcements and newsletters
- `player_leaderboard` - View for player rankings by win percentage

## Deployment

### Deploy to Vercel

1. Fork or clone the repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in the Vercel project settings
4. Deploy!

### Environment Variables

Make sure to add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `INITIAL_ADMIN_EMAIL`

## Usage

### Admin Workflow

1. Log in with your admin account
2. Create a new season with start/end dates and recurring schedule
3. Add teams to the season
4. For each game day, upload the schedule (description + image)
5. After games, enter results (sets won/lost for each team)
6. Post newsletters to keep everyone informed

### User Workflow

1. Register an account
2. Create a team and invite players
3. View upcoming schedules
4. Check standings to see your team's performance
5. Read newsletters for league updates

## Future Enhancements

- Email notifications for schedules and newsletters
- Team statistics dashboard
- Mobile app
- Export standings to PDF
- Game day check-in system

## License

MIT
