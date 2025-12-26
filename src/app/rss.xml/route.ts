import { supabase } from '@/lib/supabase'
import { siteConfig as SITE_CONFIG } from '@/config/site'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url

    // Fetch recent posts for RSS feed
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        caption,
        media_urls,
        media_type,
        created_at,
        updated_at,
        profiles:user_id(name),
        cities:city_id(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching posts for RSS:', error)
      return new Response('Error generating RSS feed', { status: 500 })
    }

    const buildDate = new Date().toUTCString()
    const lastBuildDate = posts?.[0]?.created_at 
      ? new Date(posts[0].created_at).toUTCString() 
      : buildDate

    // Build RSS 2.0 Feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${baseUrl}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>${SITE_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}${SITE_CONFIG.images.logo}</url>
      <title>${SITE_CONFIG.name}</title>
      <link>${baseUrl}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} ${SITE_CONFIG.name}</copyright>
    <managingEditor>${SITE_CONFIG.contact.email} (${SITE_CONFIG.name})</managingEditor>
    <webMaster>${SITE_CONFIG.contact.email} (${SITE_CONFIG.name})</webMaster>

${posts?.map(post => {
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const city = Array.isArray(post.cities) ? post.cities[0] : post.cities
  const title = post.title || 'Latest Update'
  const description = post.caption || title
  const pubDate = new Date(post.created_at).toUTCString()
  const postUrl = `${baseUrl}/post/${post.id}`
  const author = profile?.name || SITE_CONFIG.name
  const category = city?.name || 'News'
  const guid = post.id

  // Prepare content
  let content = `<![CDATA[`
  if (post.media_urls && post.media_urls[0]) {
    if (post.media_type === 'video') {
      content += `<video controls style="max-width: 100%; height: auto;">
        <source src="${post.media_urls[0]}" type="video/mp4">
      </video><br/>`
    } else {
      content += `<img src="${post.media_urls[0]}" alt="${title}" style="max-width: 100%; height: auto;"/><br/>`
    }
  }
  content += `<p>${description}</p>]]>`

  return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded>${content}</content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      <category>${category}</category>
      ${post.media_urls && post.media_urls[0] ? `
      <enclosure url="${post.media_urls[0]}" type="${post.media_type === 'video' ? 'video/mp4' : 'image/jpeg'}"/>
      <media:content url="${post.media_urls[0]}" medium="${post.media_type === 'video' ? 'video' : 'image'}" type="${post.media_type === 'video' ? 'video/mp4' : 'image/jpeg'}">
        <media:title>${title}</media:title>
        <media:description>${description}</media:description>
      </media:content>` : ''}
    </item>`
}).join('')}

  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
