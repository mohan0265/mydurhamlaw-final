// src/components/auth/LogoutButton.tsx
import React from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogoutButton({ className }: { className?: string }) {
  const onClick = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Sign-out failed");
    }
  };
  return (
    <button onClick={onClick} className={className ?? "text-sm"}>
      Log out
    </button>
  );
}
