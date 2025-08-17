# Email Setup for Contact Form

## Overview
The contact form now uses **Resend** to send emails to `info@colonaive.ai` when users submit contact messages.

## Configuration Required

### 1. Environment Variables
Add these to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=contact@colonaive.ai
```

### 2. Resend Setup
1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Add and verify your domain (`colonaive.ai`)
3. Create an API key in the Resend dashboard
4. Set up the verified sender email (`contact@colonaive.ai`)

### 3. Domain Verification
Make sure your domain is verified in Resend before sending emails. The `RESEND_FROM_EMAIL` must use a verified domain.

## How It Works

1. **User submits contact form** → `/colonaive-demo` or any page with ContactForm component
2. **Frontend calls API** → `POST /api/contact`
3. **API sends email via Resend** → Beautiful HTML email to `info@colonaive.ai`
4. **API saves to database** → Contact message stored in `contact_messages` table
5. **User sees success** → "Email Sent Successfully!" message

## Email Template Features

✅ **Professional Design**: Branded email template with COLONAiVE colors  
✅ **Complete Information**: Name, email, subject, message, and timestamp  
✅ **Action Prompts**: Clear instructions for follow-up  
✅ **Plain Text Fallback**: Both HTML and text versions  
✅ **Reply-To Functionality**: Easy to reply directly to the sender  

## Testing

### Local Testing
1. Make sure you have valid environment variables in `.env.local`
2. Start the dev server: `npm run dev`
3. Go to `/colonaive-demo`
4. Fill out and submit the contact form
5. Check the console logs for API responses
6. Check `info@colonaive.ai` for the email

### Production Testing
1. Deploy with proper environment variables
2. Submit a test message
3. Verify email arrives at `info@colonaive.ai`
4. Check admin dashboard at `/admin/SuperAdminDashboard` to see message logged

## Error Handling

The system includes comprehensive error handling:

- **Validation**: Required fields and email format validation
- **API Key Missing**: Clear error message if Resend not configured
- **Network Issues**: Graceful fallback with user-friendly messages
- **Database Failures**: Email still sent even if database save fails
- **Development Mode**: Detailed error messages for debugging

## Troubleshooting

### Common Issues

1. **"Email service configuration error"**
   - Check that `RESEND_API_KEY` is set in your environment variables
   - Verify the API key is valid in your Resend dashboard

2. **"Failed to send contact message"**
   - Verify your domain is verified in Resend
   - Check that `RESEND_FROM_EMAIL` uses a verified domain
   - Check Resend logs for delivery issues

3. **Form submits but no email received**
   - Check spam folder at `info@colonaive.ai`
   - Verify the Resend API logs in your dashboard
   - Check server console logs for errors

### Debug Mode
In development mode, detailed error messages are shown. Check the browser console and server logs for specific error details.

## Production Considerations

- Make sure to set all environment variables in your deployment platform
- Monitor Resend usage and limits
- Set up email monitoring and alerts
- Consider adding rate limiting to prevent spam
- Implement honeypot fields for additional spam protection

## Files Modified

- `package.json` - Added Resend dependency
- `.env.example` - Added Resend configuration variables
- `src/pages/api/contact.ts` - New API route for email sending
- `src/components/ContactForm.tsx` - Updated to use API route
- Email template integrated with professional HTML design

The contact form is now fully functional and will send emails to `info@colonaive.ai`!