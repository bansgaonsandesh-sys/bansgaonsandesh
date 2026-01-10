# 🎯 Supabase Migration - Ready to Execute

## ✅ What's Been Prepared

### 📁 Backup Structure
```
supabase-backup/
├── README.md                    # Overview and instructions
├── migrations/                  # All 50 migration SQL files (copied)
│   ├── 20251103074224_create_cities_table.sql
│   ├── 20251103074234_create_profiles_table.sql
│   └── ... (48 more files)
```

### 🛠️ Migration Tools Created

1. **`export_supabase_db.sh`** ⬇️
   - Downloads complete database schema
   - Exports all 2,073 posts, 106 users, 128 cities
   - Backs up functions, triggers, RLS policies
   - **Run this first**

2. **`import_to_new_supabase.sh`** ⬆️
   - Imports everything to new Supabase account
   - Runs all 50 migrations
   - Restores all data
   - **Run this second**

3. **`quick_migration.sh`** ⚡
   - Interactive step-by-step guide
   - For first-time migrators
   - **Run this if you want guidance**

4. **`MIGRATION_GUIDE.md`** 📖
   - Complete documentation
   - Troubleshooting tips
   - Post-migration checklist

## 🚀 Quick Start (3 Commands)

### 1️⃣ Export Current Database
```bash
# Get DB URL from: Old Supabase Dashboard > Settings > Database
export SUPABASE_DB_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"

./export_supabase_db.sh
```

### 2️⃣ Create New Supabase Project
- Go to https://supabase.com/dashboard
- Click "New Project"
- Save: URL, Anon Key, Service Key, DB Password

### 3️⃣ Import to New Database
```bash
# Get DB URL from: New Supabase Dashboard > Settings > Database
export NEW_SUPABASE_DB_URL="postgresql://postgres:NEW_PASSWORD@db.yyy.supabase.co:5432/postgres"

./import_to_new_supabase.sh
```

Type `yes` and wait 2-5 minutes ☕

## 📊 What Will Be Migrated

| Item | Count | Status |
|------|-------|--------|
| Posts | 2,073 | ✅ Ready |
| Users | 106 | ✅ Ready |
| Cities | 128 | ✅ Ready |
| Projects | 2 | ✅ Ready |
| Migrations | 50 | ✅ Copied |
| Functions | ~15 | ✅ In migrations |
| Triggers | ~10 | ✅ In migrations |
| RLS Policies | ~30 | ✅ In migrations |

## ⚙️ After Migration

### Update `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://NEW_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=new_anon_key
SUPABASE_SERVICE_ROLE_KEY=new_service_role_key
```

### Update Vercel
1. Dashboard > Project > Settings > Environment Variables
2. Edit all 3 Supabase variables
3. Redeploy

### Enable Auth (New Dashboard)
- Authentication > Providers > Enable Email
- Authentication > URL Configuration:
  - Site URL: `https://bansgaonsandesh.com`
  - Redirect URLs: `https://bansgaonsandesh.com/**`

## ⚠️ Important Notes

### Media Files (R2 Storage)
✅ **No action needed!** Media files are in Cloudflare R2, not Supabase.  
Posts contain R2 URLs like `https://pub-xxx.r2.dev/...` - these continue to work.

### User Passwords
⚠️ **Users need to reset passwords** (Auth is separate from data).  
Enable "Auto confirm emails" in new dashboard to skip verification.

### No Downtime
✅ Keep old Supabase running until migration is verified.  
✅ Switch when ready, instant rollback possible.

## 🆘 Need Help?

### Common Issues

**"psql: command not found"**
```bash
# macOS
brew install postgresql@15

# After install
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

**"connection refused"**
- Check database password is correct
- Verify connection string format
- Try pinging Supabase: `ping db.xxx.supabase.co`

**"relation already exists"**
- Safe to ignore - means already created
- Import continues normally

### Get More Help
- Read `MIGRATION_GUIDE.md` for detailed steps
- Check `supabase-backup/README.md` for technical details
- Run `./quick_migration.sh` for interactive mode

## ✅ Pre-Flight Checklist

Before running export:
- [ ] Have old Supabase DB password
- [ ] PostgreSQL client installed (`psql` command available)
- [ ] Enough disk space (~100 MB for backup)

Before running import:
- [ ] New Supabase project created
- [ ] Have new DB password
- [ ] Export completed successfully
- [ ] Reviewed backup files

After import:
- [ ] Verify row counts match
- [ ] Test login
- [ ] Test post creation
- [ ] Update app environment variables
- [ ] Deploy to Vercel
- [ ] Test production site

## 📞 Support

If migration fails or you need help:
1. Check error message
2. Read MIGRATION_GUIDE.md troubleshooting section
3. Try manual import via Supabase Dashboard > SQL Editor
4. Contact via GitHub issues

---

**Ready to migrate?** Run:
```bash
./quick_migration.sh
```

Or for experts:
```bash
./export_supabase_db.sh    # Export
./import_to_new_supabase.sh # Import
```

Good luck! 🚀
