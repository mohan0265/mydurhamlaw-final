// Server-only Supabase client with service_role
// Lazy-initialized to avoid throwing during Next build when env may be unset.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

function ensureAdminClient(): SupabaseClient | null {
  if (adminClient) return adminClient;

  // Use server-side vars only; never rely on public env here.
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceKey) {
    console.warn('[supabaseAdmin] Missing Supabase admin env (url or service key). Returning null.');
    return null;
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
      return client ? client[prop] : undefined;
    },
  }
) as SupabaseClient;

export function getSupabaseAdmin() {
  return ensureAdminClient();
}
