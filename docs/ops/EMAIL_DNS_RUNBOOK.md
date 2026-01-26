# EMAIL_DNS_RUNBOOK.md

## 📧 Architecture Overview

- **Inbound mail (support@mydurhamlaw.com)**: Microsoft 365 / Exchange Online
- **Outbound transactional mail**: Resend (noreply@mydurhamlaw.com)
- **DNS host**: Netlify DNS (GoDaddy is only the registrar; Netlify nameservers are used)

---

## 🌐 Current DNS Records (Authoritative)

> [!CAUTION]
> **DO NOT DELETE** these records. They are critical for email delivery and site availability.

| Service | Type | Record | Value | Why |
|---------|------|--------|-------|-----|
| M365 | MX | `mydurhamlaw.com` | `mydurhamlaw-com.mail.protection.outlook.com` (0) | Routes incoming mail to Outlook |
| M365 | TXT | `mydurhamlaw.com` | `MS=ms74341718` | Proof of domain ownership for Microsoft |
| SPF (Global) | TXT | `mydurhamlaw.com` | `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all` | Authorizes both M365 and Resend (SES) |
| Resend | TXT | `resend._domainkey.mydurhamlaw.com` | (Managed in Netlify DNS) | DKIM signature for secure sending |
| Resend | TXT | `send.mydurhamlaw.com` | `v=spf1 include:amazonses.com ~all` | SPF for the Resend sending subdomain |
| DMARC | TXT | `_dmarc.mydurhamlaw.com` | `v=DMARC1; p=none;` | Anti-spoofing policy (monitor mode) |
| Routing | NETLIFY | `mydurhamlaw.com` | (Managed by Netlify) | Primary site domain |
| Routing | NETLIFY | `www.mydurhamlaw.com` | (Managed by Netlify) | WWW alias |
| Routing | NETLIFY | `app.mydurhamlaw.com` | (Managed by Netlify) | App subdomain |

---

## 🛠️ Troubleshooting “Not receiving email”

1. **Verify MX Records**: Ensure MX points to `.mail.protection.outlook.com`.
2. **Check Mailbox**: Confirm `support@mydurhamlaw.com` exists and is active in M365 Admin Center.
3. **Check DNS Source**: Ensure you are editing records in **Netlify DNS**, not GoDaddy (since NS point to Netlify).
4. **Resend Dashboard**: Check Resend logs to see if outbound emails are being blocked or bounced.
5. **SPF Alignment**: Ensure the root `mydurhamlaw.com` SPF record includes both `outlook.com` and `amazonses.com`.

---

## ✅ Verification Tests

1. Send mail from a personal Gmail/Outlook account to `support@mydurhamlaw.com` → Should arrive in M365 inbox.
2. Submit a test LNAT waitlist form → Should arrive in M365 inbox with `noreply@mydurhamlaw.com` as sender.
3. **Reply-To Check**: Hit 'Reply' on any transactional email → Should automatically target `support@mydurhamlaw.com`.

---

## 🔒 Security & Future

- **DMARC**: Once delivery is stable, consider changing `p=none` to `p=quarantine` or `p=reject`.
- **SPF**: Always combine includes into a single `v=spf1` record on the root domain to avoid multiple SPF record violations.

---

## 📬 Suggested Outlook Rule

**Purpose**: Move automated notifications to a focused folder.
1. Go to **Settings** → **Mail** → **Rules**.
2. **New rule**: "Sort LNAT Waitlist".
3. **Condition**: Subject includes "LNAT Waitlist".
4. **Action**: Move to folder "LNAT" (Create folder if needed).
5. **Save**.
