import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../App'
import { checkPremiumAccess, signInWithGoogle } from '../lib/supabase'
import {
  createCheckoutSession,
  redirectToCheckout,
} from '../lib/stripe'

const PENDING_UPGRADE_KEY = 'oppa-v-line-pending-upgrade'

export function usePremium() {
  const { user } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setIsPremium(false)
      return undefined
    }

    let cancelled = false

    checkPremiumAccess(user.id).then(({ isPremium: premium }) => {
      if (!cancelled) {
        setIsPremium(premium)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user])

  const startCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { sessionId, error: checkoutError } = await createCheckoutSession({
      userId: user?.id,
      email: user?.email,
    })

    if (checkoutError) {
      setError(checkoutError.message)
      setLoading(false)
      return
    }

    const { error: redirectError } = await redirectToCheckout(sessionId)
    if (redirectError) {
      setError(redirectError.message)
    }

    setLoading(false)
  }, [user])

  const handleUpgrade = useCallback(async () => {
    setError(null)

    if (!user) {
      setLoading(true)
      localStorage.setItem(PENDING_UPGRADE_KEY, 'true')
      const { error: signInError } = await signInWithGoogle()
      if (signInError) {
        localStorage.removeItem(PENDING_UPGRADE_KEY)
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    await startCheckout()
  }, [user, startCheckout])

  useEffect(() => {
    const pending = localStorage.getItem(PENDING_UPGRADE_KEY)
    if (!pending || !user) return
    localStorage.removeItem(PENDING_UPGRADE_KEY)
    startCheckout()
  }, [user, startCheckout])

  return {
    user,
    isPremium,
    loading,
    error,
    handleUpgrade,
    clearError: () => setError(null),
  }
}
