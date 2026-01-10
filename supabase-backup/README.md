# Supabase Database Backup

Created: 2026-01-10

## Database Summary
- **Cities**: 128 records
- **Profiles**: 106 users
- **Posts**: 2,073 news articles  
- **Projects**: 2 projects (bansgaonsandesh, nextupdate)
- **Extensions**: pg_stat_statements, uuid-ossp, pgcrypto, pg_graphql, supabase_vault
- **Migrations**: 50 migration files

## Contents
- `migrations/` - All 50 migration SQL files (schema + functions + triggers)
- `01_schema_dump.sql` - Complete database schema
- `02_data_export.sql` - All table data as INSERT statements
- `03_functions_triggers.sql` - All database functions and triggers
- `04_policies_rls.sql` - Row Level Security policies
- `restore_instructions.md` - Step-by-step restoration guide

## How to Restore to New Supabase Account

### Option 1: Using Supabase CLI (Recommended)
```bash
# 1. Link to your NEW Supabase project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# 2. Run all migrations in order
supabase db push

# 3. Import data
psql $DATABASE_URL -f supabase-backup/02_data_export.sql
```

### Option 2: Manual SQL Execution
1. Go to your new Supabase Dashboard > SQL Editor
2. Run files in order:
   - Run all migration files from `migrations/` folder (already ordered)
   - Run `02_data_export.sql` to import all data
   
### Option 3: Export-Import Script (Below)
Run the export script first, then import to new account.

## Important Notes
- ⚠️ Profiles table references auth.users - ensure Supabase Auth is configured
- ⚠️ File URLs in posts/ads point to old R2 storage - update after migration
- ⚠️ Update environment variables in your app after migration:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
