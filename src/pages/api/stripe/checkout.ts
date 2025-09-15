// src/pages/api/stripe/checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan } = (req.body || {}) as { plan?: 'monthly' | 'annual' };

    const priceId =
      plan === 'annual'
        ? process.env.STRIPE_PRICE_ANNUAL
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan or price not configured.' });
    }

    const trialDays = Number.isFinite(Number(process.env.STRIPE_TRIAL_DAYS))
      ? Number(process.env.STRIPE_TRIAL_DAYS)
      : 14;

    const originHeader = (req.headers.origin as string) || '';
    const hostHeader =
      (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const proto =
      ((req.headers['x-forwarded-proto'] as string) ||
        (originHeader?.startsWith('https') ? 'https' : 'http')) || 'https';

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      originHeader ||
      `${proto}://${hostHeader}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: { enabled: true },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      subscription_data: {
        trial_period_days: trialDays,
      },
      metadata: { plan: plan || 'monthly', app: 'mydurhamlaw' },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
