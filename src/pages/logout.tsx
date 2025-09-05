// src/pages/logout.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Global = revoke refresh token at auth server too
        await supabase.auth.signOut({ scope: "global" });

        // Extra hard reset: clear any app-side caches/state if you use them
        try {
          localStorage.removeItem("awyWidget:position");
          // add any other app keys you want to clear here
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
