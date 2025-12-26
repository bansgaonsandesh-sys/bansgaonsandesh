/**
 * SEO Helper Utilities
 * Dynamic SEO functions for platform
 */

import { siteConfig, getAbsoluteUrl, getImageUrl } from '@/config/site'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
}

const BASE_URL = siteConfig.url
const SITE_NAME = siteConfig.name
const DEFAULT_IMAGE = siteConfig.images.ogImage

/**
 * Generate complete metadata for any page
 */
export function generateMetadata(config: SEOConfig) {
  const {
    title = SITE_NAME,
    description = 'Connect, share, and earn points in your city.',
    keywords = [],
    image = DEFAULT_IMAGE,
    url = BASE_URL,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
  } = config

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`

  return {
    title: fullTitle,
    description,
    keywords: [...keywords, 'social media', 'india', 'local news', 'community'].join(', '),
    openGraph: {
      title: fullTitle,
      description,
      type,
      url: fullUrl,
      siteName: SITE_NAME,
      locale: 'hi_IN',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: siteConfig.social.twitter,
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

/**
 * Generate JSON-LD structured data for articles/posts
 */
export function generateArticleSchema(data: {
  id: string
  title: string
  description: string
  image?: string | string[]
  author: string
  publishedDate: string
  modifiedDate?: string
  section?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: data.title,
    description: data.description,
    image: Array.isArray(data.image) ? data.image : [data.image || DEFAULT_IMAGE],
    datePublished: data.publishedDate,
    dateModified: data.modifiedDate || data.publishedDate,
    author: {
      '@type': 'Person',
      name: data.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/post/${data.id}`,
    },
    ...(data.section && { articleSection: data.section }),
    inLanguage: 'hi-IN',
  }
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

/**
 * Truncate text for meta descriptions
 */
export function truncateText(text: string, maxLength: number = 160): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3).trim() + '...'
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  if (!text) return []
  
  // Remove common Hindi and English stop words
  const stopWords = new Set([
    'और', 'का', 'की', 'को', 'में', 'से', 'है', 'हैं', 'के', 'ने', 'था', 'थी', 'पर', 'यह',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\u0900-\u097Fa-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  // Count frequency
  const frequency: { [key: string]: number } = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Sort by frequency and take top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Generate slug from text (Hindi and English)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0900-\u097Fa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, BASE_URL)
    return parsed.toString()
  } catch {
    return BASE_URL
  }
}

export const SEO_CONSTANTS = {
  BASE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  DEFAULT_DESCRIPTION: siteConfig.description,
  DEFAULT_KEYWORDS: [...siteConfig.keywords],
  TWITTER_HANDLE: siteConfig.social.twitter,
  LOCALE: siteConfig.locale.default,
  LANGUAGE: siteConfig.language,
} as const
