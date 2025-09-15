// src/pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'node:stream';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

async function getRawBody(readable: Readable) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message || 'Invalid signature'}`);
  }

  try {
    // Optional Supabase mirroring
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let supabase: any = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = (session.customer as string) || null;
        const subscriptionId = (session.subscription as string) || null;
        const plan = session.metadata?.plan || null;

        if (supabase && session.customer_details?.email) {
          const email = session.customer_details.email;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', email)
            .maybeSingle();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_price_id: null,
                stripe_subscription_status: 'active',
              })
              .eq('id', profile.id);
          }
        }

        console.log('checkout.session.completed', { customerId, subscriptionId, plan });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items?.data?.[0]?.price?.id || null;
        const status = sub.status;
        // In newest typings this may be optional, so cast to any safely:
        const currentPeriodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000).toISOString()
          : null;

        if (supabase) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId);

          if (profiles?.length) {
            await supabase
              .from('profiles')
              .update({
                stripe_subscription_id: sub.id,
                stripe_price_id: priceId,
                stripe_subscription_status: status,
                stripe_current_period_end: currentPeriodEnd,
              })
              .in(
                'id',
                profiles.map((p: any) => p.id)
              );
          }
        }

        console.log('subscription event', { type: event.type, id: sub.id, status });
        break;
      }

      default:
        // ignore others we don't use yet
        break;
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler failed:', err?.message || err);
    return res.status(500).json({ error: 'Webhook handler error' });
  }
}
