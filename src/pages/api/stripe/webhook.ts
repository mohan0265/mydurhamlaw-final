import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  if (!WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).send("Webhook Secret Missing");
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const adminFn = getSupabaseAdmin();
  if (!adminFn) {
    console.error("Supabase Admin Client missing");
    return res.status(500).send("Database Error");
  }
  const supabase = adminFn;

  // Idempotency: Check if already processed
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, status")
    .eq("stripe_event_id", event.id)
    .single();

  if (existing && existing.status === "processed") {
    return res.status(200).send("Already processed");
  }

  // Log receipt
  if (!existing) {
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event,
      status: "received",
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabase,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          supabase,
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
          supabase,
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabase,
        );
        break;
      default:
      // console.log(`Unhandled event type ${event.type}`);
    }

    // Mark processed
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook ${event.type}:`, err);

    // Log error
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "failed", error: err.message })
      .eq("stripe_event_id", event.id);

    res.status(500).send(`Processing Error: ${err.message}`);
  }
}

// --- Handlers ---

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
) {
  if (!session.metadata?.user_id) return; // Should have user_id from checkout creation
  const userId = session.metadata.user_id;
  const customerId = session.customer as string;

  // Link customer
  await supabase.from("billing_customers").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
    },
    { onConflict: "user_id" },
  );

  // Ensure profile has this (redundancy but useful)
  await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
    })
    .eq("id", userId);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any,
) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  let userId = subscription.metadata?.user_id;

  if (!userId) {
    const { data: cust } = await supabase
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();
    userId = cust?.user_id;
  }

  if (!userId) {
    console.warn(
      `No user found for subscription ${subscription.id} (cust: ${customerId})`,
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;

  await supabase.from("billing_subscriptions").upsert(
    {
      stripe_subscription_id: subscription.id,
      user_id: userId,
      stripe_price_id: priceId,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      ended_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : null,
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Sync to profiles for easy frontend access (Role/Entitlements)
  let newRole = "user";
  if (["active", "trialing"].includes(subscription.status)) {
    newRole = "paid";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile && ["admin", "demo"].includes(profile.role)) {
    // Do not touch role
  } else {
    await supabase
      .from("profiles")
      .update({
        role: newRole,
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
      })
      .eq("id", userId);
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any,
) {
  if (!invoice.subscription) return; // One-off invoices?

  // Upsert invoice
  const subscriptionId = invoice.subscription as string;

  // Get User ID from subscription table
  const { data: sub } = await supabase
    .from("billing_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!sub) return;
  const userId = sub.user_id;

  await supabase.from("billing_invoices").upsert(
    {
      stripe_invoice_id: invoice.id,
      user_id: userId,
      status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
    },
    { onConflict: "stripe_invoice_id" },
  );

  // Clear grace period on subscription
  await supabase
    .from("billing_subscriptions")
    .update({
      grace_until: null,
      latest_invoice_id: invoice.id,
      latest_invoice_url: invoice.hosted_invoice_url,
    })
    .eq("stripe_subscription_id", subscriptionId);

  await supabase
    .from("profiles")
    .update({
      grace_until: null,
      subscription_status: "active",
    })
    .eq("id", userId);
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any,
) {
  if (!invoice.subscription) return;
  const subscriptionId = invoice.subscription as string;

  const { data: sub } = await supabase
    .from("billing_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  if (!sub) return;

  // Upsert invoice (failed status)
  await supabase.from("billing_invoices").upsert(
    {
      stripe_invoice_id: invoice.id,
      user_id: sub.user_id,
      status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
    },
    { onConflict: "stripe_invoice_id" },
  );

  // Set Grace Period (e.g. 7 days from now)
  const graceUntil = new Date();
  graceUntil.setDate(graceUntil.getDate() + 7);

  await supabase
    .from("billing_subscriptions")
    .update({
      grace_until: graceUntil.toISOString(),
      latest_invoice_id: invoice.id,
      latest_invoice_url: invoice.hosted_invoice_url,
    })
    .eq("stripe_subscription_id", subscriptionId);

  await supabase
    .from("profiles")
    .update({
      grace_until: graceUntil.toISOString(),
      subscription_status: "past_due",
    })
    .eq("id", sub.user_id);
}
