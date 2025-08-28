// src/lib/supabaseBridge.ts
// One place the widget imports from. Uses the SAME Supabase client as the app
// and exposes a tiny hook that always reflects the current signed-in user.

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-browser";

/** Read the current user from the single app client. */
export function useAuth(): { user: User | null } {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // ✅ Most reliable: read the active session (works across all providers)
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data?.session?.user ?? null);
    });

    // Stay in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        (sub as any)?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return { user };
}

export { supabase };
