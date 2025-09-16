// src/pages/api/stripe/checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

/**
 * Environment (set in Netlify):
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRICE_MONTHLY
 * - STRIPE_PRICE_ANNUAL
 * - STRIPE_TRIAL_DAYS (optional, default 14)
 * - NEXT_PUBLIC_APP_URL (fallback uses request origin/host)
 */

// DO NOT pass apiVersion to avoid TS mismatch errors.
// Rely on your Stripe account’s default API version.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

function getOrigin(req: NextApiRequest) {
  const headerOrigin = (req.headers.origin as string) || '';
  if (headerOrigin) return headerOrigin;

  const xfHost = (req.headers['x-forwarded-host'] as string) || '';
  if (xfHost) return `https://${xfHost}`;

  const host = (req.headers.host as string) || '';
  if (host) return `https://${host}`;

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan } = (req.body || {}) as { plan?: 'monthly' | 'annual' };
    if (plan !== 'monthly' && plan !== 'annual') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const priceId =
      plan === 'monthly'
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_ANNUAL;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe Price ID not configured' });
    }

    const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);
    const origin = getOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        trial_period_days: Number.isFinite(trialDays) ? trialDays : 14,
        metadata: { plan },
      },
      // If you want to pre-fill with an email (optional),
      // set customer_email here after you add server auth.
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error?.message || 'Stripe error' });
  }
}
