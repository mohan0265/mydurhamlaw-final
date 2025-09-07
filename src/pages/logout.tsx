// src/pages/logout.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase/client";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Global = revoke refresh token at auth server too
        await supabase.auth.signOut({ scope: "global" });

        // Extra hard reset: clear any app-side caches/state if you use them
        try {
          localStorage.clear();
          // This clears all localStorage including AWY widget position and any cached profile data
        } catch {}
      } finally {
        // Force a fresh load so AuthContext re-initializes to "signed out"
        router.replace("/");
      }
    })();
  }, [router]);

  return (
    <div className="p-6 text-sm text-gray-600">
      Signing you out…
    </div>
  );
}
