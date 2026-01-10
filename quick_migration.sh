#!/bin/bash
# Quick Start - Supabase Migration
# 
# Use this if you're in a hurry and know what you're doing

echo "🎯 Supabase Migration - Quick Start"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1
echo -e "${YELLOW}STEP 1: Export from OLD Supabase${NC}"
echo "Get connection string from old Supabase dashboard:"
echo "  Settings > Database > Connection string"
echo ""
echo "Then run:"
echo -e "${GREEN}export SUPABASE_DB_URL=\"postgresql://postgres:PASSWORD@db.OLD.supabase.co:5432/postgres\"${NC}"
echo -e "${GREEN}./export_supabase_db.sh${NC}"
echo ""
read -p "Press Enter after export completes..."

# Step 2
echo ""
echo -e "${YELLOW}STEP 2: Create NEW Supabase Project${NC}"
echo "1. Go to https://supabase.com"
echo "2. New Project"
echo "3. Save credentials (URL, keys, password)"
echo ""
read -p "Press Enter when new project is ready..."

# Step 3
echo ""
echo -e "${YELLOW}STEP 3: Import to NEW Supabase${NC}"
echo "Get connection string from new Supabase dashboard:"
echo "  Settings > Database > Connection string"
echo ""
echo "Then run:"
echo -e "${GREEN}export NEW_SUPABASE_DB_URL=\"postgresql://postgres:NEW_PASSWORD@db.NEW.supabase.co:5432/postgres\"${NC}"
echo -e "${GREEN}./import_to_new_supabase.sh${NC}"
echo ""
read -p "Press Enter after import completes..."

# Step 4
echo ""
echo -e "${YELLOW}STEP 4: Update Application${NC}"
echo "Update .env.local with new Supabase credentials:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=new_anon_key"
echo "SUPABASE_SERVICE_ROLE_KEY=new_service_key"
echo ""
echo "Also update in Vercel Dashboard > Settings > Environment Variables"
echo ""
read -p "Press Enter when updated..."

# Step 5
echo ""
echo -e "${YELLOW}STEP 5: Configure Auth${NC}"
echo "In new Supabase Dashboard:"
echo "1. Authentication > Providers > Enable Email"
echo "2. Authentication > URL Configuration:"
echo "   - Site URL: https://bansgaonsandesh.com"
echo "   - Redirect URLs: https://bansgaonsandesh.com/**"
echo ""
read -p "Press Enter when configured..."

# Done
echo ""
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo ""
echo "Test your app:"
echo "1. npm run dev"
echo "2. Try logging in"
echo "3. Check if posts load"
echo ""
echo "If everything works, you can delete the OLD Supabase project."
echo ""
echo "⚠️  Don't forget to update Vercel deployment!"
