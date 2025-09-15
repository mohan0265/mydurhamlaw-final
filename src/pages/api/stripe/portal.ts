// src/pages/api/stripe/portal.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { customerId } = (req.body || {}) as { customerId?: string };
    if (!customerId) return res.status(400).json({ error: 'Missing customerId' });

    const originHeader = (req.headers.origin as string) || '';
    const hostHeader =
      (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const proto =
      ((req.headers['x-forwarded-proto'] as string) ||
        (originHeader?.startsWith('https') ? 'https' : 'http')) || 'https';

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      originHeader ||
      `${proto}://${hostHeader}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${returnUrl}/billing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('portal error:', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
