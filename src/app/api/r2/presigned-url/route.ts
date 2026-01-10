import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// OPTIMIZATION: Lightweight route - only generates URLs, doesn't handle file data
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim()
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim()
const ENDPOINT = (process.env.R2_ENDPOINT || '').trim()
const ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim()
const SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim()

if (!BUCKET_NAME || !PUBLIC_URL || !ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.warn('[R2 Pre-signed] Missing environment variables. Pre-signed URLs will fail.')
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT?.trim(),
  credentials: {
    accessKeyId: (ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (SECRET_ACCESS_KEY || '').trim(),
  },
})

/**
 * OPTIMIZATION: Generate pre-signed URL for direct client-to-R2 upload
 * This eliminates file data passing through Vercel Functions
 * Client uploads directly to R2, saving massive CPU and bandwidth
 */
export async function POST(req: NextRequest) {
  try {
    if (!BUCKET_NAME || !PUBLIC_URL || !ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      return NextResponse.json({ 
        error: 'R2 not configured',
      }, { status: 500 })
    }

    const { key, contentType = 'application/octet-stream', fileSize = 0 } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Optional: Add file size limit
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` 
      }, { status: 400 })
    }

    // Generate pre-signed URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    // URL expires in 10 minutes - plenty of time for upload
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 })

    // Public URL where file will be accessible after upload
    const publicUrl = `${PUBLIC_URL}/${key}`

    console.log('[R2 Pre-signed] Generated URL for key:', key)

    return NextResponse.json({
      success: true,
      presignedUrl, // Client uses this to upload
      publicUrl,    // Final public URL of uploaded file
      key,
      expiresIn: 600,
    })
  } catch (error: any) {
    console.error('[R2 Pre-signed] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate pre-signed URL',
      details: error.message 
    }, { status: 500 })
  }
}
