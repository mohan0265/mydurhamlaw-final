// src/components/auth/LogoutButton.tsx
import React from "react";
import { supabase } from "@/lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear any cached profile state
    localStorage.clear();
    // Force reload to reset context
    window.location.href = "/";
  };

  return (
    <button onClick={handleLogout} className={className ?? "text-sm"}>
      Log out
    </button>
  );
}
