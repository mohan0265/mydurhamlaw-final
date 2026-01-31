import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // 1. Authenticate User
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin)
    return res.status(500).json({ error: "Server configuration error" });

  // Get user from session cookie (if using supabase auth helpers) or just trust client headers if behind middleware?
  // Better: verify token.
  // Assuming standard Supabase Auth flow, we might need to verify the JWT from the header or cookie.
  // For simplicity here, we assume the user is authenticated via standard Supabase helpers or we verify the session.
  // But Pages API routes don't automatically parse Supabase session.
  // Let's use `supabase-auth-helpers` if available or parse the token manually.
  // Existing code shows `parse(ctx.req.headers.cookie)` in getServerSideProps.
  // Let's try to get user from headers 'Authorization: Bearer <token>' or similar.
  // Or better, let's just use the `supabase-js` client with the user's access token if passed.

  // For robust server-auth, we should use `createServerSupabaseClient` from auth-helpers if installed.
  // Looking at package.json, `@supabase/auth-helpers-nextjs` is installed.

  // Let's use `createServerSupabaseClient` pattern or similar.
  // BUT `pages/api` often requires `createPagesServerClient`.

  // Let's rely on the token passed in headers (standard pattern) or cookies.
  // We'll try to get the user using `getUser`.

  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies["sb-access-token"]; // simplified

  // Actually, let's use the SERVICE ROLE to lookup the user by ID if provided,
  // BUT allowing clients to pass ID is insecure.
  // We MUST verify the session.

  // Since I don't want to overcomplicate with parsing cookies manually if auth-helpers is set up:
  // I'll try to use `createPagesServerClient`.

  // Wait, I will use a simple "get user from token" approach using standard supabase client if possible.

  // Let's check `src/lib/apiAuth.ts` if it exists (Discovery showed it).
  // Probably has logic for this.

  // Fallback:
  // We'll create a client with the access token and get the user.

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // We don't really need anon key if we just want to verify token?
    // Actually, `getUser` requires anon key + access token.
    { global: { headers: { Authorization: req.headers.authorization! } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { priceId } = req.body;
  if (!priceId) {
    return res.status(400).json({ error: "Missing priceId" });
  }

  try {
    // 2. Get or Create Stripe Customer
    // Check billing_customers table
    const { data: billingCust } = await supabaseAdmin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let stripeCustomerId = billingCust?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app: "caseway",
        },
      });
      stripeCustomerId = customer.id;

      // Store in DB
      await supabaseAdmin.from("billing_customers").insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // 3. Create Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      metadata: {
        user_id: user.id,
      },
      // Dynamic success/cancel URLs based on environment
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000"}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000"}/pricing?canceled=true`,
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message });
  }
}
