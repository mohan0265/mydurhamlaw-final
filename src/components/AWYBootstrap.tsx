// src/components/AWYBootstrap.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { getSupabaseClient } from "@/lib/supabase/client";

// The enhanced widget expects a userId prop
type AWYProps = { userId: string };

// Import the DEFAULT export of your AWY widget (you pasted EnhancedAWYWidget into AWYWidget.tsx)
const ClientAWY = dynamic<AWYProps>(() => import("./awy/AWYWidget"), {
  ssr: false,
  loading: () => null,
});

function useActivateLovedOneOnLogin() {
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const { data: { user } = { user: null } } = await supabase.auth.getUser();
        if (user) {
          // helper RPC; ignore failures
          try {
            await supabase.rpc("awy_activate_loved_one_on_login");
          } catch {}
        }
      } catch {
        /* ignore auth errors */
      }
    })();
  }, []);
}

export default function AWYBootstrap() {
  const [mounted, setMounted] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Pull the signed-in user's id for the widget
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth
      .getUser()
      .then(({ data }) => setUid(data?.user?.id ?? null))
      .catch(() => setUid(null));
  }, []);

  useActivateLovedOneOnLogin();

  const awyOn =
    process.env.NEXT_PUBLIC_ENABLE_AWY === "true" ||
    process.env.NEXT_PUBLIC_FEATURE_AWY === "1";

  if (!mounted || !awyOn || !uid) return null;

  return (
    <ErrorBoundary>
      <ClientAWY userId={uid} />
    </ErrorBoundary>
  );
}
