import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim()
const ENDPOINT = (process.env.R2_ENDPOINT || '').trim()
const ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim()
const SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim()

const r2Client = new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
})

export async function DELETE(req: NextRequest) {
    try {
        if (!BUCKET_NAME || !ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
            return NextResponse.json({ error: 'R2 configuration missing' }, { status: 500 })
        }

        const body = await req.json()
        const { key, keys } = body

        // Support both single 'key' and array of 'keys'
        const keysToDelete: string[] = keys || (key ? [key] : [])

        if (keysToDelete.length === 0) {
            return NextResponse.json({ error: 'Key or keys required' }, { status: 400 })
        }

        console.log(`[R2 Delete] Deleting ${keysToDelete.length} keys`)

        // Use DeleteObjectsCommand for batch deletion
        const command = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: keysToDelete.map((k) => ({ Key: k })),
                Quiet: true,
            },
        })

        await r2Client.send(command)

        console.log('[R2 Delete] Success')

        return NextResponse.json({
            success: true,
            count: keysToDelete.length,
        })
    } catch (error: any) {
        console.error('[R2 Delete] Error:', error)
        return NextResponse.json({
            error: 'Delete failed',
            details: error?.message || String(error)
        }, { status: 500 })
    }
}

// Support POST method for clients that prefer it
export async function POST(req: NextRequest) {
    return DELETE(req)
}
