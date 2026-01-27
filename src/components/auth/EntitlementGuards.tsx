import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/supabase/AuthContext";
import { RefreshCw } from "lucide-react";

interface EntitlementsState {
  hasDurhamAccess: boolean;
  hasLnatAccess: boolean;
  loading: boolean;
}

export function useEntitlements() {
  const user = useUser();
  const [state, setState] = useState<EntitlementsState>({
    hasDurhamAccess: false,
    hasLnatAccess: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      console.log("[useEntitlements] No user, skipping fetch.");
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[useEntitlements] Fetch timed out after 4s");
      controller.abort();
      if (isMounted) setState((s) => ({ ...s, loading: false }));
    }, 4000); // Shorter 4s timeout

    fetch("/api/entitlements/me", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        // Handle non-JSON responses (e.g. 401/406)
        if (!res.ok) {
          if (res.status === 401)
            return { hasDurhamAccess: false, hasLnatAccess: false };
          throw new Error(`Entitlements fetch failed: ${res.status}`);
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
          });
        }
      })
      .catch((err) => {
        const isAbort = err.name === "AbortError";
        console.error(
          `[useEntitlements] ${isAbort ? "Timeout" : "Error"}:`,
          err.message,
        );
        // On error/timeout, assume no access but STOP LOADING to allow redirect logic to run
        if (isMounted) setState((s) => ({ ...s, loading: false }));
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [user]);

  return state;
}

export function RequireDurhamAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasDurhamAccess, loading } = useEntitlements();
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    console.log("[RequireDurhamAccess] State changed:", {
      loading,
      user: !!user,
      hasDurhamAccess,
    });
    if (!loading && user && !hasDurhamAccess) {
      console.log(
        "[RequireDurhamAccess] Access denied, redirecting to eligibility...",
      );
      router.replace("/eligibility");
    } else if (!loading && !user) {
      console.log("[RequireDurhamAccess] No user, redirecting to login");
      router.replace("/login");
    }
  }, [hasDurhamAccess, loading, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
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
        <p className="text-xs text-gray-400 mt-2">
          If you aren't redirected in a few seconds, please click below.
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

  useEffect(() => {
    if (!loading && user && !hasLnatAccess) {
      router.replace("/lnat/signup");
    } else if (!loading && !user) {
      router.replace("/lnat/signup");
    }
  }, [hasLnatAccess, loading, router, user]);

  if (loading || !hasLnatAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}
