import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { userId, email } = JSON.parse(event.body || '{}')
    if (!userId || !email) {
      return { statusCode: 400, body: 'Missing userId or email' }
    }

    // Idempotent: reuse existing customer if same email
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        email,
        metadata: { supabase_uid: userId },
      }))

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID as string
    if (!priceId) {
      return { statusCode: 500, body: 'Missing NEXT_PUBLIC_STRIPE_PRICE_ID' }
    }

    // Your deployed site URL (Netlify provides URL in prod)
    const siteURL =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.URL ||
      'http://localhost:8888'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_uid: userId },
      },
      metadata: { supabase_uid: userId },
      success_url: `${siteURL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteURL}/billing/cancelled`,
    })

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err: any) {
    console.error('create-checkout-session error:', err)
    return { statusCode: 500, body: `Server error: ${err?.message || err}` }
  }
}
export default handler
