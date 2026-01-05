-- Add FCM token fields to profiles table for push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;

-- Create index for faster FCM token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON profiles(fcm_token) WHERE fcm_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN profiles.fcm_token_updated_at IS 'Timestamp when FCM token was last updated';
