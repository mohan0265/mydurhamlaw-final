"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabase/client";

// Client-only AWY widget
const ClientAWY = dynamic(
  () => import("./awy/AWYWidget").then((m) => m.default),
  { ssr: false }
);

/**
 * On first login for a loved-one:
 * - Claim any pending invites (sets loved_one_id/status)
 * - Mark presence once so they appear online immediately
 */
function useClaimInviteAndMarkPresence(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // 1) Claim pending invite (safe to call for students too; it just no-ops)
        try {
          await supabase.rpc("awy_activate_loved_one_on_login");
        } catch (e) {
          // do not block UX
          console.warn("[AWY] activate_loved_one_on_login failed:", e);
        }

        // 2) Mark presence so widget can show them online
        try {
          await fetch("/api/awy/presence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_online: true,
              current_activity: "online",
              last_seen: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.warn("[AWY] presence POST failed:", e);
        }
      } catch {
        /* swallow */
      }
    })();
  }, [userId]);
}

export default function AWYBootstrap() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);

    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return; // null guard
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserId(user?.id);
      } catch {
        setUserId(undefined);
      }
    })();
  }, []);

  // Claim invite & mark presence once we know the user id
  useClaimInviteAndMarkPresence(userId);

  // Feature flag (support both legacy + new flags)
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_AWY === "true" ||
    process.env.NEXT_PUBLIC_FEATURE_AWY === "1";

  // Don’t render the widget when not mounted, not enabled, or not signed in.
  if (!mounted || !enabled || !userId) return null;

  // userId is required to avoid 401s from the widget API calls
  return <ClientAWY userId={userId} />;
}
