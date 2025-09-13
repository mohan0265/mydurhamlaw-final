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
import { DurmahProvider, DurmahContextSetup } from "@/lib/durmah/context";
import { loadMDLStudentContext } from "@/lib/supabase/supabaseBridge";
import { Toaster } from "react-hot-toast";
import LayoutShell from "@/layout/LayoutShell";
import { getSupabaseClient } from "@/lib/supabase/client";
import { TrialBanner } from "@/components/billing/TrialBanner";

// Voice (Durmah) widget (client-only)
const DurmahWidget = dynamic(() => import("../components/DurmahWidget"), {
  ssr: false,
});

// AWY widget bootstrap (client-only)
import AWYBootstrap from "@/components/AWYBootstrap";
import { isAWYEnabled } from "@/lib/feature-flags";

// Feature flags (support both legacy and new)
import { isEnabled } from "@/lib/feature-flags";
const VOICE_ENABLED = isEnabled(process.env.NEXT_PUBLIC_ENABLE_VOICE_FEATURES);


// Server-only init
if (typeof window === "undefined") {
  import("@/lib/rss/init")
    .then(({ initializeRSSSystem }) => {
      setTimeout(() => initializeRSSSystem(), 3000);
    })
    .catch((error) => {
      console.error("Failed to import RSS initialization:", error);
    });
}

// Durmah context bootstrap
const AppDurmahBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    loadMDLStudentContext(undefined as any).catch((e) =>
      console.error("loadMDLStudentContext failed:", e)
    );
  }, []);
  return <>{children}</>;
};

// Trial banner wrapper (resolves user id)
const GlobalTrialBanner: React.FC = () => {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUid(data?.user?.id ?? null))
      .catch(() => setUid(null));
  }, []);

  if (!uid) return null;
  return <TrialBanner userId={uid} onUpgrade={() => router.push("/pricing")} />;
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
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // Hide widgets on auth/redirect routes
  const hiddenRoutes = ["/login", "/signup", "/auth/redirect"];
  const hideWidgets = hiddenRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={(pageProps as any)?.dehydratedState}>
            <DurmahProvider>
              <DurmahContextSetup />
              <AppDurmahBootstrap>
                {/* Global trial banner (auto-hides when not needed) */}
                <GlobalTrialBanner />

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

                {/* Floating widgets */}
                {!hideWidgets && (
                  <>
                    {VOICE_ENABLED && <DurmahWidget />}
                    {isAWYEnabled() && <AWYBootstrap />}
                  </>
                )}
              </AppDurmahBootstrap>
            </DurmahProvider>
          </HydrationBoundary>
        </QueryClientProvider>
      </AuthProvider>
    </>
  );
}
