"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabase/client";

const ClientAWY = dynamic(() => import("./awy/AWYWidget").then(m => m.default), { ssr: false });

function useActivateLovedOneOnLogin() {
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return; // <-- null guard
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await supabase.rpc("awy_activate_loved_one_on_login");
          } catch {
            /* swallow */
          }
        }
      } catch {
        /* swallow */
      }
    })();
  }, []);
}

export default function AWYBootstrap() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return; // <-- null guard
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id);
      } catch {
        /* swallow */
      }
    })();
  }, []);

  useActivateLovedOneOnLogin();

  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_AWY === "true" ||
    process.env.NEXT_PUBLIC_FEATURE_AWY === "1";

  if (!mounted || !enabled) return null;

  return <ClientAWY userId={userId} />; // userId is optional now
}
