// src/pages/api/stripe/portal.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getServerUser } from '@/lib/api/serverAuth';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

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
    const { user } = await getServerUser(req, res); // cookie or Bearer
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // 1) Try to read stripe_customer_id from profiles
    let stripeCustomerId: string | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();
      stripeCustomerId = (data as any)?.stripe_customer_id ?? null;
    } catch {
      /* ignore */
    }

    // 2) Fallback: try to find by email (if portal is pressed right after checkout)
    if (!stripeCustomerId && user.email) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        stripeCustomerId = customers.data[0]?.id || null;
      } catch {
        /* ignore */
      }
    }

    if (!stripeCustomerId) {
      return res.status(400).json({
        error:
          'No Stripe customer found yet. Complete checkout first, then try again.',
      });
    }

    const origin = getOrigin(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/billing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({ error: error?.message || 'Stripe error' });
  }
}
