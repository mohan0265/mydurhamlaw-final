import { getSupabaseClient } from '@/lib/supabase/client';
import { SubscriptionService } from './subscriptionService';

// Create a server-side instance of SubscriptionService
// Note: This assumes getSupabaseServerClient() returns a client that is safe to use
// in the context where this service is called.
// If getSupabaseServerClient() relies on request context (cookies), then
// we should ideally instantiate this service per-request or pass the client to methods.
// However, looking at the original code, it seemed to treat it as a singleton.
// But getSupabaseServerClient() in src/lib/supabase/server.ts creates a NEW client each time.
// So passing the RESULT of getSupabaseServerClient() to the constructor means
// the service holds a SINGLE client instance created at module load time.
// This is WRONG if the client needs to be request-scoped (e.g. for RLS).
// BUT, getSupabaseServerClient() uses the SERVICE_ROLE_KEY, so it bypasses RLS.
// So a singleton is acceptable for admin tasks.

export const serverSubscriptionService = new SubscriptionService(getSupabaseClient());
