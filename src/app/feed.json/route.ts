import { supabase } from '@/lib/supabase'
import { siteConfig as SITE_CONFIG } from '@/config/site'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const baseUrl = SITE_CONFIG.url

    // Fetch recent posts for JSON feed
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
        profiles:user_id(id, name, avatar_url),
        cities:city_id(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching posts for JSON feed:', error)
      return new Response('Error generating JSON feed', { status: 500 })
    }

    // Build JSON Feed (jsonfeed.org spec)
    const jsonFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: SITE_CONFIG.name,
      home_page_url: baseUrl,
      feed_url: `${baseUrl}/feed.json`,
      description: SITE_CONFIG.description,
      icon: `${baseUrl}${SITE_CONFIG.images.logo}`,
      favicon: `${baseUrl}/favicon.ico`,
      language: SITE_CONFIG.language,
      authors: [
        {
          name: SITE_CONFIG.name,
          url: baseUrl,
        },
      ],
      items: posts?.map(post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        const city = Array.isArray(post.cities) ? post.cities[0] : post.cities
        
        return {
          id: post.id,
          url: `${baseUrl}/post/${post.id}`,
          title: post.title || 'Latest Update',
          content_html: post.caption || '',
          date_published: post.created_at,
          date_modified: post.updated_at || post.created_at,
          authors: [
            {
              name: profile?.name || SITE_CONFIG.name,
              url: `${baseUrl}/user/${profile?.id}`,
              avatar: profile?.avatar_url,
            },
          ],
          tags: [city?.name || 'News'],
          image: post.media_urls?.[0],
          attachments: post.media_urls?.[0]
            ? [
                {
                  url: post.media_urls[0],
                  mime_type: post.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
                },
              ]
            : undefined,
        }
      }) || [],
    }

    return new Response(JSON.stringify(jsonFeed, null, 2), {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Error generating JSON feed:', error)
    return new Response('Error generating JSON feed', { status: 500 })
  }
}
