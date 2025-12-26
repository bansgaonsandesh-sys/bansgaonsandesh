/**
 * Google Analytics and Tracking Configuration
 * Add your actual tracking IDs
 */

// Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

// Google Tag Manager
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX'

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

interface EventParams {
  action: string
  category: string
  label?: string
  value?: number
}

// Track custom events
export const event = ({ action, category, label, value }: EventParams) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track social interactions
export const trackSocialInteraction = (
  network: string,
  action: string,
  target: string
) => {
  event({
    action: 'social_interaction',
    category: network,
    label: `${action}_${target}`,
  })
}

// Track post views
export const trackPostView = (postId: string, postTitle: string) => {
  event({
    action: 'view_post',
    category: 'Post',
    label: postTitle,
    value: 1,
  })
}

// Track post engagement
export const trackPostEngagement = (
  postId: string,
  engagementType: 'like' | 'comment' | 'share'
) => {
  event({
    action: engagementType,
    category: 'Post Engagement',
    label: postId,
  })
}

// Track user registration
export const trackRegistration = (method: string) => {
  event({
    action: 'sign_up',
    category: 'User',
    label: method,
  })
}

// Track referral conversions
export const trackReferral = (referralCode: string) => {
  event({
    action: 'referral_conversion',
    category: 'Referral',
    label: referralCode,
  })
}
