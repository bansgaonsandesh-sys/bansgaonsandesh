import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PostDetail from '@/components/post/PostDetail'
import { siteConfig as SITE_CONFIG, getAbsoluteUrl, getImageUrl } from '@/config/site'

// Helper function alias for consistency
const getFullUrl = getAbsoluteUrl

interface PostPageProps {
  params: {
    id: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  try {
    // Use post ID directly
    const postId = params.id
    
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(name, avatar_url),
        cities:city_id(name)
      `)
      .eq('id', postId)
      .eq('is_active', true)      .eq('project_id', 'bansgaonsandesh')      .eq('project_id', 'bansgaonsandesh')
      .single()

    if (error || !post) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found'
      }
    }

    const title = post.title || 'Latest News'
    const description = post.caption?.substring(0, 160) || SITE_CONFIG.description
    const imageUrl = post.media_urls?.[0] || getImageUrl(SITE_CONFIG.images.ogImage)
    const cityName = post.cities?.name || 'India'
    const publishedTime = post.created_at
    const modifiedTime = post.updated_at || post.created_at
    const authorName = post.profiles?.name || SITE_CONFIG.name

    return {
      title: `${title} | ${cityName} समाचार | ${SITE_CONFIG.name}`,
      description,
      keywords: [
        title,
        cityName,
        'समाचार',
        'news',
        'भारत',
        'india',
        'latest news',
        'breaking news',
        post.media_type,
        `${cityName} news`,
        SITE_CONFIG.keywords.slice(0, 5).join(', '),
      ].join(', '),
      authors: [{ name: authorName }],
      creator: authorName,
      publisher: SITE_CONFIG.name,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime,
        modifiedTime,
        authors: [post.profiles?.name || SITE_CONFIG.name],
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: SITE_CONFIG.locale.default,
        siteName: SITE_CONFIG.name,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
        creator: SITE_CONFIG.social.twitter,
      },
      alternates: {
        canonical: getFullUrl(`/post/${post.id}`),
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Error Loading Post',
      description: 'An error occurred while loading the post'
    }
  }
}

// Generate static params for all posts (ISR)
export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .eq('is_active', true)
      .eq('project_id', 'bansgaonsandesh')
      .order('created_at', { ascending: false })
      .limit(100) // Generate top 100 posts at build time

    return posts?.map((post) => ({
      id: post.id,
    })) || []
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export const revalidate = SITE_CONFIG.cache.revalidate.post
export const dynamicParams = true // Enable dynamic params for ID-based URLs

export default async function PostPage({ params }: PostPageProps) {
  try {
    // Use post ID directly
    const postId = params.id
    
    console.log('[POST PAGE] Post ID:', postId)
    
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(id, name, avatar_url, has_blue_tick),
        cities:city_id(id, name),
        post_likes(user_id),
        post_comments(id, content, created_at, profiles:user_id(name, avatar_url))
      `)
      .eq('id', postId)
      .eq('is_active', true)
      .eq('project_id', 'bansgaonsandesh')
      .single()

    if (error || !post) {
      console.error('[POST PAGE] Post not found:', { postId, error })
      notFound()
    }

    console.log('[POST PAGE] Post loaded successfully:', post.id, post.title)

    // Generate comprehensive JSON-LD structured data for Google
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.title || 'Latest News Update',
      alternativeHeadline: post.title,
      description: post.caption?.substring(0, 200),
      image: post.media_urls || [],
      datePublished: post.created_at,
      dateCreated: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Person',
        name: post.profiles?.name || SITE_CONFIG.name,
        url: getFullUrl(`/user/${post.user_id}`),
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: getFullUrl('/'),
        logo: {
          '@type': 'ImageObject',
          url: getFullUrl(SITE_CONFIG.images.logo),
          width: 512,
          height: 512,
        },
        sameAs: [
          SITE_CONFIG.social.facebook,
          SITE_CONFIG.social.twitter,
          SITE_CONFIG.social.instagram,
        ].filter(Boolean),
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': getFullUrl(`/post/${post.id}`),
      },
      articleSection: post.cities?.name || 'News',
      articleBody: post.caption,
      inLanguage: 'hi-IN',
      isAccessibleForFree: true,
      keywords: [post.title, post.cities?.name, 'news', 'india'].filter(Boolean).join(', '),
      locationCreated: {
        '@type': 'Place',
        name: post.cities?.name || 'India',
      },
      commentCount: post.post_comments?.length || 0,
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: post.likes_count || 0,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: post.post_comments?.length || 0,
        },
      ],
    }

    // Breadcrumb Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: getFullUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.cities?.name || 'News',
          item: getFullUrl(`/explore?city=${post.city_id}`),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title || 'Post',
          item: getFullUrl(`/post/${post.id}`),
        },
      ],
    }

    // Website Schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: getFullUrl('/'),
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${getFullUrl('/explore')}?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [articleSchema, breadcrumbSchema, websiteSchema],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PostDetail post={post} />
      </>
    )
  } catch (error) {
    console.error('Error loading post:', error)
    notFound()
  }
}
