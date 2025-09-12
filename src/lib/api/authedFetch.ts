// src/lib/api/authedFetch.ts
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Auth-aware fetch:
 *  - includes cookies (credentials: "include")
 *  - attaches Bearer access token when available
 *  - safe if supabase client is null (e.g., SSR or no session yet)
 */
export async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const supabase = getSupabaseClient();

  let token: string | undefined;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token ?? undefined;
    } catch {
      token = undefined;
    }
  }

  const headers = new Headers(init.headers || {});
  // Only set Content-Type for non-GET requests if caller didn't set it
  if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input.toString(), {
    ...init,
    headers,
    credentials: "include",
  });
}
