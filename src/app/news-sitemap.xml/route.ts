import { supabase } from '@/lib/supabase'
import { siteConfig as SITE_CONFIG } from '@/config/site'

export const dynamic = 'force-dynamic'
export const revalidate = SITE_CONFIG.cache.revalidate.newsSitemap

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url

    // Fetch posts from last N days for Google News
    const daysAgo = new Date(Date.now() - SITE_CONFIG.news.daysLimit * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        caption,
        media_urls,
        created_at,
        profiles:user_id(name),
        cities:city_id(name)
      `)
      .eq('is_active', true)
      .gte('created_at', daysAgo)
      .order('created_at', { ascending: false })
      .limit(SITE_CONFIG.news.postsLimit)

    if (error) {
      console.error('Error fetching posts for news sitemap:', error)
      return new Response('Error generating news sitemap', { status: 500 })
    }

    // Build Google News Sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  ${posts?.map(post => {
    const city = Array.isArray(post.cities) ? post.cities[0] : post.cities
    const title = post.title || 'Latest Update'
    const keywords = `${city?.name || 'India'}, news, updates`
    const publicationDate = new Date(post.created_at).toISOString()
    
    return `
  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_CONFIG.news.publicationName}</news:name>
        <news:language>${SITE_CONFIG.language}</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>
    ${post.media_urls && post.media_urls[0] ? `
    <image:image>
      <image:loc>${post.media_urls[0]}</image:loc>
      <image:caption><![CDATA[${title}]]></image:caption>
      <image:title><![CDATA[${title}]]></image:title>
    </image:image>` : ''}
    <lastmod>${publicationDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`
  }).join('') || ''}

</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, s-maxage=${SITE_CONFIG.cache.revalidate.newsSitemap}, stale-while-revalidate=${SITE_CONFIG.cache.revalidate.newsSitemap * 2}`,
      },
    })
  } catch (error) {
    console.error('Error generating news sitemap:', error)
    return new Response('Error generating news sitemap', { status: 500 })
  }
}
