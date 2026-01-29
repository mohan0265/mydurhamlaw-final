// src/pages/api/billing/send-parent-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

/**
 * Send Parent Payment Email
 *
 * POST /api/billing/send-parent-email
 * Body: { parentEmail: string, parentName: string, paymentLink: string, plan: string }
 *
 * Sends a nicely formatted email to the parent with payment link and details
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { parentEmail, parentName, paymentLink, plan } = req.body;

    if (!parentEmail || !paymentLink || !plan) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const planNames: Record<string, string> = {
      core_monthly: "Core Plan (£13.99/month)",
      core_annual: "Core Plan (£119/year)",
      pro_monthly: "Pro Plan (£24.99/month)",
      pro_annual: "Pro Plan (£199/year)",
    };

    const planName = planNames[plan] || "Subscription Plan";

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Caseway</h1>
      <p style="margin: 10px 0 0 0;">Law Student Support</p>
    </div>
    
    <div class="content">
      <p>Dear ${parentName || "Parent/Guardian"},</p>
      
      <p>Your child, a law student at Durham University (${user.email}), has been using <strong>Caseway</strong> and would like to continue with a paid subscription.</p>
      
      <p>Caseway helps students:</p>
      <ul>
        <li>✓ Understand complex legal concepts with AI assistance</li>
        <li>✓ Manage assignments and track deadlines efficiently</li>
        <li>✓ Prepare for exams with personalized study guidance</li>
        <li>✓ Stay connected with family through our "Always With You" feature</li>
      </ul>
      
      <div class="info-box">
        <strong>📋 Subscription Request:</strong><br>
        Plan: ${planName}<br>
        Billing: Starts immediately (no additional trial needed)<br>
        Cancel: Anytime through account settings
      </div>
      
      <p>Your child has found Caseway helpful and would like your support to continue using the paid features. You can securely complete the payment below:</p>
      
      <div style="text-align: center;">
        <a href="${paymentLink}" class="button">Complete Secure Payment</a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link: ${paymentLink}</p>
      
      <p><strong>🔒 Payment Security:</strong></p>
      <ul style="font-size: 14px;">
        <li>This payment link is valid for 7 days</li>
        <li>It can only be used once</li>
        <li>Payment is processed securely by Stripe</li>
        <li>We never see your card details</li>
      </ul>
      
      <div class="info-box">
        <strong>✅ Academic Integrity:</strong> Caseway is built to enhance learning, not replace it. We encourage ethical use of AI to support understanding and study skills.
      </div>
      
      <p>If you have any questions, please contact us at <a href="mailto:support@casewaylaw.ai">support@casewaylaw.ai</a></p>
      
      <p>Thank you for supporting your child's legal education!</p>
      
      <p>Best regards,<br>
      <strong>The Caseway Team</strong></p>
    </div>
    
    <div class="footer">
      <p>Caseway - Learn law. Write law. Speak law.</p>
      <p>Independent platform — not affiliated with Durham University.</p>
      <p>This email was sent because ${user.email} requested payment assistance.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
Dear ${parentName || "Parent/Guardian"},

Your child (${user.email}), a law student at Durham University, has been using Caseway and would like to continue with a paid subscription.

After trying the free version, they've found it helpful for:
- Understanding complex legal concepts
- Managing assignments and deadlines
- Exam preparation
- Staying connected with family

Subscription Request:
- Plan: ${planName}
- Billing: Starts immediately
- Cancel: Anytime

Please use this secure link to complete the payment:
${paymentLink}

(Link valid for 7 days, single-use only)

Questions? Contact support@casewaylaw.ai

Thank you for supporting your child's education!

The Caseway Team
    `;

    // Send email via Resend
    const { resend } = await import("@/lib/email/resend");

    if (!resend) {
      return res.status(500).json({
        error: "Email service not configured",
        message: "RESEND_API_KEY is missing",
      });
    }

    try {
      const emailResult = await resend.emails.send({
        from: "Caseway <support@casewaylaw.ai>",
        to: parentEmail,
        replyTo: "support@casewaylaw.ai",
        subject: `Payment Request from Your Child - Caseway`,
        html: emailHtml,
        text: emailText,
      });

      console.log("[Parent Email] Email sent successfully:", {
        to: parentEmail,
        emailId: emailResult.data?.id,
        studentEmail: user.email,
      });

      return res.status(200).json({
        success: true,
        message: "Email sent successfully",
        emailId: emailResult.data?.id,
      });
    } catch (emailError: any) {
      console.error("[Parent Email] Resend error:", emailError);
      return res.status(500).json({
        error: "Failed to send email",
        message: emailError.message || "Email service error",
      });
    }
  } catch (error: any) {
    console.error("[Send Parent Email] Error:", error);
    return res.status(500).json({
      error: "Failed to send email",
      message: error.message,
    });
  }
}
