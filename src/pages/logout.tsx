
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function Logout() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you out...");

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const performLogout = async () => {
      try {
        setStatus("Signing you out...");
        
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            // Sign out with global scope to revoke refresh tokens
            await supabase.auth.signOut({ scope: "global" });
          } catch (error) {
            console.warn("Supabase signout error:", error);
          }
        }
        
        setStatus("Clearing session data...");
        
        // Clear all storage
        try {
          localStorage.clear();
        } catch (error) {
          console.warn("Failed to clear localStorage:", error);
        }
        
        try {
          sessionStorage.clear();
        } catch (error) {
          console.warn("Failed to clear sessionStorage:", error);
        }
        
        setStatus("Redirecting...");
        
        // Small delay to show status, then redirect
        timeoutId = setTimeout(() => {
          router.replace("/");
        }, 500);
        
      } catch (error) {
        console.error("Logout process error:", error);
        setStatus("Redirecting...");
        // Even if there's an error, redirect to clear state
        timeoutId = setTimeout(() => {
          router.replace("/");
        }, 1000);
      }
    };

    performLogout();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Logging Out
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
