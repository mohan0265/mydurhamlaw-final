import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/lib/supabase/AuthContext";
import { Loader2, CheckCircle, AlertOctagon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RedeemPage() {
  const router = useRouter();
  const { token } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [redeemState, setRedeemState] = useState<
    "verifying" | "success" | "error"
  >("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    if (!token) {
      setRedeemState("error");
      setMessage("Invalid invite link (missing token).");
      return;
    }

    if (!user) {
      // Redirect to Signup with return URL
      // Using returnUrl param or standard Next.js return pattern
      // Here assuming standard login page handles 'returnUrl' or we simply redirect back here
      router.push(`/signup?returnUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Attempt Redeem
    verifyAndRedeem();
  }, [router.isReady, authLoading, user, token]);

  const verifyAndRedeem = async () => {
    try {
      const res = await fetch("/api/referrals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRedeemState("success");
        // Optional: Auto redirect after few seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setRedeemState("error");
        setMessage(data.error || "Failed to redeem invite.");
      }
    } catch (e) {
      setRedeemState("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (authLoading || redeemState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            Verifying your invite...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Head>
        <title>Redeem Invite | Caseway</title>
      </Head>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {redeemState === "success" ? (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invite Accepted!
            </h1>
            <p className="text-gray-600 mb-8">
              Your <strong>14-day Full Access Trial</strong> has been activated.
              Welcome to the full Caseway experience.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
            >
              Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-4">Redirecting shortly...</p>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invite Error
            </h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
