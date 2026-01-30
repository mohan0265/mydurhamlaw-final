ALTER TABLE public.awy_connections
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text,
  ADD COLUMN IF NOT EXISTS facetime_contact text,
  ADD COLUMN IF NOT EXISTS google_meet_url text,
  ADD COLUMN IF NOT EXISTS preferred_channel text;

ALTER TABLE public.awy_connections
  DROP CONSTRAINT IF EXISTS awy_connections_preferred_channel_check;

ALTER TABLE public.awy_connections
  ADD CONSTRAINT awy_connections_preferred_channel_check
  CHECK (preferred_channel IS NULL OR preferred_channel IN ('whatsapp','facetime','meet','phone'));

-- Add comment
COMMENT ON COLUMN public.awy_connections.whatsapp_e164 IS 'WhatsApp number in E.164 format (e.g. +6591234567)';
