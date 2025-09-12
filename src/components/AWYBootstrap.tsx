// src/components/AWYBootstrap.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { getSupabaseClient } from "@/lib/supabase/client";
import { authedFetch } from "@/lib/api/authedFetch";
import AWYSetupHint from "./awy/AWYSetupHint";

type AWYProps = { userId: string };

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
          try {
            await supabase.rpc("awy_activate_loved_one_on_login");
          } catch {}
        }
      } catch {}
    })();
  }, []);
}

export default function AWYBootstrap() {
  const [mounted, setMounted] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [hasConnections, setHasConnections] = useState<boolean | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth
      .getUser()
      .then(({ data }) => setUid(data?.user?.id ?? null))
      .catch(() => setUid(null));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await authedFetch("/api/awy/connections");
        if (!r.ok) {
          setHasConnections(false);
          return;
        }
        const data = await r.json();
        const arr = Array.isArray(data) ? data : (data?.connections ?? []);
        setHasConnections((arr?.length ?? 0) > 0);
      } catch {
        setHasConnections(false);
      }
    })();
  }, [uid]);

  useActivateLovedOneOnLogin();

  const awyOn =
    process.env.NEXT_PUBLIC_ENABLE_AWY === "true" ||
    process.env.NEXT_PUBLIC_FEATURE_AWY === "1";

  if (!mounted || !awyOn || !uid) return null;

  return (
    <ErrorBoundary>
      <ClientAWY userId={uid} />
      {hasConnections === false && <AWYSetupHint />}
    </ErrorBoundary>
  );
}
