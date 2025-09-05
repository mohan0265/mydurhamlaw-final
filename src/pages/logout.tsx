// src/pages/logout.tsx
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        router.replace("/");
      }
    })();
  }, [router]);

  return <div className="p-6 text-sm text-gray-600">Signing you out…</div>;
}
