#!/bin/bash
# Supabase Database Full Export Script
# Run this to download complete database from current Supabase account

set -e

echo "🔄 Starting Supabase Database Export..."
echo ""

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL environment variable not set"
  echo "Get it from: Supabase Dashboard > Settings > Database > Connection string"
  echo "Example: postgresql://postgres:[password]@[host]:5432/postgres"
  exit 1
fi

BACKUP_DIR="supabase-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📁 Creating backup directory..."
mkdir -p $BACKUP_DIR

# 1. Export complete schema
echo "📋 Exporting database schema..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  > "$BACKUP_DIR/01_schema_dump.sql"

# 2. Export all data
echo "💾 Exporting all table data..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-acl \
  --column-inserts \
  > "$BACKUP_DIR/02_data_export.sql"

# 3. Export functions and triggers
echo "⚙️  Exporting functions and triggers..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-data \
  --no-owner \
  --no-acl \
  | grep -A 1000 "CREATE FUNCTION\|CREATE TRIGGER" \
  > "$BACKUP_DIR/03_functions_triggers.sql" || true

# 4. Export RLS policies
echo "🔒 Exporting RLS policies..."
psql "$SUPABASE_DB_URL" -t -c "
SELECT 'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;'
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 'CREATE POLICY ' || policyname || ' ON ' || schemaname || '.' || tablename || 
       ' AS ' || cmd || 
       CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
       CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';'
FROM pg_policies 
WHERE schemaname = 'public';
" > "$BACKUP_DIR/04_policies_rls.sql" 2>/dev/null || true

# 5. List all extensions
echo "🧩 Listing installed extensions..."
psql "$SUPABASE_DB_URL" -t -c "
SELECT 'CREATE EXTENSION IF NOT EXISTS \"' || extname || '\";'
FROM pg_extension 
WHERE extname NOT IN ('plpgsql');
" > "$BACKUP_DIR/00_extensions.sql" 2>/dev/null || true

# 6. Export storage buckets info
echo "🪣 Exporting storage bucket configuration..."
psql "$SUPABASE_DB_URL" -t -c "
SELECT * FROM storage.buckets;
" > "$BACKUP_DIR/05_storage_buckets.txt" 2>/dev/null || true

echo ""
echo "✅ Export completed successfully!"
echo ""
echo "📦 Backup saved to: $BACKUP_DIR/"
echo "📊 Files created:"
ls -lh $BACKUP_DIR/
echo ""
echo "Next steps:"
echo "1. Review files in $BACKUP_DIR/"
echo "2. Get new Supabase project credentials"
echo "3. Run ./import_to_new_supabase.sh with new DB URL"
