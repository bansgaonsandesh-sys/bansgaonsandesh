# Fix Vercel R2 Bucket Configuration

## Problem
Error: "The specified bucket does not exist"
- Local environment works
- Production (Vercel) fails with 500 error

## Root Cause
Mismatch between local `.env` and Vercel environment variables for R2 bucket configuration.

## Your Current Local Configuration

From `.env`:
```
R2_BUCKET_NAME=next-update
R2_PUBLIC_URL=https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev
R2_ENDPOINT=https://46777aea35cdd385f1eacff41cfbb5c6.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=c5d11248cba73b0c134e76d5313e36e7
R2_SECRET_ACCESS_KEY=b746f4af16a514ea11c8340965cd466171d99f3417bfcd5207068ea83f6fe41a
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-08e1a83abb1d4ff0ac0fceba0438ba9c.r2.dev
```

## Steps to Fix

### Step 1: Check Cloudflare R2 Bucket
1. Login to Cloudflare Dashboard: https://dash.cloudflare.com
2. Go to **R2** in the left sidebar
3. Check which buckets exist
4. Verify the bucket name (should be `next-update` or something similar)
5. Click on the bucket → **Settings** → Check the **Public R2.dev subdomain**

### Step 2: Update Vercel Environment Variables

Go to: https://vercel.com/skyablys-projects/bansgaonsandesh/settings/environment-variables

**Required Variables** (copy exact values from your working local `.env`):

#### Server-Side Variables (used in API routes)
```
R2_BUCKET_NAME=next-update
R2_ENDPOINT=https://46777aea35cdd385f1eacff41cfbb5c6.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=c5d11248cba73b0c134e76d5313e36e7
R2_SECRET_ACCESS_KEY=b746f4af16a514ea11c8340965cd466171d99f3417bfcd5207068ea83f6fe41a
R2_PUBLIC_URL=https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev
```

#### Client-Side Variables (used in browser)
```
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev
```

**⚠️ IMPORTANT**: Make sure `R2_PUBLIC_URL` and `NEXT_PUBLIC_R2_PUBLIC_URL` use the **SAME** URL!

### Step 3: Redeploy

After updating Vercel environment variables:

```bash
# Option 1: Trigger redeploy via Vercel Dashboard
# Go to Deployments → Click "..." → Redeploy

# Option 2: Push a small change
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push origin main

# Option 3: Redeploy via CLI
vercel --prod
```

## Verification Checklist

### In Cloudflare R2:
- [ ] Bucket `next-update` exists
- [ ] Public access is enabled
- [ ] Public URL is: `https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev`
- [ ] API token has read/write permissions

### In Vercel:
- [ ] `R2_BUCKET_NAME` = `next-update`
- [ ] `R2_ENDPOINT` = `https://46777aea35cdd385f1eacff41cfbb5c6.r2.cloudflarestorage.com`
- [ ] `R2_ACCESS_KEY_ID` set correctly
- [ ] `R2_SECRET_ACCESS_KEY` set correctly
- [ ] `R2_PUBLIC_URL` = `https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev`
- [ ] `NEXT_PUBLIC_R2_PUBLIC_URL` = `https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev`
- [ ] All variables set for **Production** environment

## Quick Test After Fix

1. Go to your site: https://bansgaonsandesh-12f3dz3et-skyablys-projects.vercel.app
2. Try creating a post with an image
3. Check browser console for errors
4. If successful, you should see: `[R2 Upload] Upload successful`

## Common Issues

### Issue: "The specified bucket does not exist"
**Solution**: Bucket name in Vercel doesn't match actual bucket name in Cloudflare R2

### Issue: "Access Denied"
**Solution**: API token doesn't have correct permissions. Create new token with "Object Read & Write" permissions

### Issue: Images upload but don't display
**Solution**: Public URL mismatch. Ensure `R2_PUBLIC_URL` and `NEXT_PUBLIC_R2_PUBLIC_URL` match

### Issue: Works locally but not on Vercel
**Solution**: Environment variables not set in Vercel or set for wrong environment (Development vs Production)

## Alternative: Create New Bucket

If you can't find the `next-update` bucket, create a new one:

1. Cloudflare Dashboard → R2 → **Create Bucket**
2. Name: `bansgaonsandesh` (or any name)
3. Enable **Public R2.dev subdomain**
4. Copy the public URL (e.g., `https://pub-xxx.r2.dev`)
5. Create API Token:
   - **R2 Token** → Create Token
   - Name: `bansgaonsandesh-upload`
   - Permissions: **Object Read & Write**
   - TTL: Never expires
   - Apply to specific buckets: Select your new bucket
   - Copy the Access Key ID and Secret Access Key

6. Update **both** `.env` (local) and Vercel with new values:
   ```
   R2_BUCKET_NAME=bansgaonsandesh
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxx.r2.dev
   R2_ACCESS_KEY_ID=<new-key-id>
   R2_SECRET_ACCESS_KEY=<new-secret-key>
   ```

## After Fixing

Once uploads work, you should see in browser console:
```
[CreatePost] Media files to upload: 1
[R2 Upload] Received upload request
[R2 Upload] Upload successful
[CreatePost] Upload results Array(1) [success: true]
```

## Need Help?

Run this command to check current Vercel environment variables:
```bash
vercel env pull .env.vercel
cat .env.vercel | grep R2
```

Compare with your local `.env`:
```bash
cat .env | grep R2
```

They should match exactly!
