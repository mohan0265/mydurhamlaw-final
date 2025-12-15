// netlify/functions/create-checkout-session.ts
import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Match your dashboard API version (shown on the Webhooks page)
  apiVersion: '2025-08-27.basil' as any,
});

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Expecting { userId, email } from the client
    const { userId, email } = JSON.parse(event.body || '{}');
    if (!userId || !email) {
      return { statusCode: 400, body: 'Missing userId or email' };
    }

    // Reuse / create customer idempotently by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      customers.data[0] ??
      (await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      }));

    // IMPORTANT: USE YOUR *PRICE* ID HERE (not product id)
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID as string;

    // Your deployed site base (prefer env, then headers, then local)
    const siteURL =
      process.env.NEXT_PUBLIC_APP_URL ||
      ((event.headers['x-forwarded-proto'] && event.headers.host)
        ? `${event.headers['x-forwarded-proto']}://${event.headers.host}`
        : 'http://localhost:8888');

    // Stripe Checkout session with trial via free period on the Price (or pass trial_period_days)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteURL}/billing?status=success`,
      cancel_url: `${siteURL}/billing?status=cancel`,
      allow_promotion_codes: true,
      // If you configured a trial on the Price in Stripe dashboard, you don't need trial params here.
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error('[create-checkout-session] error:', err);
    return { statusCode: 500, body: `Error: ${err.message || err}` };
  }
};
