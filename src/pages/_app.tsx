// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { validateEnv } from "@/lib/env";
import { AuthProvider } from "@/lib/supabase/AuthContext";
import { SupabaseProvider } from "@/contexts/SupabaseProvider";

import { DurmahProvider, DurmahContextSetup } from "@/lib/durmah/context";
import { loadMDLStudentContext } from "@/lib/supabase/supabaseBridge";

import LayoutShell from "@/layout/LayoutShell";
import { Toaster } from "react-hot-toast";

// Durmah widget (client-only)
const DurmahWidget = dynamic(() => import("../components/DurmahWidget"), {
  ssr: false,
});

// ✅ AWY widget (client-only)
const AWYWidget = dynamic(() => import("@/components/awy/AWYWidget"), {
  ssr: false,
});

// Optional feature flags
const VOICE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_VOICE_FEATURES === "true";
const AWY_ENABLED = process.env.NEXT_PUBLIC_FEATURE_AWY === "1";

// Server-only init (no-op in browser)
if (typeof window === "undefined") {
  import("@/lib/rss/init")
    .then(({ initializeRSSSystem }) => {
      setTimeout(() => initializeRSSSystem(), 3000);
    })
    .catch((error) => {
      console.error("Failed to import RSS initialization:", error);
    });
}

const AppDurmahBootstrap: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // If your AuthContext exposes userProfile/year, you can wire them here
  useEffect(() => {
    // Refresh the student context each time auth changes
    loadMDLStudentContext(undefined as any).catch((e) =>
      console.error("loadMDLStudentContext failed:", e)
    );
  }, []);
  return <>{children}</>;
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 1 },
        },
      })
  );

  useEffect(() => {
    try {
      validateEnv();
    } catch (error) {
      console.error("Environment validation failed:", error);
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    handleRouteChange();
    router.events.on("routeChangeComplete", handleRouteChange);
    return () =>
      router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // Hide floating widgets on auth-only routes if you prefer
  const hiddenRoutes = ["/login", "/signup", "/auth/redirect"];
  const hideWidgets = hiddenRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AuthProvider>
        <SupabaseProvider>
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={(pageProps as any)?.dehydratedState}>
              <DurmahProvider>
                <DurmahContextSetup />
                <AppDurmahBootstrap>
                  <LayoutShell>
                    <Component {...pageProps} />
                  </LayoutShell>

                  {/* Global Toaster */}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: { background: "#363636", color: "#fff" },
                      success: {
                        duration: 3000,
                        iconTheme: { primary: "#10b981", secondary: "#fff" },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: { primary: "#ef4444", secondary: "#fff" },
                      },
                    }}
                  />

                  {/* ⬇️ Floating widgets */}
                  {!hideWidgets && (
                    <>
                      {VOICE_ENABLED && <DurmahWidget />}
                      {AWY_ENABLED && <AWYWidget />}
                    </>
                  )}
                </AppDurmahBootstrap>
              </DurmahProvider>
            </HydrationBoundary>
          </QueryClientProvider>
        </SupabaseProvider>
      </AuthProvider>
    </>
  );
}
