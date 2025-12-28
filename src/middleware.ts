import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add headers for webview compatibility and social media crawlers
  const userAgent = request.headers.get('user-agent') || ''
  
  // Detect if request is from social media crawler or webview
  const isCrawler = /bot|crawler|spider|facebook|twitter|whatsapp|telegram|instagram|linkedin/i.test(userAgent)
  const isWebView = /WebView|wv|Android.*Mobile|iPhone.*Mobile/i.test(userAgent)

  if (isCrawler || isWebView) {
    // Allow embedding in social media preview and webviews
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    // Cache control for crawlers
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/post/:path*', // Ensure post pages always have proper headers
  ],
}
