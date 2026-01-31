"use client";

import React, { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-clicks

    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        // Sign out with global scope to revoke refresh tokens
        await supabase.auth.signOut({ scope: "global" });
      }

      // Clear all localStorage data
      try {
        localStorage.clear();
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }

      // Clear sessionStorage as well
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn("Failed to clear sessionStorage:", error);
      }

      // Clear admin session cookie
      try {
        document.cookie =
          "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } catch (error) {
        console.warn("Failed to clear admin cookie:", error);
      }

      // Force reload to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to home to clear state
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className ?? "text-sm"}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Signing out..." : "Log out"}
    </button>
  );
}
