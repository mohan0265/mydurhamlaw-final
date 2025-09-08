'use client';

import { useEffect } from "react";
import { useRouter } from "next/router";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Also revokes the refresh token on the auth server
          await supabase.auth.signOut({ scope: "global" });
        } catch {
          // ignore
        }
      }
      try { localStorage.clear(); } catch {}
      // Force a clean re-init of auth state
      router.replace("/");
    })();
  }, [router]);

  return (
    <div className="p-6 text-sm text-gray-600">
      Signing you out…
    </div>
  );
}
