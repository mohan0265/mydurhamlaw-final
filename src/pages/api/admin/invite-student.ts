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

    // 5. Build invite URL - use existing env var
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://mydurhamlaw.com';
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
    
    // Check for common issues
    const errorMessage = error.message || 'Failed to create invitation';
    
    // Handle missing table
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Database not configured. Please run the student_invitations migration.',
        details: 'Table student_invitations does not exist'
      });
    }
    
    // Handle constraint violations
    if (error.code === '23514') {
      return res.status(400).json({ 
        error: 'Invalid year group. Must be: foundation, year1, year2, or year3',
        details: errorMessage
      });
    }
    
    return res.status(500).json({ error: errorMessage });
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
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; color: #111827;">
  
  <!-- Header Banner with New Logo -->
  <div style="background-color: #ffffff; padding: 0; text-align: center; border-bottom: 1px solid #e5e7eb;">
    <img src="https://mydurhamlaw.com/images/MyDurhamLaw%20ImageGPT.png" alt="MyDurhamLaw - Legal Eagle Companion" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto;" />
  </div>
  
  <div style="padding: 40px 30px; background-color: #ffffff;">
    <h2 style="color: #4338ca; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Hi ${displayName}! 👋</h2>
    
    <p style="color: #374151; line-height: 1.8; font-size: 16px;">
      You've been invited to join <strong>MyDurhamLaw</strong> – the ultimate AI study companion used by top students to conquer their law degree.
    </p>

    <p style="color: #374151; line-height: 1.8; font-size: 16px;">
      Mastering the law isn't just about reading; it's about strategy. We've built the tools you need to handle your learning like a true <strong>Legal Eagle</strong>:
    </p>
    
    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
        ✨ Your ${trialDays}-Day Legal Eagle Access Includes:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
        <li style="margin-bottom: 10px;">
          <strong>🚀 Conquer Your Lectures:</strong> Upload Panopto recordings & slides for instant AI summaries, key case extraction, and deep-dive Q&A.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>🦉 Durmah AI Tutor:</strong> Your always-on study buddy for essay planning, problem questions, and doctrinal clarity.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>📅 Year-at-a-Glance:</strong> Visualise your entire academic year, deadline by deadline, so you never miss a beat.
        </li>
        <li>
          <strong>⚖️ Exam Mastery:</strong> Targeted revision tools to turn confusion into distinction-level confidence.
        </li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${inviteUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; 
                padding: 16px 40px; text-decoration: none; border-radius: 50px; 
                font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); transition: transform 0.2s;">
        Accept Invite & Start Conquering
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
      This exclusive invite link expires on ${expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Sent to ${email} • MyDurhamLaw • Excellence in Legal Education
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${displayName}!

You've been invited to join MyDurhamLaw – the ultimate AI study companion for conquering your law degree.

Mastering the law isn't just about reading; it's about strategy. Use MyDurhamLaw to handle your learning like a top Legal Eagle.

Your ${trialDays}-Day Access Includes:
* Conquer Your Lectures: AI analysis of Panopto recordings & slides.
* Durmah AI Tutor: Essay planning and doctrinal clarity.
* Year-at-a-Glance: Visualise every deadline.
* Exam Mastery: Targeted revision tools.

Accept your invite here:
${inviteUrl}

This invite expires on ${expiresAt.toLocaleDateString('en-GB')}.

---
MyDurhamLaw • Excellence in Legal Education
  `;

  await resend.emails.send({
    from: 'MyDurhamLaw <noreply@mydurhamlaw.com>',
    to: email,
    subject: "You're invited: Master your Law Degree with MyDurhamLaw 🎓",
    html: htmlContent,
    text: textContent,
  });
}
