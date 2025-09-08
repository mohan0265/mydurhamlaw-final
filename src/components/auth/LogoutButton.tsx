'use client';

import React from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // SSR or client not ready—just reload to home
      window.location.href = "/";
      return;
    }
    await supabase.auth.signOut({ scope: "global" });
    try { localStorage.clear(); } catch {}
    window.location.href = "/";
  };

  return (
    <button onClick={handleLogout} className={className ?? "text-sm"}>
      Log out
    </button>
  );
}
