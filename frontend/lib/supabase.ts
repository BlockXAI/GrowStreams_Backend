import { createClient } from '@/utils/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from '@/utils/supabase/mock'

// Client-side Supabase client (for reading data)
export const supabase = createClient()

// Server-side Supabase admin client (for writing data)
// This will be used in API routes where we need admin privileges
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔍 Supabase Admin Client Config:', {
    hasUrl: !!supabaseUrl,
    urlSuffix: supabaseUrl?.slice(-10),
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPrefix: serviceRoleKey?.slice(0, 20) + '...',
    environment: process.env.NODE_ENV
  })
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('⚠️ Using mock Supabase admin client (no env vars)')
    return createMockSupabaseClient() as any
  }
  
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}

// Database types for profiles
export interface Profile {
  id: string
  wallet_address: string
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
}
