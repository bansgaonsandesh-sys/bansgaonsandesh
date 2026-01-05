# Firebase Push Notifications Setup

This project uses Firebase Cloud Messaging (FCM) for push notifications.

## Setup Instructions

### 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bansgaonsandesh-bd46b`
3. Navigate to **Project Settings** > **Cloud Messaging**
4. Under **Web Push certificates**, click **Generate key pair**
5. Copy the **VAPID key** (Web Push certificate)

### 2. Update Environment Variables

Add the following to your `.env.local` or Vercel environment variables:

```bash
# Firebase Server Key (Legacy) - Found in Project Settings > Cloud Messaging
FIREBASE_SERVER_KEY=your_firebase_server_key_here

# Optional: For Firebase Admin SDK
FIREBASE_ADMIN_SERVICE_ACCOUNT=path_to_service_account_json
```

### 3. Update VAPID Key

Edit `src/lib/notifications.ts` and replace `YOUR_VAPID_KEY` with your actual VAPID key:

```typescript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_ACTUAL_VAPID_KEY_HERE'
});
```

### 4. Database Migration

Run the migration to add FCM token fields to profiles table:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration SQL file:
# supabase/migrations/20260105_add_fcm_tokens.sql
```

### 5. Test Notifications

1. Open the website and allow notifications when prompted
2. Create a new post
3. All users with notification permissions should receive a push notification

## How It Works

### Architecture

1. **Service Worker** (`public/firebase-messaging-sw.js`)
   - Handles background notifications
   - Listens for FCM messages
   - Shows notifications when app is in background

2. **Notification Library** (`src/lib/notifications.ts`)
   - Requests notification permission
   - Gets FCM token from Firebase
   - Saves token to database
   - Handles foreground messages

3. **API Routes**
   - `/api/notifications/save-token` - Saves FCM token to database
   - `/api/notifications/send` - Sends notifications to all users

4. **Post Creation Flow**
   - User creates post
   - Post saved to database
   - API sends notifications to all users (except author)
   - Users receive notification

### Notification Prompt

The `NotificationPrompt` component:
- Shows after 5 seconds on first visit
- Requests notification permission
- Saves FCM token to user profile
- Can be dismissed (won't show again)

### Database Schema

```sql
ALTER TABLE profiles ADD COLUMN fcm_token TEXT;
ALTER TABLE profiles ADD COLUMN fcm_token_updated_at TIMESTAMPTZ;
```

## Testing

### Local Testing

1. Run development server: `npm run dev`
2. Open in browser (must be HTTPS or localhost)
3. Allow notifications when prompted
4. Create a post
5. Check browser DevTools console for notification logs

### Production Testing

1. Deploy to Vercel
2. Test on multiple devices/browsers
3. Verify notifications are received

## Troubleshooting

### Notifications Not Working

1. **Check browser permissions**
   - Go to browser settings
   - Check notification permissions for your site

2. **Verify VAPID key**
   - Make sure VAPID key is correct in `notifications.ts`

3. **Check FCM tokens**
   - Query database to verify tokens are being saved:
   ```sql
   SELECT id, name, fcm_token FROM profiles WHERE fcm_token IS NOT NULL;
   ```

4. **Check server key**
   - Verify `FIREBASE_SERVER_KEY` environment variable is set

5. **Service Worker**
   - Check if service worker is registered: DevTools > Application > Service Workers

### Common Issues

- **"FCM token not available"**: User denied notification permission
- **"Failed to send notifications"**: Server key is missing or invalid
- **"Service worker not registered"**: HTTPS is required (or use localhost)

## Security Notes

- Never expose Firebase server key in client-side code
- Store server key in environment variables
- Validate user authentication before saving FCM tokens
- Clean up old/invalid FCM tokens periodically

## Resources

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
