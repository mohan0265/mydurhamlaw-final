// src/components/billing/SharePaymentModal.tsx
import { useState } from "react";
import { X, Mail, Copy, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface SharePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  userId: string;
}

export default function SharePaymentModal({
  isOpen,
  onClose,
  plan,
  userId,
}: SharePaymentModalProps) {
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Email sending state
  const [parentEmail, setParentEmail] = useState("");
  const [parentName, setParentName] = useState("");

  const generateLink = async () => {
    if (paymentLink) return; // Already generated

    setGenerating(true);
    try {
      const res = await fetch("/api/billing/generate-parent-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentLink(data.link);
        setExpiresAt(data.expires);
      } else {
        toast.error(data.error || "Failed to generate link");
      }
    } catch (error) {
      toast.error("Failed to generate payment link");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!parentEmail || !paymentLink) return;

    setSending(true);
    try {
      const res = await fetch("/api/billing/send-parent-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail,
          parentName: parentName || "Parent/Guardian",
          paymentLink,
          plan,
        }),
      });

      if (res.ok) {
        toast.success(`Email sent to ${parentEmail}!`);
        onClose();
      } else {
        toast.error("Failed to send email");
      }
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLink) return;

    await navigator.clipboard.writeText(paymentLink);
    toast.success("Link copied to clipboard!");
  };

  const handleCopyMessage = async () => {
    if (!paymentLink) return;

    const message = `Hi! 👋

I've been using Caseway for my law studies at Durham University, and it's been really helpful for understanding complex legal concepts and managing my coursework.

I started with the free version, and now I'd like to continue with the paid subscription to access more features. However, I don't have a payment card yet.

Would you be able to help me with the subscription payment? Here's a secure payment link:

${paymentLink}

The link is valid for 7 days and you can cancel the subscription anytime if needed.

Thank you so much for your support! ❤️`;

    await navigator.clipboard.writeText(message);
    toast.success("Message copied! Ready to paste in WhatsApp");
  };

  const getPlanName = (plan: string) => {
    const plans: Record<string, string> = {
      core_monthly: "Core Plan (Monthly - £13.99/mo)",
      core_annual: "Core Plan (Annual - £119/yr)",
      pro_monthly: "Pro Plan (Monthly - £24.99/mo)",
      pro_annual: "Pro Plan (Annual - £199/yr)",
    };
    return plans[plan] || "Subscription Plan";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Share Payment Link
            </h2>
            <p className="text-sm text-gray-600">
              Let your parent pay for your subscription
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Selected Plan:</p>
            <p className="font-semibold text-gray-900">{getPlanName(plan)}</p>
            <p className="text-xs text-gray-500 mt-1">
              ✓ Includes 14-day free trial
            </p>
          </div>

          {/* Generate Link Button */}
          {!paymentLink && (
            <Button
              onClick={generateLink}
              disabled={generating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3"
            >
              {generating ? "Generating Link..." : "Generate Payment Link"}
            </Button>
          )}

          {/* Options after link generated */}
          {paymentLink && (
            <>
              {/* Link Display */}
              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Link Generated!
                    </p>
                    <p className="text-xs text-gray-600 break-all">
                      {paymentLink}
                    </p>
                    {expiresAt && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⏰ Expires: {new Date(expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 1: Send Email */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Option 1: Send Email
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  We'll send a professional email with payment details to your
                  parent
                </p>

                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Parent's email address"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Parent's name (optional)"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <Button
                    onClick={handleSendEmail}
                    disabled={!parentEmail || sending}
                    className="w-full bg-blue-600 text-white"
                  >
                    {sending ? "Sending..." : "Send Email to Parent"}
                  </Button>
                </div>
              </div>

              {/* Option 2: Copy Link */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Option 2: Share via WhatsApp/SMS
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Copy pre-written message or just the link
                </p>

                <div className="space-y-2">
                  <Button
                    onClick={handleCopyMessage}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Full Message (WhatsApp/SMS)
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link Only
                  </Button>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Important:</strong> Payment link is valid for 7
                  days and can only be used once. Your subscription will
                  activate immediately after your parent completes payment.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
