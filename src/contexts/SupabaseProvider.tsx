"use client";
import React, { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

const SupabaseCtx = createContext<SupabaseClient | null>(null);
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabaseClient(), []);
  return <SupabaseCtx.Provider value={client}>{children}</SupabaseCtx.Provider>;
}
export function useSupabaseClient(): SupabaseClient | null {
  return useContext(SupabaseCtx);
}
