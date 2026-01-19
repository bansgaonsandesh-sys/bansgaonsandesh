'use server'

import { createClient } from '@supabase/supabase-js'
import { supabaseClient } from '../../lib/supabase-client'
import { revalidatePath } from 'next/cache'
import { siteConfig } from '@/config/site'
import { isAdmin } from '@/lib/utils'
import { getFeatureCost } from '@/lib/config-service'

// Initialize standard Supabase client only for creating other clients or non-auth data
// For auth operations, we MUST use a client initialized with the user's token
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type CreateAdResult =
    | { success: true; adId: string }
    | { success: false; error: string }

export async function createAd(
    accessToken: string,
    userId: string,
    content: string,
    mediaUrls: string[],
    mediaType: 'image' | 'video',
    targetLink: string | null,
    durationDays: number,
    contactMobile: string | null,
    contactWhatsapp: string | null
): Promise<CreateAdResult> {
    try {
        console.log('🔵 [createAd] Starting ad creation...')
        console.log('🔵 [createAd] User ID:', userId)
        console.log('🔵 [createAd] Content:', content)
        console.log('🔵 [createAd] Media URLs:', mediaUrls)
        console.log('🔵 [createAd] Duration:', durationDays)
        console.log('🔵 [createAd] Access Token present:', !!accessToken)

        // Strict Server-Side Validation using the passed access token
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

        console.log('🔵 [createAd] Auth check - User:', user?.id)
        console.log('🔵 [createAd] Auth check - Error:', authError)

        if (authError || !user) {
            console.error('❌ [createAd] Auth verification failed:', authError)
            return { success: false, error: 'Unauthorized: Invalid session' }
        }

        if (user.id !== userId) {
            console.error('❌ [createAd] User ID mismatch. Token user:', user.id, 'Provided user:', userId)
            return { success: false, error: 'Unauthorized: User mismatch' }
        }

        console.log('✅ [createAd] Auth validated successfully')

        // Get dynamic ad daily rate from config
        const adDailyRate = await getFeatureCost('ad_daily_rate')
        console.log('🔵 [createAd] Ad daily rate from config:', adDailyRate)

        // Create authenticated client
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } }
        })

        console.log('🔵 [createAd] Calling RPC create_user_ad...')
        const { data, error } = await authClient.rpc('create_user_ad', {
            p_user_id: userId,
            p_content: content,
            p_media_urls: mediaUrls,
            p_media_type: mediaType,
            p_target_link: targetLink,
            p_duration_days: durationDays,
            p_daily_rate: adDailyRate,
            p_contact_mobile: contactMobile,
            p_contact_whatsapp: contactWhatsapp
        })

        console.log('🔵 [createAd] RPC Response - Data:', data)
        console.log('🔵 [createAd] RPC Response - Error:', error)

        if (error) {
            console.error('❌ [createAd] RPC Error:', error)
            console.error('❌ [createAd] RPC Error Message:', error.message)
            console.error('❌ [createAd] RPC Error Code:', error.code)
            console.error('❌ [createAd] RPC Error Details:', error.details)
            if (error.message.includes('Insufficient points')) {
                return { success: false, error: 'Insufficient points balance' }
            }
            return { success: false, error: `Failed to create ad: ${error.message}` }
        }

        console.log('✅ [createAd] Ad created successfully with ID:', data)

        revalidatePath('/')
        revalidatePath('/wallet')

        return { success: true, adId: data }
    } catch (err) {
        console.error('❌ [createAd] Exception caught:', err)
        console.error('❌ [createAd] Exception details:', JSON.stringify(err, null, 2))
        return { success: false, error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` }
    }
}

export async function fetchActiveAds() {
    // Public data, use anon client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
        .from('ads')
        .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url,
        is_verified,
        has_blue_tick
      )
    `)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching ads:', error)
        return []
    }

    return data || []
}

export async function fetchUserAds(accessToken: string, userId: string) {
    console.log('🔵 [fetchUserAds] Called with userId:', userId)
    console.log('🔵 [fetchUserAds] Has accessToken:', !!accessToken)

    if (!accessToken) {
        console.log('❌ [fetchUserAds] No access token provided')
        return []
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Verify user
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    console.log('🔵 [fetchUserAds] Auth user:', user?.id)
    console.log('🔵 [fetchUserAds] Auth error:', authError)
    console.log('🔵 [fetchUserAds] User match:', user?.id === userId)

    if (!user || user.id !== userId) {
        console.log('❌ [fetchUserAds] User verification failed')
        return []
    }

    console.log('🔵 [fetchUserAds] Querying ads table for user:', userId)
    const { data, error } = await authClient
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    console.log('🔵 [fetchUserAds] Query result - data:', data)
    console.log('🔵 [fetchUserAds] Query result - error:', error)
    console.log('🔵 [fetchUserAds] Ads count:', data?.length || 0)

    if (error) {
        console.error('❌ [fetchUserAds] Error fetching user ads:', error)
        return []
    }

    return data || []
}


export async function fetchSystemAds() {
    // Public system ads (banners/popups)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
        .from('admin_ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching system ads:', error)
        return []
    }

    return data || []
}

export async function fetchPendingAds(accessToken: string) {
    console.log('🔵 [fetchPendingAds] Called')

    if (!accessToken) {
        console.log('❌ [fetchPendingAds] No access token')
        return []
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { data: { user } } = await authClient.auth.getUser()
    console.log('🔵 [fetchPendingAds] User email:', user?.email)

    if (!user || !user.email || !isAdmin(user.email)) {
        console.log('❌ [fetchPendingAds] Not an admin')
        return []
    }

    console.log('🔵 [fetchPendingAds] Fetching pending ads...')
    const { data, error } = await authClient
        .from('ads')
        .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url,
          is_verified,
          has_blue_tick
        )
      `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    console.log('🔵 [fetchPendingAds] Result:', { count: data?.length, error })

    if (error) {
        console.error('❌ [fetchPendingAds] Error fetching pending ads:', error)
        return []
    }

    return data || []
}

export async function fetchAllAds(accessToken: string) {
    console.log('🔵 [fetchAllAds] Called')

    if (!accessToken) return []

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdmin(user.email)) {
        return []
    }

    const { data, error } = await authClient
        .from('ads')
        .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url,
          is_verified,
          has_blue_tick
        )
      `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('❌ [fetchAllAds] Error:', error)
        return []
    }

    return data || []
}

export async function updateAdStatus(
    accessToken: string,
    adId: string,
    status: 'active' | 'rejected',
    reason?: string
) {
    console.log('🔵 [updateAdStatus] Called:', { adId, status, reason })

    if (!accessToken) return { success: false, error: 'No access token' }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Verify admin
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdmin(user.email)) {
        return { success: false, error: 'Unauthorized' }
    }

    // Get ad details first
    const { data: ad, error: adError } = await authClient
        .from('ads')
        .select('user_id, total_points, status')
        .eq('id', adId)
        .single()

    if (adError || !ad) {
        console.error('❌ [updateAdStatus] Error fetching ad:', adError)
        return { success: false, error: 'Ad not found' }
    }

    console.log('🔵 [updateAdStatus] Ad details:', ad)

    // If rejecting, refund the points to user's wallet
    if (status === 'rejected' && ad.total_points) {
        console.log('🔵 [updateAdStatus] Refunding points:', ad.total_points)

        const { error: refundError } = await authClient.rpc('increment_user_points', {
            p_user_id: ad.user_id,
            p_points: ad.total_points
        })

        if (refundError) {
            console.error('❌ [updateAdStatus] Refund error:', refundError)
            return { success: false, error: 'Failed to refund points' }
        }

        console.log('✅ [updateAdStatus] Points refunded successfully')
    }

    // Update ad status
    const updateData: any = { status }

    if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason
    }

    if (status === 'active') {
        updateData.rejection_reason = null
        updateData.start_date = new Date().toISOString()
        // Calculate end date based on duration (assuming duration_days exists)
        // For now, we'll set a default 7-day duration if not specified
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 7)
        updateData.end_date = endDate.toISOString()
    }

    console.log('🔵 [updateAdStatus] Updating ad with:', updateData)

    const { error } = await authClient
        .from('ads')
        .update(updateData)
        .eq('id', adId)

    if (error) {
        console.error('❌ [updateAdStatus] Update error:', error)
        return { success: false, error: error.message }
    }

    console.log('✅ [updateAdStatus] Ad status updated successfully')
    revalidatePath('/')
    return { success: true }
}

export async function fetchAllSystemAds(accessToken: string) {
    if (!accessToken) return []

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Admin Check
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdmin(user.email)) {
        return []
    }

    const { data, error } = await authClient
        .from('admin_ads')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all system ads:', error)
        return []
    }

    return data || []
}

export async function createSystemAd(accessToken: string, adData: any) {
    if (!accessToken) return { success: false, error: 'Unauthorized' }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdmin(user.email)) {
        return { success: false, error: 'Unauthorized: Admin only' }
    }

    const { data, error } = await authClient
        .from('admin_ads')
        .insert({
            title: adData.title,
            description: adData.description,
            image_url: adData.image_url,
            type: adData.type,
            redirect_url: adData.redirect_url,
            is_active: true // Default active
        })
        .select()

    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function toggleSystemAd(accessToken: string, adId: string, isActive: boolean) {
    if (!accessToken) return { success: false, error: 'Unauthorized' }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { error } = await authClient
        .from('admin_ads')
        .update({ is_active: isActive })
        .eq('id', adId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function deleteSystemAd(accessToken: string, adId: string) {
    if (!accessToken) return { success: false, error: 'Unauthorized' }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { error } = await authClient
        .from('admin_ads')
        .delete()
        .eq('id', adId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function updateSystemAd(accessToken: string, adId: string, updates: any) {
    if (!accessToken) return { success: false, error: 'Unauthorized' }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdmin(user.email)) {
        return { success: false, error: 'Unauthorized: Admin only' }
    }

    const { error } = await authClient
        .from('admin_ads')
        .update({
            title: updates.title,
            description: updates.description,
            image_url: updates.image_url,
            type: updates.type,
            redirect_url: updates.redirect_url,
            contact_phone: updates.contact_phone,
            contact_whatsapp: updates.contact_whatsapp,
            contact_website: updates.contact_website
        })
        .eq('id', adId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
}

// ===== USER-FACING AD FUNCTIONS =====

export async function fetchActiveUserAds() {
    const { data, error } = await supabaseClient
        .from('ads')
        .select(`
            *,
            profiles:user_id (
                name,
                avatar_url
            )
        `)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching active user ads:', error)
        return []
    }

    return data || []
}

export async function fetchActiveBanners() {
    const { data, error } = await supabaseClient
        .from('admin_ads')
        .select('*')
        .eq('type', 'banner')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3)

    if (error) {
        console.error('Error fetching active banners:', error)
        return []
    }

    return data || []
}

export async function fetchActivePopups() {
    const { data, error } = await supabaseClient
        .from('admin_ads')
        .select('*')
        .eq('type', 'popup')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching active popups:', error)
        return []
    }

    return data || []
}

export async function trackAdImpression(adId: string, type: 'post' | 'banner' | 'popup') {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
        const { error } = await supabase
            .from('ad_impressions')
            .insert({
                ad_id: adId,
                ad_type: type,
                action_type: 'impression',
            })

        if (error) {
            console.error('Error tracking impression:', error)
        }
    } catch (e) {
        console.error('Error tracking impression:', e)
    }
}

export async function trackAdClick(adId: string, type: 'post' | 'banner' | 'popup') {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
        const { error } = await supabase
            .from('ad_impressions')
            .insert({
                ad_id: adId,
                ad_type: type,
                action_type: 'click',
            })

        if (error) {
            console.error('Error tracking click:', error)
        }
    } catch (e) {
        console.error('Error tracking click:', e)
    }
}
