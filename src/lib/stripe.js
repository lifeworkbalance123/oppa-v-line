import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

function validateStripeConfig() {
  if (!stripePublishableKey) {
    return {
      error: new Error(
        'Missing Stripe environment variable. Set VITE_STRIPE_PUBLISHABLE_KEY.',
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

export async function createCheckoutSession(payload = {}) {
  const { error: configError } = validateStripeConfig()
  if (configError) {
    return { sessionId: null, error: configError }
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      const message =
        data?.error ||
        data?.message ||
        `Failed to create checkout session (${response.status})`
      return { sessionId: null, error: new Error(message) }
    }

    const sessionId = data?.sessionId || data?.id
    if (!sessionId) {
      return {
        sessionId: null,
        error: new Error('Checkout session ID was not returned by the server'),
      }
    }

    return { sessionId, error: null }
  } catch (error) {
    return {
      sessionId: null,
      error: normalizeError(
        error,
        'An unexpected error occurred while creating the checkout session',
      ),
    }
  }
}

export async function redirectToCheckout(sessionId) {
  const { error: configError } = validateStripeConfig()
  if (configError) {
    return { error: configError }
  }

  if (!sessionId) {
    return { error: new Error('Session ID is required to redirect to checkout') }
  }

  try {
    const stripe = await stripePromise

    if (!stripe) {
      return {
        error: new Error('Stripe failed to initialize. Check your publishable key.'),
      }
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      return { error: normalizeError(error, 'Failed to redirect to Stripe checkout') }
    }

    return { error: null }
  } catch (error) {
    return {
      error: normalizeError(
        error,
        'An unexpected error occurred while redirecting to checkout',
      ),
    }
  }
}
