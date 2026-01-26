// src/pages/api/contact.ts
// Env vars: RESEND_API_KEY (required), CONTACT_TO, CONTACT_FROM
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY || '';
const resend = resendKey ? new Resend(resendKey) : null;

const FALLBACK_TO = 'admin@saversmed.com';
const FALLBACK_FROM = 'onboarding@resend.dev';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = (req.body || {}) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, message',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (!resend) {
      return res.status(501).json({
        success: false,
        error:
          'Email transport not configured. Set RESEND_API_KEY (and CONTACT_FROM with a verified/allowed sender).',
      });
    }

    const to = process.env.CONTACT_TO || FALLBACK_TO;
    const from = process.env.CONTACT_FROM || FALLBACK_FROM;
    const safeSubject = (subject || 'New enquiry from MyDurhamLaw').slice(0, 200);

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6; max-width:640px; margin:auto">
        <div style="background:linear-gradient(90deg,#6d28d9,#4338ca); color:#fff; padding:18px 20px; border-radius:10px 10px 0 0">
          <h1 style="margin:0; font-size:20px;">MyDurhamLaw - New Contact Form Message</h1>
        </div>
        <div style="border:1px solid #e5e7eb; border-top:0; padding:20px;">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
          <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
          <p style="margin:0 0 6px 0;"><strong>Message:</strong></p>
          <div style="white-space:pre-wrap; border:1px solid #e5e7eb; background:#fafafa; padding:12px; border-radius:8px;">
            ${escapeHtml(message)}
          </div>
        </div>
        <div style="color:#6b7280; font-size:12px; text-align:center; margin-top:10px">
          Sent from the contact form on mydurhamlaw.com
        </div>
      </div>
    `;

    const payload: any = {
      from,
      to,
      replyTo: email,
      subject: `MyDurhamLaw - ${safeSubject}`,
      html,
      text: stripHtml(`${name} <${email}> wrote:\n\n${message}`),
    };

    const result = await resend.emails.send(payload);

    try {
      const mod = await import('@/lib/server/supabaseAdmin').catch(() => null as any);
      const supabaseAdmin = mod?.supabaseAdmin ?? null;
      if (supabaseAdmin) {
        await supabaseAdmin.from('contact_messages').insert({
          name: name.trim(),
          email: email.trim(),
          subject: safeSubject.trim(),
          message: String(message || '').trim(),
          status: 'new',
          provider_id: (result as any)?.data?.id ?? null,
        });
      }
    } catch (dbErr) {
      console.warn('[contact] skipped DB save:', dbErr);
    }

    return res.status(200).json({ success: true, id: (result as any)?.data?.id || null });
  } catch (err: any) {
    console.error('[contact] fatal:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(s: string) {
  return String(s).replace(/<[^>]+>/g, '');
}