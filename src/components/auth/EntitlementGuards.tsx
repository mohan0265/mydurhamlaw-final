import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/supabase/AuthContext";
import { RefreshCw } from "lucide-react";

interface EntitlementsState {
  hasDurhamAccess: boolean;
  hasLnatAccess: boolean;
  loading: boolean;
  error: string | null;
}

export function useEntitlements() {
  const user = useUser();
  const [state, setState] = useState<EntitlementsState>({
    hasDurhamAccess: false,
    hasLnatAccess: false,
    loading: true,
    error: null,
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false, error: null }));
      return;
    }

    let isMounted = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[useEntitlements] Fetch timed out after 5s");
      controller.abort();
      if (isMounted)
        setState((s) => ({ ...s, loading: false, error: "Request timed out" }));
    }, 5000);

    fetch("/api/entitlements/me", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401)
            return { hasDurhamAccess: false, hasLnatAccess: false };
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("[useEntitlements] Auth SUCCESS:", data);
        if (isMounted) {
          setState({
            hasDurhamAccess: !!data.hasDurhamAccess,
            hasLnatAccess: !!data.hasLnatAccess,
            loading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        const isAbort = err.name === "AbortError";
        if (isAbort) {
          console.debug(
            "[useEntitlements] Request aborted (likely timeout or unmount)",
          );
          return; // Exit silent on abort
        }

        console.error("[useEntitlements] Verification Failed:", err.message);
        if (isMounted) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "Verification Failed",
          }));
        }
      })
      .finally(() => {
        if (isMounted) {
          // Ensure timeout is cleared and any non-aborted state settles
          clearTimeout(timeoutId);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [user, retryKey]);

  const retry = () => setRetryKey((prev) => prev + 1);

  return { ...state, retry };
}

export function RequireDurhamAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasDurhamAccess, loading, error, retry } = useEntitlements();
  const router = useRouter();
  const user = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect if loading is false, there is no error, and access is explicitly missing
    if (!loading && !error && user && !hasDurhamAccess) {
      console.log(
        "[RequireDurhamAccess] Access explicitly denied. Redirecting to pricing...",
      );
      router.replace("/pricing");
    } else if (!loading && !user) {
      router.replace("/login");
    }
  }, [hasDurhamAccess, loading, error, router, user]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 max-w-sm">
          <RefreshCw className="w-8 h-8 text-amber-500 mb-4 mx-auto" />
          <h3 className="text-lg font-bold text-amber-900 mb-2">
            Access Check Delayed
          </h3>
          <p className="text-sm text-amber-800 mb-6">
            {error}. This can happen on slow connections.
          </p>
          <button
            onClick={retry}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasDurhamAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 font-medium">
          Verifying your student access...
        </p>
        <button
          onClick={() => router.replace("/eligibility")}
          className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-soft hover:bg-purple-700 transition"
        >
          Go to Eligibility
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireLnatAccess({ children }: { children: React.ReactNode }) {
  const { hasLnatAccess, loading } = useEntitlements();
  const router = useRouter();
  const user = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user && !hasLnatAccess) {
      router.replace("/lnat/signup");
    } else if (!loading && !user) {
      router.replace("/lnat/signup");
    }
  }, [hasLnatAccess, loading, router, user]);

  if (!mounted || loading || !hasLnatAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}
