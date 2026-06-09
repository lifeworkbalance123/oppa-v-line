import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../App'
import {
  createCheckoutSession,
  redirectToCheckout,
} from '../lib/stripe'
import './Checkout.css'

function CheckoutLoading({ message }) {
  return (
    <div className="checkout-status" role="status" aria-live="polite">
      <div className="checkout-status__spinner" aria-hidden="true" />
      <h1 className="checkout-status__title">Checkout</h1>
      <p className="checkout-status__message">{message}</p>
    </div>
  )
}

function Checkout() {
  const { user, loading: authLoading } = useAuth()
  const [errorMessage, setErrorMessage] = useState(null)
  const checkoutStarted = useRef(false)

  useEffect(() => {
    if (authLoading || !user || checkoutStarted.current) {
      return
    }

    checkoutStarted.current = true

    async function startCheckout() {
      const { sessionId, error } = await createCheckoutSession({
        userId: user.id,
        email: user.email,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      const { error: redirectError } = await redirectToCheckout(sessionId)
      if (redirectError) {
        setErrorMessage(redirectError.message)
      }
    }

    startCheckout()
  }, [authLoading, user])

  if (authLoading) {
    return <CheckoutLoading message="Checking your account..." />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (errorMessage) {
    return (
      <div className="checkout-status checkout-status--error" role="alert">
        <h1 className="checkout-status__title">Checkout unavailable</h1>
        <p className="checkout-status__message">{errorMessage}</p>
        <Link to="/dashboard" className="checkout-status__link">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <CheckoutLoading message="Preparing secure checkout. You will be redirected shortly..." />
  )
}

export default Checkout
