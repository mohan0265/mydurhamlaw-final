// src/lib/supabaseBridge.ts
// Bridge used by the widget: reuse the app’s Supabase browser client and expose a tiny useAuth hook.

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-browser";

/**
 * Minimal typed auth hook so the widget reads the signed-in user
 * (RLS will then apply correctly on inserts/updates).
 */
export function useAuth(): { user: User | null } {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get current user once
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user ?? null);
    });

    // Keep in sync with future changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        // supabase-js v2 shape
        (listener as any)?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return { user };
}

export { supabase };
