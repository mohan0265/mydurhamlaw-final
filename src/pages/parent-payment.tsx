// src/pages/parent-payment.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle,
  AlertCircle,
  Heart,
  CreditCard,
  Clock,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ParentPaymentPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      validatePaymentLink();
    }
  }, [token]);

  const validatePaymentLink = async () => {
    try {
      const res = await fetch(
        `/api/billing/validate-parent-link?token=${token}`,
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid or expired payment link");
        setLoading(false);
        return;
      }

      setLinkData(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to validate payment link");
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Create Stripe checkout session for parent
      const res = await fetch("/api/stripe/parent-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: token,
          plan: linkData.plan,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create payment session");
        setProcessing(false);
      }
    } catch (error) {
      toast.error("Payment error. Please try again.");
      setProcessing(false);
    }
  };

  const getPlanDetails = (plan: string) => {
    const plans: Record<
      string,
      { name: string; price: string; period: string }
    > = {
      core_monthly: { name: "Core Plan", price: "£13.99", period: "month" },
      core_annual: { name: "Core Plan", price: "£119", period: "year" },
      pro_monthly: { name: "Pro Plan", price: "£24.99", period: "month" },
      pro_annual: { name: "Pro Plan", price: "£199", period: "year" },
    };
    return plans[plan] || { name: "Plan", price: "£0", period: "month" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating payment link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Compare Plans - Caseway</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Payment Link
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Possible reasons:</strong>
              </p>
              <ul className="text-left space-y-1">
                <li>• Link has expired (valid for 7 days)</li>
                <li>• Link has already been used</li>
                <li>• Invalid or tampered link</li>
              </ul>
            </div>
            <Button onClick={() => router.push("/")} className="mt-6 w-full">
              Go to Homepage
            </Button>
          </Card>
        </div>
      </>
    );
  }

  const planDetails = getPlanDetails(linkData?.plan || "");

  return (
    <>
      <Head>
        <title>Complete Payment - MyDurhamLaw</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="p-6 border-b bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <Logo variant="dark" size="md" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-pink-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Parent Payment for MyDurhamLaw
            </h1>
            <p className="text-lg text-gray-600">
              Complete payment on behalf of your child's subscription
            </p>
          </div>

          <Card className="p-8 mb-6">
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Durham University Student
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {linkData?.studentEmail}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This payment will be applied to the above student's account
                </p>
              </div>

              {/* Plan Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Subscription Details
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold text-gray-900">
                      {planDetails.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900">
                      {planDetails.price}/{planDetails.period}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Period:</span>
                    <span className="font-semibold text-green-600">
                      14 days free
                    </span>
                  </div>
                </div>
              </div>

              {/* Link Expiry */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-amber-800">
                  <strong>Link expires:</strong>{" "}
                  {new Date(linkData?.expiresAt).toLocaleString()}
                </div>
              </div>

              {/* What Happens Next */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  What happens next?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You'll be redirected to secure Stripe payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>14-day free trial starts immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Student gains full access to MyDurhamLaw</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You can cancel anytime before trial ends</span>
                  </li>
                </ul>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all text-lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Redirecting to Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    <span>Proceed to Secure Payment</span>
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Payments are processed securely by Stripe. We never see your
                card details.
              </p>
            </div>
          </Card>

          {/* Trust Badge */}
          <div className="text-center text-sm text-gray-500">
            <p>🔒 Secure payment • 🛡️ Student verified • ❤️ Parent approved</p>
          </div>
        </div>
      </div>
    </>
  );
}
