/**
 * OPTIMIZED R2 Client-Side Upload Helper
 * Uses pre-signed URLs for direct client-to-R2 uploads
 * Eliminates file data passing through Vercel Functions (massive CPU savings)
 */

const PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-6e7642a7bb4b4b13b9e8f03f6af6a982.r2.dev').trim()

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

/**
 * OPTIMIZED: Upload file directly to R2 using pre-signed URL
 * Step 1: Get pre-signed URL from lightweight API
 * Step 2: Upload directly to R2 (bypasses Vercel)
 */
export async function uploadToR2Optimized(
  file: Blob | File,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  try {
    // Step 1: Request pre-signed URL from API (lightweight operation)
    const presignedRes = await fetch('/api/r2/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        contentType,
        fileSize: file.size,
      }),
    })

    if (!presignedRes.ok) {
      const error = await presignedRes.json().catch(() => ({ error: 'Failed to get upload URL' }))
      throw new Error(error.error || 'Failed to get upload URL')
    }

    const { presignedUrl, publicUrl } = await presignedRes.json()

    // Step 2: Upload directly to R2 using pre-signed URL
    // This bypasses Vercel entirely - saves massive CPU and bandwidth
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    })

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.statusText}`)
    }

    console.log('✅ File uploaded directly to R2:', publicUrl)

    return { success: true, url: publicUrl, key }
  } catch (error) {
    console.error('R2 upload error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

/**
 * LEGACY: Upload via API route (proxies through Vercel - NOT RECOMMENDED)
 * Only use if pre-signed URLs don't work for your use case
 */
export async function uploadToR2Legacy(
  file: Buffer | Uint8Array | string | Blob,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  try {
    const form = new FormData()
    const blob = file instanceof Blob ? file : new Blob([file as any], { type: contentType })
    form.append('file', blob)
    form.append('key', key)
    form.append('contentType', contentType)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    const res = await fetch('/api/r2/upload', {
      method: 'POST',
      body: form,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      let errMsg = 'Upload failed'
      try {
        const data = await res.json()
        errMsg = data?.error || errMsg
      } catch {}
      throw new Error(errMsg)
    }

    const data = await res.json().catch(() => ({}))
    return { success: true, url: data.url, key: data.key }
  } catch (error) {
    console.error('R2 upload error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

// Default export uses optimized version
export const uploadToR2 = uploadToR2Optimized

/**
 * Delete file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/r2/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Delete failed' }))
      throw new Error(data.error || 'Delete failed')
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
  }
}

/**
 * Generate unique file key with timestamp and random string
 */
export function generateFileKey(originalName: string, folder: string = ''): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')
  
  const key = folder 
    ? `${folder}/${timestamp}_${random}_${baseName}.${extension}`
    : `${timestamp}_${random}_${baseName}.${extension}`
    
  return key
}

/**
 * Upload multiple files to R2
 */
export async function uploadMultipleToR2(
  files: Array<{
    file: File | Blob
    originalName: string
    contentType: string
    folder?: string
  }>
): Promise<UploadResult[]> {
  const uploadPromises = files.map(async (fileData) => {
    const key = generateFileKey(fileData.originalName, fileData.folder)
    return uploadToR2(fileData.file, key, fileData.contentType)
  })

  return Promise.all(uploadPromises)
}

/**
 * Utility function to get file extension and validate image/video types
 */
export function validateMediaFile(filename: string, file: File): {
  isValid: boolean
  type: 'image' | 'video' | null
  contentType: string
  error?: string
} {
  const extension = filename.toLowerCase().split('.').pop()
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm']
  
  if (!extension) {
    return {
      isValid: false,
      type: null,
      contentType: 'application/octet-stream',
      error: 'No file extension found'
    }
  }

  if (imageExtensions.includes(extension)) {
    return {
      isValid: true,
      type: 'image',
      contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`
    }
  }

  if (videoExtensions.includes(extension)) {
    return {
      isValid: true,
      type: 'video',
      contentType: `video/${extension === 'mov' ? 'quicktime' : extension}`
    }
  }

  return {
    isValid: false,
    type: null,
    contentType: 'application/octet-stream',
    error: 'Unsupported file format'
  }
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Ensure R2 URL is using the direct public URL (not proxied)
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If relative path, construct full R2 URL
  return `${PUBLIC_URL}/${url.replace(/^\//, '')}`
}
