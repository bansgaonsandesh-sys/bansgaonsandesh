import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // OPTIMIZATION: Only run for post pages to reduce edge invocations
  // Static pages don't need dynamic headers
  const pathname = request.nextUrl.pathname
  
  // Only process post pages for crawler optimization
  if (!pathname.startsWith('/post/')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  
  // OPTIMIZATION: Simplified bot detection - only for essential social media bots
  const userAgent = request.headers.get('user-agent') || ''
  const isCrawler = /facebookexternalhit|twitterbot|whatsapp|telegrambot/i.test(userAgent)

  if (isCrawler) {
    // Set aggressive caching for bots to reduce repeat requests
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  return response
}

export const config = {
  matcher: [
    // OPTIMIZATION: Only match post pages, exclude all static assets
    '/post/:path*',
  ],
}
