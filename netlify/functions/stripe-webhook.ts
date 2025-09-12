import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Make sure your `public.profiles` table has these columns (add if missing):
 *
 *   stripe_customer_id text
 *   subscription_status text
 *   trial_ends_at timestamptz
 *   current_period_end timestamptz
 *
 * (You can ALTER TABLE to add them; RLS is bypassed with the service role key.)
 */

async function updateProfileByUserId(
  userId: string,
  patch: Record<string, any>
) {
  await supabase.from('profiles').update(patch).eq('id', userId)
}

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  if (!webhookSecret) {
    return { statusCode: 500, body: 'Webhook secret not configured' }
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body as string,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature error:', err?.message || err)
    return { statusCode: 400, body: `Webhook Error: ${err?.message || err}` }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session

        // Prefer metadata on session → or pull customer metadata
        let supabaseUid =
          (session.metadata && session.metadata['supabase_uid']) || null

        let customerId = (session.customer as string) || null
        if (!supabaseUid && customerId) {
          const cust = await stripe.customers.retrieve(customerId)
          if (!cust || (cust as any).deleted) break
          supabaseUid = (cust as Stripe.Customer).metadata?.['supabase_uid']
        }

        if (supabaseUid) {
          await updateProfileByUserId(supabaseUid, {
            stripe_customer_id: customerId,
            subscription_status: 'active', // session completed means payment method attached
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        // Get the mapped supabase user id from customer metadata
        let supabaseUid: string | undefined
        if (customerId) {
          const cust = await stripe.customers.retrieve(customerId)
          if (!cust || (cust as any).deleted) break
          supabaseUid = (cust as Stripe.Customer).metadata?.['supabase_uid']
        }
        if (!supabaseUid) break

        await updateProfileByUserId(supabaseUid, {
          stripe_customer_id: customerId,
          subscription_status: sub.status,
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        })
        break
      }

      case 'invoice.payment_succeeded': {
        // Optional: mark as active
        break
      }

      case 'invoice.payment_failed': {
        // Optional: you might set status to 'past_due' or send an email
        break
      }

      case 'customer.subscription.trial_will_end': {
        // Optional: send a friendly reminder email
        break
      }

      default:
        // ignore unhandled events
        break
    }

    return { statusCode: 200, body: 'ok' }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return { statusCode: 500, body: `Server error: ${err?.message || err}` }
  }
}
export default handler
