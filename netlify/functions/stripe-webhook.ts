// netlify/functions/stripe-webhook.ts
import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Match the API version shown on your Stripe Webhooks page header.
  // (Cast to any to avoid TS narrowing issues if your local type package lags.)
  apiVersion: '2025-08-27.basil' as any,
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

/** Extend typings so TS allows reading these timestamp fields */
type SubscriptionExt = Stripe.Subscription & {
  current_period_end?: number | null;
  trial_end?: number | null;
};

// ------------ helpers ------------
async function updateProfile(userId: string, patch: Record<string, any>) {
  if (!userId) return;
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) console.error('[supabase] update error:', error);
}

function toIso(sec?: number | null) {
  return sec ? new Date(sec * 1000).toISOString() : null;
}

async function getUserIdFromCustomer(customerId?: string | null) {
  if (!customerId) return '';
  const cust = await stripe.customers.retrieve(customerId);
  if ('deleted' in cust) return '';
  return (cust.metadata?.supabase_user_id as string) || '';
}

async function getSubscriptionById(subId?: string | null) {
  if (!subId) return null;
  // Cast to our extended type to quiet TS while keeping fields we need
  const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as SubscriptionExt;
  return sub;
}

async function getLatestSubscriptionForCustomer(customerId?: string | null) {
  if (!customerId) return null;
  const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
  return ((list.data[0] ?? null) as unknown) as SubscriptionExt | null;
}

// ------------ handler ------------
export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    if (!sig) return { statusCode: 400, body: 'Missing signature' };

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body as string,
        sig as string,
        WH_SECRET
      );
    } catch (err: any) {
      console.error('[webhook] constructEvent failed:', err.message);
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const sess = stripeEvent.data.object as Stripe.Checkout.Session;

        // session.customer can be string or Customer
        const customerId =
          typeof sess.customer === 'string' ? sess.customer : sess.customer?.id ?? '';
        const userId = await getUserIdFromCustomer(customerId);

        // session.subscription can be string | Subscription | null
        let sub: SubscriptionExt | null = null;
        if (typeof sess.subscription === 'string') {
          sub = await getSubscriptionById(sess.subscription);
        } else if (sess.subscription && typeof sess.subscription === 'object') {
          sub = (sess.subscription as unknown) as SubscriptionExt;
        }

        if (userId && sub) {
          await updateProfile(userId, {
            stripe_customer_id: customerId,
            subscription_status: sub.status,
            trial_ends_at: toIso(sub.trial_end ?? null),
            current_period_end: toIso(sub.current_period_end ?? null),
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subObj = (stripeEvent.data.object as unknown) as SubscriptionExt;

        const customerId =
          typeof subObj.customer === 'string' ? subObj.customer : subObj.customer?.id ?? '';
        const userId = await getUserIdFromCustomer(customerId);

        if (userId) {
          await updateProfile(userId, {
            subscription_status: subObj.status,
            trial_ends_at: toIso(subObj.trial_end ?? null),
            current_period_end: toIso(subObj.current_period_end ?? null),
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Some type versions don't expose invoice.subscription; refresh latest sub by customer.
        const invoice = stripeEvent.data.object as Stripe.Invoice;

        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';
        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        const sub = await getLatestSubscriptionForCustomer(customerId);
        if (sub) {
          await updateProfile(userId, {
            subscription_status: sub.status,
            current_period_end: toIso(sub.current_period_end ?? null),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Optional: flag/notify user here.
        break;
      }

      default:
        // Not handled
        break;
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err: any) {
    console.error('[stripe-webhook] error:', err);
    return { statusCode: 500, body: `Error: ${err.message || err}` };
  }
};
