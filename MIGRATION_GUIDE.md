# Complete Supabase Migration Guide

## 🎯 Goal
Migrate entire Bansgavsandesh database from current Supabase account to a NEW Supabase account.

## 📦 What Will Be Migrated
- ✅ All 20 tables with complete schema
- ✅ 2,073 posts (news articles)
- ✅ 106 user profiles
- ✅ 128 cities
- ✅ All likes, comments, shares, payments
- ✅ All database functions & triggers
- ✅ All RLS (Row Level Security) policies
- ✅ 50 migration files for version control

## 🚀 Migration Steps

### Step 1: Get Current Database Connection
1. Go to **OLD** Supabase Dashboard
2. Settings > Database > Connection string
3. Copy the URI: `postgresql://postgres:[password]@[host]:5432/postgres`
4. Set environment variable:
```bash
export SUPABASE_DB_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"
```

### Step 2: Export Everything
```bash
# Run the export script
./export_supabase_db.sh
```

This creates `supabase-backup/` folder with:
- `00_extensions.sql` - Required PostgreSQL extensions
- `01_schema_dump.sql` - All table structures
- `02_data_export.sql` - All data as INSERT statements (~2000 posts!)
- `03_functions_triggers.sql` - Database functions
- `04_policies_rls.sql` - Security policies
- `migrations/` - All 50 migration files

### Step 3: Create New Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Wait for setup to complete (~2 minutes)
4. **Save your new credentials:**
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGc...`
   - Service role key: `eyJhbGc...`
   - Database password: (you set this)

### Step 4: Get New Database Connection
1. Go to **NEW** Supabase Dashboard
2. Settings > Database > Connection string
3. Copy the URI
4. Set environment variable:
```bash
export NEW_SUPABASE_DB_URL="postgresql://postgres:NEW_PASSWORD@db.yyy.supabase.co:5432/postgres"
```

### Step 5: Import Everything
```bash
# Run the import script
./import_to_new_supabase.sh
```

Type `yes` when prompted. This will:
1. Install required extensions
2. Create all tables
3. Import all 2,073 posts
4. Import 106 users
5. Import 128 cities
6. Set up functions & triggers
7. Apply RLS policies

**Expected time:** 2-5 minutes

### Step 6: Verify Migration
After import completes, check the verification output:
```
cities   | profiles | posts | projects
---------|----------|-------|----------
128      | 106      | 2073  | 2
```

Also verify in new Supabase Dashboard:
- Go to Table Editor
- Check `posts`, `profiles`, `cities` tables
- Verify data is present

### Step 7: Update Application

#### Update Environment Variables
Edit `.env.local`:
```bash
# OLD (comment out)
# NEXT_PUBLIC_SUPABASE_URL=https://old.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=old_key

# NEW (add these)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

#### Update Vercel Environment Variables
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Update all 3 Supabase variables
3. Redeploy your app

### Step 8: Enable Supabase Auth
In NEW Supabase Dashboard:
1. Authentication > Providers
2. Enable Email provider
3. Set Site URL: `https://bansgaonsandesh.com`
4. Add Redirect URLs:
   - `https://bansgaonsandesh.com/**`
   - `http://localhost:3000/**`

### Step 9: Test Everything
1. Try logging in with an existing user
2. Create a test post
3. Check if likes/comments work
4. Verify wallet/points system

## ⚠️ Important Notes

### Auth Users
- Profiles table references `auth.users` table
- Supabase Auth stores user credentials separately
- **Users will need to reset passwords** in new account
- Option: Enable "Auto confirm emails" in new dashboard

### File URLs (R2 Storage)
Posts contain media URLs like:
```
https://pub-xxx.r2.dev/posts/image.jpg
```

These will still work! R2 storage is separate from Supabase. But if you change R2 bucket:
1. Run find/replace on `media_urls` column
2. Or update R2 bucket to same domain

### Edge Functions
No edge functions detected in current setup. If you had any, backup from:
```
supabase/functions/
```

## 🆘 Troubleshooting

### Error: "relation already exists"
- Safe to ignore - means table was already created
- Import continues

### Error: "role does not exist"
```bash
# Edit the SQL file and remove:
-- Owner: postgres
-- Owner: authenticator
```

### Import is slow (>10 minutes)
- Normal for 2,000+ posts
- Check network connection
- Supabase free tier has slower imports

### RLS Policies preventing access
Temporarily disable for testing:
```sql
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```
Then re-enable after fixing policies.

## 📱 Post-Migration Checklist

- [ ] All tables have data
- [ ] User login works
- [ ] Posts display correctly
- [ ] Can create new post
- [ ] Likes/comments work
- [ ] Wallet system works
- [ ] Admin panel accessible
- [ ] Vercel deployment uses new DB
- [ ] Mobile app (if any) updated

## 🔄 Rollback Plan

If something goes wrong:
1. Keep OLD Supabase project active
2. In Vercel, revert environment variables
3. Redeploy
4. You're back to old database

Don't delete old project until you're 100% sure new one works!

## 💰 Cost Consideration

Supabase Free Tier Limits:
- 500 MB database
- 50 MB storage
- 2 GB bandwidth

Your database size: ~50-100 MB (mostly posts/images are in R2, not DB)
**You should be fine on free tier!**

---

**Created:** 2026-01-10  
**Database:** bansgavsandesh  
**Tables:** 20  
**Records:** 2,300+  
**Migrations:** 50
