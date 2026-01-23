// src/pages/api/stripe/parent-checkout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentToken, plan } = req.body;

    if (!paymentToken || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = createPagesServerClient({ req, res });

    // Validate payment link
    const { data: linkData, error: linkError } = await supabase
      .from('parent_payment_links')
      .select('*')
      .eq('payment_token', paymentToken)
      .single();

    if (linkError || !linkData) {
      return res.status(404).json({ error: 'Invalid payment link' });
    }

    // Check if expired
    if (new Date(linkData.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Payment link expired' });
    }

    // Check if already used
    if (linkData.status === 'completed') {
      return res.status(410).json({ error: 'Payment link already used' });
    }

    // Map plan to Stripe price
    const priceMap: Record<string, string | undefined> = {
      'core_monthly': process.env.STRIPE_PRICE_CORE_MONTHLY,
      'core_annual': process.env.STRIPE_PRICE_CORE_ANNUAL,
      'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
      'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const origin = getOrigin(req);
    const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&parent=true`,
      cancel_url: `${origin}/parent-payment?token=${paymentToken}`,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          plan,
          student_user_id: linkData.user_id,
          student_email: linkData.student_email,
          parent_payment: 'true',
          payment_token: paymentToken
        }
      },
      metadata: {
        student_user_id: linkData.user_id,
        payment_token: paymentToken
      }
    });

    console.log('[Parent Checkout] Session created:', {
      sessionId: session.id,
      studentEmail: linkData.student_email,
      plan
    });

    return res.status(200).json({ url: session.url });

  } catch (error: any) {
    console.error('[Parent Checkout] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}
