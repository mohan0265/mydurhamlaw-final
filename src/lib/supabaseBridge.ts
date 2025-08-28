// src/lib/supabaseBridge.ts  (MyDurhamLaw)

import { supabase } from "./supabase-browser"; // same folder as this file

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export function useAuth(): { user: User | null } {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: User | null } }) => {
        if (mounted) setUser(data?.user ?? null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (mounted) setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      try {
        // supabase-js v2 returns { data: { subscription } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (listener as any)?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return { user };
}

export { supabase };
