# Database Migration Guide

## Recommended Approach: Supabase CLI

The Supabase CLI is the best way to manage database migrations for production use.

### Initial Setup

1. **Install Supabase CLI:**
   
   **macOS (recommended):**
   ```bash
   brew install supabase/tap/supabase
   ```
   
   **Windows:**
   ```bash
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```
   
   **Linux:**
   ```bash
   # Download and install
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
   sudo mv supabase /usr/local/bin/
   ```
   
   **Using npx (no installation needed):**
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   
   Find your project ref in your Supabase dashboard URL:
   `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

4. **Apply migrations:**
   ```bash
   supabase db push
   ```

### Workflow for Future Migrations

1. **Create a new migration:**
   ```bash
   supabase migration new add_feature_name
   ```

2. **Edit the migration file** in `supabase/migrations/`

3. **Apply to remote database:**
   ```bash
   supabase db push
   ```

4. **Reset local database (if needed):**
   ```bash
   supabase db reset
   ```

### Advantages

- ✅ **Version Control**: All migrations tracked in Git
- ✅ **Team Friendly**: Everyone can apply the same migrations
- ✅ **Reproducible**: Consistent across environments
- ✅ **Rollback Support**: Easy to revert changes
- ✅ **CI/CD Ready**: Automate in deployment pipelines

---

## Alternative: Manual SQL (Current Approach)

**Good for:**
- ✅ Quick prototypes
- ✅ Single developer projects
- ✅ One-time setup

**Limitations:**
- ❌ Not version controlled
- ❌ Hard to reproduce
- ❌ Manual process prone to errors
- ❌ Difficult for team collaboration

### Manual Steps (if CLI not available)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy `supabase/migrations/001_initial_schema.sql`
4. Paste and run

---

## Alternative: Migration Tools

### Option 1: Prisma

If you prefer Prisma's ORM and schema management:

```bash
npm install prisma @prisma/client
npx prisma init
```

**Pros:**
- Type-safe database queries
- Auto-generated client
- Schema-first approach

**Cons:**
- Additional dependency
- Learning curve
- May conflict with Supabase's type generation

### Option 2: Drizzle ORM

Lightweight TypeScript ORM:

```bash
npm install drizzle-orm drizzle-kit
```

**Pros:**
- Lightweight and fast
- SQL-like syntax
- Good TypeScript support

**Cons:**
- Another tool to learn
- Less mature than Prisma

---

## Recommended for This Project

**For Development/Learning:**
- Use manual SQL paste (simplest to get started)

**For Production/Team Projects:**
- Use Supabase CLI (best practice)

**For Large Teams:**
- Consider Prisma or Drizzle for additional type safety

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Database

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Apply migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

---

## Migration Best Practices

1. **Always backup** before running migrations on production
2. **Test migrations** on a staging environment first
3. **Write reversible migrations** when possible
4. **Version control** all migration files
5. **Document breaking changes** in migration comments
6. **Use transactions** to ensure atomicity

---

## Troubleshooting

### CLI Not Connecting?

```bash
# Check if logged in
supabase projects list

# Re-login
supabase logout
supabase login
```

### Migration Conflicts?

```bash
# Check migration status
supabase migration list

# Force sync
supabase db push --force
```

### Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase db reset

# Stop local Supabase
supabase stop
```

---

## For This Project

If you want to switch to CLI-based migrations:

1. Install Supabase CLI
2. Run: `supabase link --project-ref YOUR_PROJECT_REF`
3. Run: `supabase db push`
4. Future migrations: `supabase migration new feature_name`

The migration file in `supabase/migrations/001_initial_schema.sql` is already CLI-compatible!

