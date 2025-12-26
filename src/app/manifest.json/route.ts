import { siteConfig as SITE_CONFIG } from '@/config/site'

export const dynamic = 'force-static'

export async function GET() {
  const manifest = {
    name: SITE_CONFIG.name,
    short_name: SITE_CONFIG.shortName,
    description: SITE_CONFIG.description,
    start_url: '/',
    display: 'standalone',
    background_color: SITE_CONFIG.theme.primaryColor,
    theme_color: SITE_CONFIG.theme.primaryColor,
    orientation: 'portrait',
    icons: [
      {
        src: SITE_CONFIG.images.logo,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: SITE_CONFIG.images.logo,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['social', 'news', 'lifestyle'],
    lang: SITE_CONFIG.locale.language,
    dir: 'ltr',
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
    },
  })
}
