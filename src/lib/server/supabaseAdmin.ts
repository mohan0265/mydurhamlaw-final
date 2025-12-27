// Server-only Supabase client with service_role
// Lazy-initialized to avoid throwing during Next build when env may be unset.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

function ensureAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin env missing: ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  }
  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

// Proxy so existing imports using `supabaseAdmin.from(...)` still work, but init is lazy.
export const supabaseAdmin = new Proxy(
  {} as SupabaseClient,
  {
    get(_target, prop) {
      const client = ensureAdminClient();
      // @ts-expect-error dynamic proxy access
      return client[prop];
    },
  }
) as SupabaseClient;

export function getSupabaseAdmin() {
  return ensureAdminClient();
}
