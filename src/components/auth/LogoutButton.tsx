// src/components/auth/LogoutButton.tsx
import React from "react";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <a href="/logout" className={className ?? "text-sm"}>
      Log out
    </a>
  );
}
