/**
 * Dynamic Configuration Service
 * Fetches configuration from database instead of hardcoded values
 */

import { supabaseClient } from './supabase-client'
import { PROJECT_ID } from '@/config/site'

// Cache configuration to avoid repeated database calls
let configCache: {
  pointsConfig?: Record<string, number>
  featuresConfig?: Record<string, number>
  appConfig?: Record<string, any>
  lastFetch?: number
} = {}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch points configuration from database
 */
export async function getPointsConfig(): Promise<Record<string, number>> {
  const now = Date.now()
  
  // Return cached config if still valid
  if (configCache.pointsConfig && configCache.lastFetch && (now - configCache.lastFetch) < CACHE_TTL) {
    return configCache.pointsConfig
  }

  try {
    const { data, error } = await supabaseClient
      .from('points_config')
      .select('activity_name, points_amount')
      .eq('project_id', PROJECT_ID)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching points config:', error)
      return getFallbackPointsConfig()
    }

    // Convert array to object for easy lookup
    const config: Record<string, number> = {}
    data?.forEach(item => {
      config[item.activity_name] = item.points_amount
    })

    // Update cache
    configCache.pointsConfig = config
    configCache.lastFetch = now

    return config
  } catch (error) {
    console.error('Exception fetching points config:', error)
    return getFallbackPointsConfig()
  }
}

/**
 * Fetch feature pricing from database
 */
export async function getFeaturesPricing(): Promise<Record<string, number>> {
  const now = Date.now()
  
  // Return cached config if still valid
  if (configCache.featuresConfig && configCache.lastFetch && (now - configCache.lastFetch) < CACHE_TTL) {
    return configCache.featuresConfig
  }

  try {
    const { data, error } = await supabaseClient
      .from('features_pricing')
      .select('feature_name, cost_amount')
      .eq('project_id', PROJECT_ID)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching features pricing:', error)
      return getFallbackFeaturesPricing()
    }

    // Convert array to object for easy lookup
    const config: Record<string, number> = {}
    data?.forEach(item => {
      config[item.feature_name] = item.cost_amount
    })

    // Update cache
    configCache.featuresConfig = config
    configCache.lastFetch = now

    return config
  } catch (error) {
    console.error('Exception fetching features pricing:', error)
    return getFallbackFeaturesPricing()
  }
}

/**
 * Fetch app configuration from database
 */
export async function getAppConfig(configKey: string): Promise<any> {
  try {
    const { data, error } = await supabaseClient
      .from('app_config')
      .select('config_value')
      .eq('project_id', PROJECT_ID)
      .eq('config_key', configKey)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Error fetching app config:', error)
      return null
    }

    return data.config_value
  } catch (error) {
    console.error('Exception fetching app config:', error)
    return null
  }
}

/**
 * Get specific points value
 */
export async function getPointsForActivity(activityName: string): Promise<number> {
  const config = await getPointsConfig()
  return config[activityName] ?? 0
}

/**
 * Get specific feature cost
 */
export async function getFeatureCost(featureName: string): Promise<number> {
  const config = await getFeaturesPricing()
  return config[featureName] ?? 0
}

/**
 * Fallback configuration if database is unavailable
 */
function getFallbackPointsConfig(): Record<string, number> {
  return {
    signup_bonus: 100,
    referral_bonus: 100,
    post_create: 10,
    post_like: 0.5,
    post_comment: 3,
    post_share: 1,
    app_share: 10,
    profile_follow: 5,
    daily_checkin: 10,
    post_delete: -10,
    post_like_reversal: -0.5,
    post_comment_reversal: -3,
    post_share_reversal: -1,
  }
}

function getFallbackFeaturesPricing(): Record<string, number> {
  return {
    blue_tick: 2000,
    ad_daily_rate: 2000,
    min_withdrawal: 100,
  }
}

/**
 * Clear cache (useful for admin panel after updating config)
 */
export function clearConfigCache() {
  configCache = {}
}

/**
 * Preload all configs (useful on app initialization)
 */
export async function preloadConfigs() {
  await Promise.all([
    getPointsConfig(),
    getFeaturesPricing(),
  ])
}
