// src/layout/LayoutShell.tsx
import React from "react";
import { useRouter } from "next/router";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { AppFooter } from "@/components/footer/AppFooter";
import { useAuth } from "@/lib/supabase/AuthContext";
import dynamic from "next/dynamic";
// Dynamic imports to avoid SSR issues with Voice/WebRTC
const DurmahWidget = dynamic(() => import("@/components/DurmahWidget"), {
  ssr: false,
});
const AWYWidget = dynamic(() => import("@/components/awy/AWYWidget"), {
  ssr: false,
});
const GlobalDurmahSafe = dynamic(
  () => import("@/components/durmah/GlobalDurmahSafe"),
  {
    ssr: false,
  },
);
import { CalendarProvider } from "@/context/CalendarContext";
import { WidgetErrorBoundary } from "@/components/common/WidgetErrorBoundary";

type Props = { children: React.ReactNode };

export default function LayoutShell({ children }: Props) {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only the home page is full-bleed; everything else is constrained
  const fullBleedPrefixes = ["/"];
  const isFullBleed = fullBleedPrefixes.some(
    (p) => router.pathname === p || router.pathname.startsWith(p + "/"),
  );
  const isAuthPage = ["/login", "/signup", "/auth/redirect"].includes(
    router.pathname,
  );
  const isFullScreenPage =
    router.pathname.startsWith("/quiz/") ||
    router.pathname.startsWith("/assignments/");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 transition-colors duration-500">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {mounted && (
        <>
          <GlobalHeader />
          {/* Calendar state available to all pages */}
          <CalendarProvider>
            <main id="main-content" className="flex-1 flex flex-col min-h-0">
              {isFullBleed || isFullScreenPage ? (
                children
              ) : (
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              )}
            </main>
          </CalendarProvider>
          {/* Unified Footer - Hidden for full-screen tools like Quiz/Assignments */}
          {!isFullScreenPage && <AppFooter isAuthed={!!user} />}
          {/* Global Floating Widgets - Show on all pages except auth pages AND only when logged in */}
          {!isAuthPage && user && (
            <>
              <WidgetErrorBoundary>
                <GlobalDurmahSafe />
              </WidgetErrorBoundary>
              <AWYWidget />
            </>
          )}
        </>
      )}
    </div>
  );
}
