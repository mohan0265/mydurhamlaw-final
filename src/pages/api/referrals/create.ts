import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { resend } from '@/lib/email/resend';
import { randomBytes } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { invites } = req.body; // Array of { email, name }
  
  if (!invites || !Array.isArray(invites) || invites.length === 0) {
    return res.status(400).json({ error: 'Invites list required' });
  }

  if (invites.length > 10) {
    return res.status(400).json({ error: 'Max 10 invites per request' });
  }

  const results = [];
  
  // Rate Limit Check (Simple count for MVP)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const { count, error: countError } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', user.id)
    .gte('invited_at', today.toISOString());

  if ((count || 0) + invites.length > 10) {
     return res.status(429).json({ error: 'Daily invite limit reached (10/day).' });
  }

  // Process Invites
  for (const invite of invites) {
      const email = invite.email?.trim().toLowerCase();
      const name = invite.name?.trim();

      if (!email.endsWith('@durham.ac.uk')) {
          results.push({ email, status: 'invalid_domain' });
          continue;
      }
      
      if (email === user.email?.toLowerCase()) {
         results.push({ email, status: 'self_referral_blocked' });
         continue;
      }

      // Generate Token
      const token = randomBytes(16).toString('hex');

      // Optimistic Insert
      const { error } = await supabase
        .from('referrals')
        .insert({
            referrer_user_id: user.id,
            referred_email: email,
            referred_email_normalized: email,
            referred_name: name,
            invite_token: token,
            status: 'invited'
        });

      if (error) {
          if (error.code === '23505') { // Unique violation
              results.push({ email, status: 'already_invited' });
          } else {
              console.error('Referral Insert Error:', error);
              results.push({ email, status: 'error' });
          }
      } else {
          // Send Email
          if (resend) {
            try {
                await resend.emails.send({
                    from: 'MyDurhamLaw <invites@mydurhamlaw.com>', // Or your verified domain
                    to: email,
                    subject: "You've been invited to MyDurhamLaw",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>You've been invited!</h2>
                            <p>${user.user_metadata?.first_name || 'A fellow law student'} has invited you to join MyDurhamLaw.</p>
                            <p><strong>Strictly for Durham Law students.</strong></p>
                            <p>Get a <strong>14-day Pro Trial</strong> (access to Durmah Voice, Lecture Signals, and more) when you join securely.</p>
                            <br/>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/redeem?token=${token}" style="background-color: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Accept Invite & Start Trial
                            </a>
                            <br/><br/>
                            <p style="font-size: 12px; color: #888;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Stop receiving invites</a>
                            </p>
                        </div>
                    `
                });
            } catch (e) {
                console.error('Email send failed', e);
                // Don't fail the request, just log
            }
          }
          results.push({ email, status: 'invited' });
      }
  }

  return res.status(200).json({ results });
}
