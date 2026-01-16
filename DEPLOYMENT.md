# Deployment Guide

This guide will walk you through deploying your volleyball league management application to production.

## Prerequisites

1. A Supabase account (free tier works great)
2. A Vercel account (free tier is sufficient)
3. A GitHub account

---

## Multi-Environment Setup (Recommended)

For a proper development workflow, set up three environments:

| Environment | Supabase Project | Database | Deployment |
|------------|------------------|----------|------------|
| **Dev** | Local (Docker) or cloud dev project | Isolated test data | `localhost:3000` |
| **Staging** | `midtown-staging` | Test data | `staging.yourapp.com` |
| **Production** | `midtown-prod` | Real user data | `yourapp.com` |

### Create Separate Supabase Projects

In the [Supabase Dashboard](https://supabase.com/dashboard), create two projects:
- `midtown-staging` (for staging/preview deployments)
- `midtown-prod` (for production)

Each project gets its own URL and API keys.

### Environment Variables by Environment

**`.env.local`** (local development - gitignored):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
# Or use your staging project for local dev:
# NEXT_PUBLIC_SUPABASE_URL=https://your-staging-ref.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```

**Staging** (set in Vercel):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```

**Production** (set in Vercel):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

### Vercel Environment Configuration

In your Vercel project settings → **Environment Variables**, set different values per environment:

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | (optional) | staging URL | prod URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (optional) | staging key | prod key |

With this setup:
- **Preview deployments** (PRs, branches) → use staging Supabase
- **Production deployment** (`main` branch) → use production Supabase

### Database Migrations per Environment

Run migrations separately for each Supabase project:

```bash
# Deploy to staging
npx supabase link --project-ref <staging-project-ref>
npx supabase db push

# Deploy to production
npx supabase link --project-ref <prod-project-ref>
npx supabase db push
```

**Tip:** Create a migration script for convenience:

```bash
#!/bin/bash
# scripts/migrate.sh
ENV=$1

if [ "$ENV" = "staging" ]; then
  PROJECT_REF="your-staging-ref"
elif [ "$ENV" = "prod" ]; then
  PROJECT_REF="your-prod-ref"
else
  echo "Usage: ./scripts/migrate.sh [staging|prod]"
  exit 1
fi

npx supabase link --project-ref $PROJECT_REF
npx supabase db push
echo "✅ Migrations applied to $ENV"
```

### Local Development with Supabase CLI

For fully isolated local development (requires Docker):

```bash
# Start local Supabase
npx supabase start

# This gives you:
# - Local Postgres at localhost:54321
# - Local Auth at localhost:54321/auth/v1
# - Studio UI at localhost:54323

# Stop when done
npx supabase stop
```

### Email Redirect URLs

The app automatically uses `window.location.origin` for email confirmation redirects, so it works correctly in all environments:

- Local: `http://localhost:3000/dashboard`
- Staging: `https://staging.yourapp.com/dashboard`
- Production: `https://yourapp.com/dashboard`

**Important:** Add all your domains to Supabase's allowed redirect URLs:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://staging.yourapp.com/**`
   - `https://yourapp.com/**`

### Environment Architecture Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Local     │     │    Staging      │     │   Production    │
│ localhost   │     │ staging.app.com │     │   app.com       │
└──────┬──────┘     └────────┬────────┘     └────────┬────────┘
       │                     │                       │
       ▼                     ▼                       ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Local DB   │     │ Supabase        │     │ Supabase        │
│  (Docker)   │     │ Staging Project │     │ Prod Project    │
└─────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Step 1: Set Up Supabase

1. **Create a Supabase project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Start your project"
   - Create a new organization (if you don't have one)
   - Create a new project
   - Choose a database password and save it securely
   - Wait for the database to be provisioned (~2 minutes)

2. **Run the database migrations:**
   
   **Recommended: Using Supabase CLI**
   ```bash
   # Install CLI (macOS)
   brew install supabase/tap/supabase
   
   # Or use npx without installing
   # npx supabase [command]
   
   # Login to Supabase
   supabase login
   
   # Link your project (find project-ref in your dashboard URL)
   supabase link --project-ref your-project-ref
   
   # Push migrations to production
   supabase db push
   ```
   
   **Alternative: Manual SQL (UI)**
   - In your Supabase dashboard, go to the SQL Editor
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration
   - You should see "Success. No rows returned"
   
   > 💡 The CLI approach is better for production as it's version-controlled and reproducible.

3. **Get your API credentials:**
   - Go to Project Settings > API
   - Copy the "Project URL" (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy the "anon public" key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

4. **Configure the storage bucket:**
   - Go to Storage in the left sidebar
   - You should see a bucket called `schedule-images`
   - If not, create it manually and make it public
   - Set policies are already created by the migration

## Step 2: Push to GitHub

1. **Initialize git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Volleyball League Management System"
   ```

2. **Create a GitHub repository:**
   - Go to [https://github.com/new](https://github.com/new)
   - Create a new repository (e.g., "volleyball-league-app")
   - Don't initialize with README (we already have one)

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

1. **Connect Vercel to GitHub:**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up or log in with GitHub
   - Click "Add New" > "Project"
   - Import your GitHub repository

2. **Configure environment variables:**
   In the project configuration, add these environment variables:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-from-step-1
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-1
   INITIAL_ADMIN_EMAIL=your-email@example.com
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be live at a Vercel URL (e.g., `your-app.vercel.app`)

## Step 4: Set Up Your Admin Account

1. **Register your admin account:**
   - Visit your deployed app URL
   - Click "Register"
   - Register using the email you specified in `INITIAL_ADMIN_EMAIL`
   - Complete the registration

2. **Grant admin access:**
   - Go to your Supabase dashboard
   - Go to Table Editor > `users` table
   - Find your user record and copy your user ID
   - Go to SQL Editor and run:
   
   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('your-user-id-here');
   ```

3. **Verify admin access:**
   - Refresh your app
   - You should now see an "Admin" link in the navigation
   - Click it to access the admin dashboard

## Step 5: Configure a Custom Domain (Optional)

1. **In Vercel:**
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain
   - Follow the DNS configuration instructions

2. **Update your Supabase settings:**
   - Add your custom domain to the allowed redirect URLs in Supabase
   - Go to Authentication > URL Configuration
   - Add your domain to the site URL list

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `INITIAL_ADMIN_EMAIL` | Email for first admin (for reference) | `admin@example.com` |

### Per-Environment Configuration

See the [Multi-Environment Setup](#multi-environment-setup-recommended) section for how to configure different values for dev, staging, and production.

## Post-Deployment Checklist

- [ ] Database migrations executed successfully
- [ ] Admin account created and verified
- [ ] Storage bucket is public and accessible
- [ ] Can create teams
- [ ] Can create seasons
- [ ] Can upload schedule images
- [ ] Can enter game results
- [ ] Can create newsletters
- [ ] Standings calculate correctly

## Troubleshooting

### "Failed to create team" error
- Check that Row Level Security policies are properly set
- Verify your user is authenticated
- Check browser console for detailed errors

### Images not uploading
- Verify the `schedule-images` bucket exists and is public
- Check storage policies are applied correctly
- Ensure file size is under 5MB

### "Not authorized" errors
- Clear browser cache and cookies
- Log out and log back in
- Verify your user ID is in the `admin_users` table

### Database connection errors
- Check your Supabase project is active
- Verify environment variables are set correctly
- Check Supabase project isn't paused (free tier pauses after inactivity)

## Updating the Application

To deploy updates:

1. Make your code changes
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Vercel will automatically deploy the updates

## Monitoring

- **Vercel Analytics:** Built-in analytics in your Vercel dashboard
- **Supabase Logs:** View database queries and errors in Supabase dashboard
- **Error Tracking:** Consider adding Sentry for production error tracking

## Backup

- **Database:** Supabase automatically backs up your database
- **Code:** Your GitHub repository serves as version control
- **Images:** Consider setting up periodic backups of the storage bucket

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Review Vercel deployment logs for build errors
4. Consult the README.md for setup instructions

