import React, { useState } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ModernSidebar from "@/components/layout/ModernSidebar";
import BackToHomeButton from "@/components/ui/BackToHomeButton";

type BillingProps = {
  subscription: any;
  invoices: any[];
  user: any;
};

export default function BillingPage({
  subscription,
  invoices,
  user,
}: BillingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ideally send auth token, but session cookie handles it for Next.js API
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to open portal");
        setLoading(false);
      }
    } catch (err) {
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel at the end of the period? You will retain access until then.",
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "period_end" }),
      });
      if (res.ok) {
        toast.success("Subscription cancelled (at period end).");
        router.reload();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to cancel");
      }
    } catch (err) {
      toast.error("Error cancelling subscription");
    } finally {
      setLoading(false);
    }
  };

  // Status Badge Logic
  const getStatusBadge = (status: string, graceUntil: string | null) => {
    if (status === "active" || status === "trialing") {
      return (
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {status}
        </span>
      );
    }
    if (status === "past_due") {
      if (graceUntil && new Date(graceUntil) > new Date()) {
        return (
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            Past Due (Grace Period)
          </span>
        );
      }
      return (
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          Past Due (Locked)
        </span>
      );
    }
    return (
      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
        {status || "No Plan"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Billing | Caseway</title>
      </Head>

      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-72"} lg:ml-0`}
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <BackToHomeButton />
            <h1 className="text-3xl font-bold text-slate-900">
              Billing & Subscription
            </h1>
          </div>

          <p className="text-slate-600 mb-8 pl-1">
            Manage your plan, payment methods, and invoices.
          </p>

          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Current Plan
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusBadge(
                    subscription?.status,
                    subscription?.grace_until,
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Next Billing / Expiry</p>
                <p className="text-lg font-medium text-slate-900">
                  {subscription?.current_period_end
                    ? format(
                        new Date(subscription.current_period_end),
                        "MMM d, yyyy",
                      )
                    : "-"}
                </p>
              </div>
            </div>

            {subscription?.grace_until &&
              new Date(subscription.grace_until) > new Date() && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-orange-800 text-sm">
                  <strong>Payment Failed:</strong> You have a grace period until{" "}
                  {format(new Date(subscription.grace_until), "MMM d")}. Please
                  update your payment method to avoid losing access.
                </div>
              )}

            <div className="flex gap-4">
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Manage Payment Details"}
              </button>
              {["active", "trialing", "past_due"].includes(
                subscription?.status,
              ) &&
                !subscription?.cancel_at_period_end && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    Cancel Subscription
                  </button>
                )}
              {subscription?.cancel_at_period_end && (
                <span className="px-4 py-2 text-amber-600 bg-amber-50 rounded-lg text-sm flex items-center">
                  Cancels at end of period
                </span>
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Invoice History
              </h3>
            </div>
            {invoices && invoices.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-slate-700">
                        {format(new Date(inv.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {(inv.amount_paid / 100).toLocaleString("en-GB", {
                          style: "currency",
                          currency: inv.currency || "gbp",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`capitalize px-2 py-1 rounded-full text-xs font-semibold ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.hosted_invoice_url && (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400">
                No invoices found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Fetch Subscription
  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", session.user.id)
    .in("status", ["active", "trialing", "past_due", "canceled", "unpaid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch Invoices
  const { data: invoices } = await supabase
    .from("billing_invoices")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    props: {
      user: session.user,
      subscription: subscription || null,
      invoices: invoices || [],
    },
  };
};
