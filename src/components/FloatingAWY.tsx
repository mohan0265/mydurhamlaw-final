// src/components/FloatingAWY.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAWYEnabled } from '@/lib/feature-flags';

/**
 * Small floating button to open/route to AWY.
 * - Only renders when AWY feature is enabled.
 * - First tries to signal an in-page AWY widget via a custom event.
 * - Falls back to routing to the AWY settings page (exists in your app).
 */
export default function FloatingAWY() {
  const router = useRouter();

  if (!isAWYEnabled()) return null;

  const handleClick = useCallback(() => {
    // Signal any mounted widget to open (AWYWidget can listen for this)
    try {
      window.dispatchEvent(new CustomEvent('awy:open'));
    } catch {
      // ignore
    }
    // Also navigate to settings as a reliable entry point
    router.push('/settings/awy');
  }, [router]);

  return (
    <button
      onClick={handleClick}
      aria-label="Open AWY"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700"
    >
      🎥 AWY
    </button>
  );
}
