/**
 * Centralized Site Configuration
 * All site-wide constants and settings in one place
 * Update these values to change across entire application
 */

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const siteConfig = {
  // Site Information
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Bansgaon Sandesh',
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || 'Bansgaon Sandesh',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Local news and updates for Bansgaon. Connect with your community and stay informed.',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Bansgaon Ki Awaz',
  
  // URLs and Domains
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bansgaonsandesh.com',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'bansgaonsandesh.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // SEO
  keywords: [
    'bansgaon news',
    'bansgaon sandesh',
    'local news',
    'uttar pradesh news',
    'gorakhpur news',
    'community news',
    'hindi news',
    'regional news',
    'bansgaon updates',
    'eastern up news',
  ],
  
  // Social Media
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@Bansgaon1989',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/@thebansgaonsandesh',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/sbansgaon',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/company/bansgaonsandesh',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@thebansgaonsandesh',
  },
  
  // Contact Information
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@bansgaonsandesh.com',
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91-9889802580',
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || 'Tahsil Gate Bansgaon Gorakhpur Utterpradesh',
  },
  
  // Images and Media
  images: {
    logo: '/logoo.jpeg',
    logoLight: '/logoo.jpeg',
    logoDark: '/logoo.jpeg',
    favicon: '/favicon.ico',
    ogImage: '/og-image.jpg',
    defaultAvatar: '/default-avatar.png',
    appIcon: '/app-icon.png',
  },
  
  // App Configuration
  app: {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || '1',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Analytics
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || '',
    googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID || '',
    facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || '',
  },
  
  // Features
  features: {
    enableReferrals: process.env.NEXT_PUBLIC_ENABLE_REFERRALS !== 'false',
    enablePoints: process.env.NEXT_PUBLIC_ENABLE_POINTS !== 'false',
    enableAds: process.env.NEXT_PUBLIC_ENABLE_ADS !== 'false',
    enableKYC: process.env.NEXT_PUBLIC_ENABLE_KYC !== 'false',
    enableWallet: process.env.NEXT_PUBLIC_ENABLE_WALLET !== 'false',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
  },
  
  // Locale and Language
  locale: {
    default: 'hi_IN',
    supported: ['hi_IN', 'en_IN'],
    language: 'hi',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  
  // Cache and Performance
  cache: {
    revalidate: {
      homepage: 3600, // 1 hour
      post: 3600, // 1 hour
      profile: 7200, // 2 hours
      explore: 1800, // 30 minutes
      sitemap: 3600, // 1 hour
      newsSitemap: 1800, // 30 minutes
    },
  },

  // Google News Configuration
  news: {
    publicationName: process.env.NEXT_PUBLIC_SITE_NAME || 'Bansgaon Sandesh',
    daysLimit: 2, // Google News accepts articles from last 2 days
    postsLimit: 1000,
  },

  // Language
  language: 'hi',
  
  // Limits and Constraints
  limits: {
    maxPostLength: 5000,
    maxCommentLength: 500,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    maxImagesPerPost: 10,
    postsPerPage: 20,
    commentsPerPage: 50,
  },
  
  // Points System
  points: {
    postCreation: parseInt(process.env.NEXT_PUBLIC_POINTS_POST || '10'),
    postLike: parseInt(process.env.NEXT_PUBLIC_POINTS_LIKE || '1'),
    postComment: parseInt(process.env.NEXT_PUBLIC_POINTS_COMMENT || '2'),
    postShare: parseInt(process.env.NEXT_PUBLIC_POINTS_SHARE || '5'),
    referralBonus: parseInt(process.env.NEXT_PUBLIC_POINTS_REFERRAL || '100'),
    dailyLogin: parseInt(process.env.NEXT_PUBLIC_POINTS_DAILY || '5'),
  },
  
  // Verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '',
  },
  
  // Theme
  theme: {
    primaryColor: '#007AFF',
    secondaryColor: '#0F172A',
    accentColor: '#10B981',
    errorColor: '#EF4444',
    warningColor: '#F59E0B',
    successColor: '#10B981',
  },
  
  // Legal
  legal: {
    companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Bansgaon Sandesh',
    registrationNumber: process.env.NEXT_PUBLIC_REGISTRATION_NUMBER || '',
    gstNumber: process.env.NEXT_PUBLIC_GST_NUMBER || '',
  },
} as const

// Helper function to get absolute URL
export function getAbsoluteUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteConfig.url}${cleanPath}`
}

// Helper function to get image URL
export function getImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) return imagePath
  return getAbsoluteUrl(imagePath)
}

// Helper function to check if feature is enabled
export function isFeatureEnabled(feature: keyof typeof siteConfig.features): boolean {
  return siteConfig.features[feature]
}

// Helper function to get social media URL
export function getSocialUrl(platform: keyof typeof siteConfig.social): string {
  return siteConfig.social[platform]
}

// Helper function to get admin emails (fallback list)
// NOTE: Admin status is now database-driven via profiles.role
// This is a fallback list for Bansgaon Sandesh project admins
export function getAdminEmails(): string[] {
  return [
    'admin@bansgaonsandesh.com',
    'support@bansgaonsandesh.com',
    'admin@nextupdate.in' // Shared admin
  ]
}

// Helper function to check if email is admin
export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase())
}

// Export types
export type SiteConfig = typeof siteConfig
export type SocialPlatform = keyof typeof siteConfig.social
export type Feature = keyof typeof siteConfig.features
