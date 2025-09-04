"use client";
import React, { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const SupabaseCtx = createContext<SupabaseClient | null>(null);
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabaseBrowser(), []);
  return <SupabaseCtx.Provider value={client}>{children}</SupabaseCtx.Provider>;
}
export function useSupabaseClient(): SupabaseClient | null {
  return useContext(SupabaseCtx);
}
