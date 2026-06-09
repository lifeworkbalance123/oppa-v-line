import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

function validateConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: new Error(
        'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      ),
    }
  }
  return { error: null }
}

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error
  }
  return new Error(error?.message || fallbackMessage)
}

export async function signInWithGoogle() {
  const { error: configError } = validateConfig()
  if (configError) {
    return { data: null, error: configError }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      return { data: null, error: normalizeError(error, 'Google sign-in failed') }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, 'An unexpected error occurred during Google sign-in'),
    }
  }
}

export async function getCurrentUser() {
  const { error: configError } = validateConfig()
  if (configError) {
    return { user: null, error: configError }
  }

  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return { user: null, error: normalizeError(error, 'Failed to get current user') }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return {
      user: null,
      error: normalizeError(error, 'An unexpected error occurred while fetching the user'),
    }
  }
}

export async function checkPremiumAccess(userId) {
  const { error: configError } = validateConfig()
  if (configError) {
    return { isPremium: false, error: configError }
  }

  if (!userId) {
    return {
      isPremium: false,
      error: new Error('User ID is required to check premium access'),
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        isPremium: false,
        error: normalizeError(error, 'Failed to check premium access'),
      }
    }

    return { isPremium: Boolean(data?.is_premium), error: null }
  } catch (error) {
    return {
      isPremium: false,
      error: normalizeError(error, 'An unexpected error occurred while checking premium access'),
    }
  }
}
