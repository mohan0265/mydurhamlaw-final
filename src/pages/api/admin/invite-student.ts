import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac, randomBytes } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const COOKIE_NAME = 'admin_session';

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac('sha256', adminPass).update(adminUser).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin auth
  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { email, displayName, yearGroup, trialDays = 14 } = req.body;

  if (!email || !displayName || !yearGroup) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // 1. Check if email already has a pending invite or existing account
    const { data: existingInvites } = await adminClient
      .from('student_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending');

    if (existingInvites && existingInvites.length > 0) {
      return res.status(400).json({ 
        error: 'This email already has a pending invitation',
        inviteId: existingInvites[0].id
      });
    }

    // Check if user already exists
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 2. Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex');
    
    // 3. Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Insert invitation
    const { data: invitation, error: insertError } = await adminClient
      .from('student_invitations')
      .insert({
        email,
        display_name: displayName,
        year_group: yearGroup,
        invited_by: process.env.ADMIN_USERNAME || 'admin',
        invite_token: inviteToken,
        status: 'pending',
        trial_days: trialDays,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/accept?token=${inviteToken}`;

    // 6. Send invite email (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        await sendInviteEmail(email, displayName, inviteUrl, expiresAt, trialDays);
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({
      success: true,
      inviteId: invitation.id,
      inviteUrl,
      email,
      expiresAt: expiresAt.toISOString(),
      emailSent: !!process.env.RESEND_API_KEY,
    });

  } catch (error: any) {
    console.error('Invite error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create invitation' });
  }
}

async function sendInviteEmail(
  email: string,
  displayName: string,
  inviteUrl: string,
  expiresAt: Date,
  trialDays: number
) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px;">MyDurhamLaw</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Legal Eagle Companion</p>
  </div>
  
  <div style="padding: 40px 30px; background: white;">
    <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${displayName}! 👋</h2>
    
    <p style="color: #555; line-height: 1.8; font-size: 16px;">
      You've been invited to try <strong>MyDurhamLaw</strong> – your AI-powered study companion 
      designed specifically for Durham Law students.
    </p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0;">
      <p style="margin: 0 0 15px 0; color: #555; font-size: 15px;">
        <strong style="color: #667eea;">✨ Your ${trialDays}-day trial includes:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 2;">
        <li>AI assignment assistant (Durmah)</li>
        <li>Year-at-a-Glance calendar</li>
        <li>Exam preparation tools</li>
        <li>Always With You (AWY) widget</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${inviteUrl}" 
         style="display: inline-block; background: #667eea; color: white; 
                padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
        Accept Invite & Sign In with Google
      </a>
    </div>
    
    <p style="color: #999; font-size: 13px; text-align: center; margin: 30px 0 0 0;">
      This invite expires on ${expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      Sent to ${email} • MyDurhamLaw • Durham University Law Students
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${displayName}!

You've been invited to try MyDurhamLaw - your AI-powered study companion for Durham Law students.

Your ${trialDays}-day trial includes:
- AI assignment assistant (Durmah)
- Year-at-a-Glance calendar
- Exam preparation tools
- Always With You (AWY) widget

Accept your invite:
${inviteUrl}

This invite expires on ${expiresAt.toLocaleDateString('en-GB')}.

---
MyDurhamLaw • Durham University Law Students
  `;

  await resend.emails.send({
    from: 'MyDurhamLaw <noreply@mydurhamlaw.com>',
    to: email,
    subject: "You're invited to MyDurhamLaw Trial! 🎓",
    html: htmlContent,
    text: textContent,
  });
}
