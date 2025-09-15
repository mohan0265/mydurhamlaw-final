// src/lib/api/authedFetch.ts
import { getSupabaseClient } from "@/lib/supabase/client";

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  let token: string | undefined;

  // Safely read the Supabase session if the client exists
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }
  } catch {
    token = undefined;
  }

  // Merge/augment headers
  const headers = new Headers(init.headers as HeadersInit);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body !== undefined && init.body !== null) {
    headers.set("Content-Type", "application/json");
  }

  // Keep cookies + add our headers
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
