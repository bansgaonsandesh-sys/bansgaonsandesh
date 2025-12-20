-- Fix the ads_status_check constraint to include 'pending' status
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;

-- Add the corrected constraint that includes 'pending'
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'rejected', 'expired'));
