import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

type InviteState = "checking" | "needs_auth" | "accepted" | "error";

export default function AwyInvitePage() {
  const [state, setState] = useState<InviteState>("checking");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        setState("error");
        setMessage("Missing or invalid invite token.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setState("needs_auth");
        setMessage("Please sign in to accept your invite.");
        return;
      }

      const { error } = await supabase.rpc("awy_accept_invite", { p_token: token });
      if (error) {
        setState("error");
        setMessage(error.message || "Could not accept invite.");
        return;
      }

      setState("accepted");
      setMessage("You’re connected! Redirecting…");
      setTimeout(() => {
        window.location.href = "/loved-one-dashboard";
      }, 1200);
    };

    run().catch((err) => {
      setState("error");
      setMessage(err?.message || "Unexpected error.");
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Always With You Invite</h1>
      <p className="text-sm text-slate-600 mb-6">
        Accept your connection and let your student know you&apos;re here.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="text-sm text-slate-800">
          {state === "checking" && "Verifying your invite…"}
          {state === "needs_auth" && message}
          {state === "accepted" && message}
          {state === "error" && message}
        </div>

        {state === "needs_auth" && (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg border border-pink-200 text-pink-600 text-sm font-semibold hover:bg-pink-50"
            >
              Create account
            </Link>
          </div>
        )}

        {state === "error" && (
          <Link
            href="/"
            className="inline-flex px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Go home
          </Link>
        )}
      </div>
    </div>
  );
}
