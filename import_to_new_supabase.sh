#!/bin/bash
# Import Supabase Database to New Account
# Run this after exporting from old account

set -e

echo "🚀 Starting Supabase Database Import..."
echo ""

# Check if NEW_SUPABASE_DB_URL is set
if [ -z "$NEW_SUPABASE_DB_URL" ]; then
  echo "❌ Error: NEW_SUPABASE_DB_URL environment variable not set"
  echo "Get it from: New Supabase Dashboard > Settings > Database > Connection string"
  echo "Example: postgresql://postgres:[password]@[host]:5432/postgres"
  exit 1
fi

BACKUP_DIR="supabase-backup"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: $BACKUP_DIR directory not found"
  echo "Run ./export_supabase_db.sh first!"
  exit 1
fi

echo "⚠️  WARNING: This will import data to your NEW Supabase database"
echo "Database: $NEW_SUPABASE_DB_URL"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Import cancelled"
  exit 0
fi

echo ""
echo "🔄 Starting import process..."
echo ""

# 0. Install extensions
if [ -f "$BACKUP_DIR/00_extensions.sql" ]; then
  echo "🧩 Installing extensions..."
  psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/00_extensions.sql" || true
fi

# 1. Run all migrations (schema, functions, triggers automatically included)
echo "📋 Running migrations..."
if [ -d "$BACKUP_DIR/migrations" ]; then
  for migration in "$BACKUP_DIR/migrations"/*.sql; do
    echo "  Running: $(basename $migration)"
    psql "$NEW_SUPABASE_DB_URL" -f "$migration" 2>&1 | grep -v "already exists" || true
  done
else
  # Fallback: import schema dump
  echo "📋 Importing database schema..."
  psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/01_schema_dump.sql" 2>&1 | grep -v "already exists" || true
fi

# 2. Import all data
echo "💾 Importing table data (this may take a few minutes)..."
psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/02_data_export.sql"

# 3. Import functions & triggers (if not in migrations)
if [ -f "$BACKUP_DIR/03_functions_triggers.sql" ]; then
  echo "⚙️  Importing functions and triggers..."
  psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/03_functions_triggers.sql" 2>&1 | grep -v "already exists" || true
fi

# 4. Import RLS policies
if [ -f "$BACKUP_DIR/04_policies_rls.sql" ]; then
  echo "🔒 Importing RLS policies..."
  psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/04_policies_rls.sql" 2>&1 | grep -v "already exists" || true
fi

# 5. Verify import
echo ""
echo "✅ Verifying import..."
psql "$NEW_SUPABASE_DB_URL" -c "
SELECT 
  (SELECT COUNT(*) FROM cities) as cities,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM posts) as posts,
  (SELECT COUNT(*) FROM projects) as projects;
"

echo ""
echo "🎉 Import completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env.local with new Supabase credentials:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key"
echo "   SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key"
echo ""
echo "2. Test authentication in new Supabase dashboard"
echo "3. Update Cloudflare R2 CORS settings if needed"
echo "4. Deploy to Vercel with new environment variables"
