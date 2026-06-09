import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_PRICE_ID

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.VITE_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean),
)

function setCorsHeaders(req, res) {
  const origin = req.headers.origin

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function getAppUrl() {
  if (process.env.VITE_APP_URL) {
    return process.env.VITE_APP_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:5173'
}

export default async function handler(req, res) {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripeSecretKey || !stripePriceId) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.',
    })
  }

  const { userId, email } = req.body ?? {}

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' })
  }

  if (typeof userId !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'userId and email must be strings' })
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }

  try {
    const stripe = new Stripe(stripeSecretKey)
    const appUrl = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
    })

    return res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Failed to create checkout session:', error)

    return res.status(500).json({
      error: error?.message || 'Failed to create checkout session',
    })
  }
}
