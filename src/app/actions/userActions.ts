'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/config/site'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
    return { success: true, data: newUser.user }
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
