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
    // Body: { plan: 'core_monthly' | 'core_annual' | 'pro_monthly' | 'pro_annual' | 'free', parentAddOn?: boolean }
    const { plan, parentAddOn } = (req.body || {}) as { plan?: string; parentAddOn?: boolean };
    
    // Map plan keys to Environment Variables
    const priceMap: Record<string, string | undefined> = {
       'full_access_monthly': process.env.STRIPE_PRICE_FULL_ACCESS_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY,
       'full_access_annual': process.env.STRIPE_PRICE_FULL_ACCESS_ANNUAL || process.env.STRIPE_PRICE_PRO_ANNUAL,
       'core_monthly': process.env.STRIPE_PRICE_CORE_MONTHLY,
       'core_annual': process.env.STRIPE_PRICE_CORE_ANNUAL,
       'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
       'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
       // Legacy aliases for continuity
       'monthly': process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_MONTHLY, 
       'annual': process.env.STRIPE_PRICE_PRO_ANNUAL || process.env.STRIPE_PRICE_ANNUAL
    };

    const priceId = plan ? priceMap[plan] : undefined;

    if (!priceId) {
      console.error(`[Stripe] Invalid plan requested: ${plan}`);
      return res.status(400).json({ error: 'Invalid or missing plan configuration' });
    }

    const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);
    const origin = getOrigin(req);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 }
    ];

    // Add Parent Add-on if requested
    if (parentAddOn) {
      const isAnnual = plan?.includes('annual') || plan === 'annual';
      const parentPriceId = isAnnual 
        ? process.env.STRIPE_PRICE_PARENT_ADDON_ANNUAL 
        : process.env.STRIPE_PRICE_PARENT_ADDON_MONTHLY;
      
      if (parentPriceId) {
        lineItems.push({ price: parentPriceId, quantity: 1 });
      } else {
        console.warn(`[Stripe] Parent add-on requested but price ID missing for ${isAnnual ? 'annual' : 'monthly'}`);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        trial_period_days: Number.isFinite(trialDays) ? trialDays : 14,
        metadata: { 
          plan: plan || '',
          parentAddOn: parentAddOn ? 'true' : 'false'
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error?.message || 'Stripe error' });
  }
}
