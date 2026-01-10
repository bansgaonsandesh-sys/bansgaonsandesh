import { supabase } from '@/lib/supabase'
import { siteConfig as SITE_CONFIG } from '@/config/site'

// OPTIMIZATION: Increased cache duration to reduce bot-triggered invocations
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour (was using SITE_CONFIG value)

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url

    // Fetch all active posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching posts for sitemap:', error)
      return new Response('Error generating sitemap', { status: 500 })
    }

    // Fetch all cities
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name')
      .order('name')

    // Build XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Home Page -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Explore Page -->
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Cities -->
  ${cities?.map(city => `
  <url>
    <loc>${baseUrl}/explore?city=${encodeURIComponent(city.id)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}

  <!-- Posts -->
  ${posts?.map(post => {
    const lastmod = post.updated_at || post.created_at
    const isRecent = new Date(post.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    return `
  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${isRecent ? 'hourly' : 'daily'}</changefreq>
    <priority>${isRecent ? '0.9' : '0.7'}</priority>
  </url>`
  }).join('') || ''}

</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, s-maxage=${SITE_CONFIG.cache.revalidate.sitemap}, stale-while-revalidate=${SITE_CONFIG.cache.revalidate.sitemap * 2}`,
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
