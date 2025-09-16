// src/pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'node:stream';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

/**
 * Minimal Stripe webhook: verifies events and stores a few fields.
 *
 * Env required:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 *
 * Optional tables:
 * - public.billing_events (json logging)
 * - public.profiles (column stripe_customer_id text)
 */

export const config = { api: { bodyParser: false } };

// Do NOT pin apiVersion; let the SDK use your account default to avoid TS drift.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

async function rawBody(readable: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function unixToIsoMaybe(v: unknown): string | null {
  // Support either number or stringified number; tolerate missing/renamed keys.
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).send('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!webhookSecret) {
    console.error('[stripe/webhook] Missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).send('Server misconfigured');
  }

  let event: Stripe.Event;

  try {
    const buf = await rawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('[stripe/webhook] Signature verification failed:', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || 'invalid signature'}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;

        const customerId = (s.customer as string) || null;
        const subscriptionId = (s.subscription as string) || null;
        const email = s.customer_details?.email || null;

        // Try to store customer id on profile by email (ignore failure)
        if (email && customerId) {
          try {
            await supabaseAdmin
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('email', email);
          } catch (e) {
            console.warn('[stripe/webhook] Could not store stripe_customer_id:', e);
          }
        }

        // Optional event log
        try {
          await supabaseAdmin.from('billing_events').insert([
            {
              type: event.type,
              subscription_id: subscriptionId,
              customer_id: customerId,
              email,
              payload: s,
            },
          ]);
        } catch {
          /* table might not exist; ignore */
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) || null;
        const status = sub.status;

        // NOTE: do NOT trust Stripe types to always include this field.
        // Read defensively to fix TS error across versions.
        const rawCpe =
          (sub as any)?.current_period_end ??
          (sub as any)?.current_period_end_at ??
          null;
        const currentPeriodEndIso = unixToIsoMaybe(rawCpe);

        try {
          await supabaseAdmin.from('billing_events').insert([
            {
              type: event.type,
              customer_id: customerId,
              subscription_id: sub.id,
              status,
              current_period_end: currentPeriodEndIso, // store as ISO string or null
              payload: sub,
            },
          ]);
        } catch {
          /* table might not exist; ignore */
        }
        break;
      }

      default: {
        // Firehose (optional)
        try {
          await supabaseAdmin
            .from('billing_events')
            .insert([{ type: event.type, payload: event.data.object as any }]);
        } catch {
          /* ignore */
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[stripe/webhook] Handler error:', err?.message || err);
    return res.status(500).send('Webhook handler error');
  }
}
