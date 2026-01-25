import type { NextApiRequest, NextApiResponse } from 'next';
import { resend } from '@/lib/email/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, role, year } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Determine launch status for context
    const isLaunchEnabled = process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === 'true';

    if (!resend) {
        console.warn('LNAT Waitlist: Resend not configured. Logging submission:', { name, email, role, year });
        return res.status(200).json({ ok: true, message: 'Waitlist entry recorded (Mock Mode)' });
    }

    await resend.emails.send({
      from: 'MyDurhamLaw <noreply@mydurhamlaw.com>',
      to: 'support@mydurhamlaw.com',
      subject: `LNAT Waitlist: ${name} (${role})`,
      html: `
        <h2>New LNAT Waitlist Signup</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Intended Year:</strong> ${year || 'Not specified'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Context:</strong> Launch Enabled = ${isLaunchEnabled}</p>
      `
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('LNAT Waitlist Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
