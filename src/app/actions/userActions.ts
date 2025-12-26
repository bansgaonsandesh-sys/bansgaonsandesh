'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/config/site'

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
}) {
  try {
    // Get current user session
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return { success: false, error: 'Unauthorized - No session found' }
    }

    // Create authenticated client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })

    // Verify admin
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !user.email || !isAdminEmail(user.email)) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Call the database function to create user
    const { data: result, error } = await authClient.rpc('admin_create_user', {
      p_email: data.email.toLowerCase().trim(),
      p_name: data.name.trim(),
      p_phone: data.phone.trim(),
      p_admin_id: user.id,
      p_project_id: 'bansgaonsandesh'
    })

    if (error) {
      console.error('Error creating user:', error)
      return { success: false, error: error.message }
    }

    // Send invitation email (via Supabase Auth)
    const { error: inviteError } = await authClient.auth.admin.inviteUserByEmail(data.email, {
      data: {
        name: data.name,
        phone: data.phone,
        project_id: 'bansgaonsandesh'
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    })

    if (inviteError) {
      console.error('Error sending invitation:', inviteError)
      // User created but email not sent - still success
      return {
        success: true,
        data: result,
        warning: 'User created but invitation email failed to send. User can still set password via forgot password.'
      }
    }

    return { success: true, data: result }
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
