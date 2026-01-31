// src/pages/eligibility.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getSupabaseClient } from "@/lib/supabase/client";
import Head from "next/head";

/**
 * Legacy Eligibility Route - Now Redirects to Unified Signup
 */
export default function EligibilityRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace("/signup");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Logged-in users who land here likely lack access - go to pricing
        router.replace("/pricing");
      } else {
        // Logged-out users go to unified signup
        const { next, plan } = router.query;
        let url = "/signup";
        const params = new URLSearchParams();
        if (next) {
          const val = Array.isArray(next) ? next[0] : next;
          if (val) params.set("next", val);
        }
        if (plan) {
          const val = Array.isArray(plan) ? plan[0] : plan;
          if (val) params.set("plan", val);
        }

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        router.replace(url);
      }
    });
  }, [router]);

  return (
    <>
      <Head>
        <title>Redirecting... | Caseway</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Redirecting to signup...</p>
        </div>
      </div>
    </>
  );
}
