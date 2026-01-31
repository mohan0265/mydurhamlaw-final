-- Stripe Billing Tables
-- Created: 2026-02-01

-- A) BILLING CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B) SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, 
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  trial_start TIMESTAMPTZ NULL,
  trial_end TIMESTAMPTZ NULL,
  canceled_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  grace_until TIMESTAMPTZ NULL,
  latest_invoice_id TEXT NULL,
  latest_invoice_url TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C) INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  status TEXT NULL,
  hosted_invoice_url TEXT NULL,
  invoice_pdf TEXT NULL,
  amount_due BIGINT NULL,
  amount_paid BIGINT NULL,
  currency TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D) WEBHOOK EVENTS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT NULL,
  payload JSONB NOT NULL
);

-- E) PLAN CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  interval TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_billing_subs_user ON billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subs_period_end ON billing_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON stripe_webhook_events(status);

-- RLS POLICIES
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;

-- Customers: Users view their own
CREATE POLICY "Users view own billing customer" ON billing_customers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Subscriptions: Users view their own
CREATE POLICY "Users view own subscriptions" ON billing_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Invoices: Users view their own
CREATE POLICY "Users view own invoices" ON billing_invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Webhook Events: Admin only
CREATE POLICY "Admins view webhook events" ON stripe_webhook_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Plans: Public read active
CREATE POLICY "Public view active plans" ON billing_plans
  FOR SELECT TO authenticated, anon
  USING (is_active = true);

-- Service Role (Full Access implicit or explicit if needed, but implicit bypasses RLS)
-- Note: Insert/Update on billing tables strictly via Service Role (API Routes) or Admin
