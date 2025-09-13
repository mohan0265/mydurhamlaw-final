import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase/client'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    })
  }

  try {
    const { name, email, subject, message } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, subject, message'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
    }

    // Validate API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@colonaive.ai'
    
    // Create HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            COLONAiVE™
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
            New Contact Form Message
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              ${subject}
            </h2>
            
            <div style="margin: 20px 0;">
              <div style="display: flex; margin-bottom: 15px;">
                <strong style="color: #667eea; width: 100px; display: inline-block;">From:</strong>
                <span style="color: #333;">${name}</span>
              </div>
              <div style="display: flex; margin-bottom: 15px;">
                <strong style="color: #667eea; width: 100px; display: inline-block;">Email:</strong>
                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
              </div>
              <div style="display: flex; margin-bottom: 20px;">
                <strong style="color: #667eea; width: 100px; display: inline-block;">Date:</strong>
                <span style="color: #333;">${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Message:</h3>
              <p style="color: #555; line-height: 1.6; white-space: pre-wrap; margin-bottom: 0;">${message}</p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 6px; border: 1px solid #bbdefb;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
              Reply directly to <a href="mailto:${email}" style="color: #1565c0;">${email}</a> to continue the conversation.
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">COLONAiVE™ - AI-Powered Colorectal Health Platform</p>
          <p style="margin: 5px 0 0 0; color: #aaa;">This message was sent from the contact form at colonaive.ai</p>
        </div>
      </div>
    `

    console.log('Attempting to send email with Resend...')
    console.log('From:', fromEmail)
    console.log('To: info@colonaive.ai')
    console.log('Subject:', `New Contact Form Message from COLONAiVE Website - ${subject}`)

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: 'info@colonaive.ai',
      subject: `New Contact Form Message from COLONAiVE Website - ${subject}`,
      html: htmlContent,
      // Also include plain text version
      text: `
New Contact Form Message from COLONAiVE Website

From: ${name}
Email: ${email}
Subject: ${subject}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
Please respond to this inquiry by replying directly to ${email}.
      `.trim()
    })

    console.log('Resend email result:', emailResult)

    // Save to database (keeping existing functionality)
    try {
      if (supabase) {
        const { error: dbError } = await supabase
          .from('contact_messages')
          .insert([{
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            status: 'new'
          }])

        if (dbError) {
          console.error('Database error (non-critical):', dbError)
          // Don't fail the request if database save fails, as long as email was sent
        }
      } else {
        console.warn('Database save skipped: Supabase client not available')
      }
    } catch (dbError) {
      console.error('Database save failed (non-critical):', dbError)
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Contact message sent successfully',
      emailId: emailResult.data?.id
    })

  } catch (error: any) {
    console.error('Contact form API error:', error)
    
    // Log specific error details for debugging
    if (error.response) {
      console.error('Resend API response error:', error.response.data)
    }
    if (error.message) {
      console.error('Error message:', error.message)
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to send contact message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}