import { siteConfig as SITE_CONFIG } from '@/config/site'

export const dynamic = 'force-static'

export async function GET() {
  const baseUrl = SITE_CONFIG.url

  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /post/*
Allow: /explore
Allow: /user/*

# Disallow admin and auth pages
Disallow: /admin
Disallow: /admin/*
Disallow: /auth/*
Disallow: /api/*
Disallow: /wallet
Disallow: /profile/edit

# Crawl-delay (optional, helps reduce server load)
Crawl-delay: 1

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/news-sitemap.xml

# RSS Feeds
# ${baseUrl}/rss.xml
# ${baseUrl}/feed.json

# Special rules for Google News Bot
User-agent: Googlebot-News
Allow: /
Allow: /post/*
Disallow: /auth/*
Disallow: /admin/*
Disallow: /api/*

# Allow image crawling
User-agent: Googlebot-Image
Allow: /
Allow: /post/*

# Mobile crawler
User-agent: Googlebot-Mobile
Allow: /
Allow: /post/*`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
