'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/config/site'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// R2 configuration for file deletion
const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim()
const ENDPOINT = (process.env.R2_ENDPOINT || '').trim()
const ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim()
const SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim()
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim()

const r2Client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

/**
 * Extract R2 key from a public URL
 */
function extractR2KeyFromUrl(url: string): string | null {
  try {
    if (!url) return null
    
    // Handle R2 public URLs
    if (url.includes('.r2.dev/') || url.includes(PUBLIC_URL)) {
      const urlObj = new URL(url)
      return urlObj.pathname.replace(/^\//, '')
    }
    // Handle relative paths (already a key)
    if (url.startsWith('posts/') || url.startsWith('avatars/') || url.startsWith('uploads/')) {
      return url
    }
    return null
  } catch (e) {
    return null
  }
}

/**
 * Delete files from R2 storage
 */
async function deleteFilesFromR2(keys: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    if (!keys || keys.length === 0) return { success: true }
    if (!BUCKET_NAME || !ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      console.warn('⚠️ R2 not configured, skipping file deletion')
      return { success: true }
    }

    console.log(`🗑️ Deleting ${keys.length} files from R2`)

    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map((k) => ({ Key: k })),
        Quiet: true,
      },
    })

    await r2Client.send(command)
    console.log('✅ R2 files deleted successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ R2 delete error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Admin action to completely delete a user and all their data
 * This includes: posts, comments, likes, follows, saved posts, reports, notifications, etc.
 * Also deletes all media files from R2 storage
 */
export async function adminDeleteUser(userId: string, accessToken: string): Promise<{
  success: boolean
  error?: string
  deletedCounts?: {
    posts: number
    comments: number
    likes: number
    follows: number
    savedPosts: number
    reports: number
    notifications: number
    r2Files: number
  }
}> {
  try {
    console.log('🔴 Starting complete user deletion for:', userId)
    
    const adminClient = createAdminSupabaseClient()
    
    // Verify the access token and get user info
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken)
    
    if (userError || !user || !user.email) {
      return { success: false, error: 'Unauthorized - Please login again' }
    }

    // Check if current user is admin
    const isAdminByEmail = isAdminEmail(user.email)
    if (!isAdminByEmail) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized - Admin access required' }
      }
    }

    // Prevent deleting self
    if (userId === user.id) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    const deletedCounts = {
      posts: 0,
      comments: 0,
      likes: 0,
      follows: 0,
      savedPosts: 0,
      reports: 0,
      notifications: 0,
      r2Files: 0,
    }

    // Step 1: Get all user's posts and their media URLs
    console.log('📋 Fetching user posts and media...')
    const { data: userPosts } = await adminClient
      .from('posts')
      .select('id, media_urls')
      .eq('user_id', userId)

    // Collect all R2 file keys to delete
    const r2KeysToDelete: string[] = []
    
    if (userPosts && userPosts.length > 0) {
      deletedCounts.posts = userPosts.length
      
      for (const post of userPosts) {
        if (post.media_urls && Array.isArray(post.media_urls)) {
          for (const url of post.media_urls) {
            const key = extractR2KeyFromUrl(url)
            if (key) r2KeysToDelete.push(key)
          }
        }
      }
    }

    // Get user's avatar URL
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (userProfile?.avatar_url) {
      const avatarKey = extractR2KeyFromUrl(userProfile.avatar_url)
      if (avatarKey) r2KeysToDelete.push(avatarKey)
    }

    console.log(`📁 Found ${r2KeysToDelete.length} R2 files to delete`)
    deletedCounts.r2Files = r2KeysToDelete.length

    // Step 2: Delete all related records in correct order (respecting FK constraints)
    console.log('🧹 Deleting related records...')

    // Delete comments on user's posts first
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id)
      await adminClient.from('comments').delete().in('post_id', postIds)
    }

    // Delete user's own comments
    const { count: commentsCount } = await adminClient
      .from('comments')
      .delete()
      .eq('user_id', userId)
      
    deletedCounts.comments = commentsCount || 0

    // Delete likes on user's posts
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id)
      await adminClient.from('post_likes').delete().in('post_id', postIds)
    }

    // Delete user's own likes
    const { count: likesCount } = await adminClient
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      
    deletedCounts.likes = likesCount || 0

    // Delete saved posts by user and saves of user's posts
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id)
      await adminClient.from('saved_posts').delete().in('post_id', postIds)
    }
    const { count: savedCount } = await adminClient
      .from('saved_posts')
      .delete()
      .eq('user_id', userId)
      
    deletedCounts.savedPosts = savedCount || 0

    // Delete post reports on user's posts and by user
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id)
      await adminClient.from('post_reports').delete().in('post_id', postIds)
    }
    const { count: reportsCount } = await adminClient
      .from('post_reports')
      .delete()
      .eq('reporter_id', userId)
      
    deletedCounts.reports = reportsCount || 0

    // Delete follows (both directions)
    const { count: followsCount1 } = await adminClient
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      
    const { count: followsCount2 } = await adminClient
      .from('follows')
      .delete()
      .eq('following_id', userId)
      
    deletedCounts.follows = (followsCount1 || 0) + (followsCount2 || 0)

    // Delete notifications for user
    const { count: notifCount } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      
    deletedCounts.notifications = notifCount || 0

    // Delete FCM tokens
    await adminClient.from('fcm_tokens').delete().eq('user_id', userId)

    // Delete points activity
    await adminClient.from('points_activity').delete().eq('user_id', userId)

    // Delete user_projects
    await adminClient.from('user_projects').delete().eq('user_id', userId)

    // Delete referral records
    await adminClient.from('referrals').delete().eq('referrer_id', userId)
    await adminClient.from('referrals').delete().eq('referred_id', userId)

    // Step 3: Delete all user's posts
    console.log('🗑️ Deleting user posts...')
    await adminClient.from('posts').delete().eq('user_id', userId)

    // Step 4: Delete profile
    console.log('👤 Deleting user profile...')
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error deleting profile:', profileError)
      return { success: false, error: `Failed to delete profile: ${profileError.message}` }
    }

    // Step 5: Delete auth user
    console.log('🔐 Deleting auth user...')
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('❌ Error deleting auth user:', authError)
      // Profile is already deleted, but auth deletion failed
      return { success: false, error: `Profile deleted but auth deletion failed: ${authError.message}` }
    }

    // Step 6: Delete files from R2
    if (r2KeysToDelete.length > 0) {
      console.log('📁 Deleting files from R2...')
      const r2Result = await deleteFilesFromR2(r2KeysToDelete)
      if (!r2Result.success) {
        console.warn('⚠️ Some R2 files may not have been deleted:', r2Result.error)
      }
    }

    console.log('✅ User completely deleted:', {
      userId,
      deletedCounts
    })

    return { success: true, deletedCounts }

  } catch (error: any) {
    console.error('❌ Admin delete user error:', error)
    return { success: false, error: error.message || 'Failed to delete user' }
  }
}

/**
 * Admin action to create a new user
 * Only admins can call this function
 */
export async function adminCreateUser(data: {
  email: string
  name: string
  phone: string
  password: string
  city_id?: string
  project_id: string
  accessToken: string
}) {
  try {
    // Create admin client to verify the access token
    const adminClient = createAdminSupabaseClient()
    
    // Verify the access token and get user info
    const { data: { user }, error: userError } = await adminClient.auth.getUser(data.accessToken)
    
    console.log('👤 Current user:', user?.email)
    
    if (userError || !user || !user.email) {
      console.error('❌ Auth error:', userError)
      return { success: false, error: 'Unauthorized - Please login again' }
    }

    // Check if current user is admin by email OR database role
    const isAdminByEmail = isAdminEmail(user.email)
    console.log('🔒 Admin check - by email:', isAdminByEmail)
    
    if (!isAdminByEmail) {
      // Check database role
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      console.log('🔒 Admin check - by role:', profile?.role)
      
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized - Admin access required' }
      }
    }

    // Create user with password using admin API
    console.log('🔨 Creating user:', data.email)
    const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        project_id: data.project_id
      }
    })

    if (signUpError || !newUser.user) {
      console.error('❌ Error creating user:', signUpError)
      return { success: false, error: signUpError?.message || 'Failed to create user' }
    }

    console.log('✅ User created, creating profile...')

    // Create profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUser.user.id,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      city_id: data.city_id || null,
      project_id: data.project_id,
      is_verified: false,
      has_blue_tick: false,
      referral_code: `R${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
    })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      return { success: false, error: 'User created but profile creation failed' }
    }

    console.log('✅ User and profile created successfully!')
    return { success: true, userId: newUser.user.id, data: newUser.user }
  } catch (error: any) {
    console.error('Admin create user error:', error)
    return { success: false, error: error.message || 'Failed to create user' }
  }
}

/**
 * Get list of admin-created users
 */
export async function getAdminCreatedUsers() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return { success: false, error: 'Unauthorized' }
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Verify admin
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdminEmail(user.email)) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await authClient
      .from('admin_created_users')
      .select('*')
      .eq('project_id', 'bansgaonsandesh')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Admin action to update an existing user
 * Updates both auth email and profile data
 */
export async function adminUpdateUser(userId: string, data: {
  email: string
  name: string
  phone?: string | null
  city_id?: string | null
  points_balance?: number
  is_verified?: boolean
  has_blue_tick?: boolean
  age?: number | null
  gender?: string | null
}, accessToken: string) {
  try {
    // Create admin client to verify the access token
    const adminClient = createAdminSupabaseClient()
    
    // Verify the access token and get user info
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken)
    
    if (userError || !user || !user.email) {
      return { success: false, error: 'Unauthorized - Please login again' }
    }

    // Check if current user is admin
    const isAdminByEmail = isAdminEmail(user.email)
    if (!isAdminByEmail) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized - Admin access required' }
      }
    }

    // Get current user's email to check if it's changing
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!currentProfile) {
      return { success: false, error: 'User not found' }
    }

    // If email is changing, update auth email with email_confirm: true to skip verification
    if (currentProfile.email !== data.email.toLowerCase().trim()) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        userId,
        { 
          email: data.email.toLowerCase().trim(),
          email_confirm: true // This skips email verification
        }
      )

      if (authError) {
        console.error('❌ Error updating auth email:', authError)
        return { success: false, error: `Failed to update auth email: ${authError.message}` }
      }
    }

    // Update profile in database
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        city_id: data.city_id,
        points_balance: data.points_balance,
        is_verified: data.is_verified,
        has_blue_tick: data.has_blue_tick,
        age: data.age,
        gender: data.gender,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return { success: false, error: `Failed to update profile: ${profileError.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Admin update user error:', error)
    return { success: false, error: error.message || 'Failed to update user' }
  }
}

/**
 * Admin action to manage user project assignments
 */
export async function manageUserProjects(userId: string, projectIds: string[], accessToken: string) {
  try {
    const adminClient = createAdminSupabaseClient()
    
    // Verify the access token and get user info
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken)
    
    if (userError || !user || !user.email) {
      return { success: false, error: 'Unauthorized - Please login again' }
    }

    // Check if current user is admin
    const isAdminByEmail = isAdminEmail(user.email)
    if (!isAdminByEmail) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized - Admin access required' }
      }
    }

    // Delete all existing user_projects for this user
    const { error: deleteError } = await adminClient
      .from('user_projects')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Error deleting user projects:', deleteError)
      return { success: false, error: `Failed to delete old projects: ${deleteError.message}` }
    }

    // Insert new project assignments
    if (projectIds && projectIds.length > 0) {
      const newUserProjects = projectIds.map(projectId => ({
        user_id: userId,
        project_id: projectId,
        is_active: true
      }))

      const { error: insertError } = await adminClient
        .from('user_projects')
        .insert(newUserProjects)

      if (insertError) {
        console.error('❌ Error inserting user projects:', insertError)
        return { success: false, error: `Failed to assign projects: ${insertError.message}` }
      }
    }

    return { success: true }

  } catch (error: any) {
    console.error('❌ Error in manageUserProjects:', error)
    return { success: false, error: error.message || 'An error occurred while managing user projects' }
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return { success: false, error: 'Unauthorized' }
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Verify admin
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdminEmail(user.email)) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await authClient
      .from('admin_created_users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .eq('project_id', 'bansgaonsandesh')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
