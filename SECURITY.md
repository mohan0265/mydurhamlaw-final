# Security Policy - MyDurhamLaw

We take the security and privacy of our users' data seriously. This document outlines our comprehensive security practices and protocols.

## 🔐 Authentication & Authorization

### Authentication System
- **Provider**: Supabase Auth with email/password authentication
- **Session Management**: JWT tokens with automatic refresh
- **Email Verification**: Required for all new accounts
- **Password Requirements**: Minimum 6 characters (enforced client and server-side)

### Role-Based Access Control (RBAC)
MyDurhamLaw implements a year-based access control system:

- **Foundation Students** (`foundation`): Access to foundational legal content
- **Year 1 Students** (`year1`): First-year curriculum and resources
- **Year 2 Students** (`year2`): Advanced topics and case studies
- **Year 3 Students** (`year3`): Final year content and career preparation

Each role has specific dashboard routes and content access permissions enforced through:
- Database Row-Level Security (RLS) policies
- Client-side route protection
- API endpoint authorization

## 🛡️ Database Security

### Supabase Row-Level Security (RLS)
All database tables enforce strict RLS policies ensuring:
- Users can only access their own data
- No cross-user data leakage
- Automatic user context filtering

**Protected Tables:**
- `profiles` - User profile information
- `study_tasks` - Personal study tasks and schedules
- `memory_notes` - Private memory journal entries
- `assignments` - User-generated assignments
- `ai_history` - Chat history with AI assistant
- `wellbeing_entries` - Mental health and wellbeing data
- `voice_messages` - Voice chat transcripts and audio

### Data Encryption
- **At Rest**: All data encrypted in Supabase PostgreSQL
- **In Transit**: HTTPS/TLS 1.3 for all API communications
- **Sensitive Data**: Additional AES-256-GCM encryption for:
  - Memory journal entries
  - Voice transcripts
  - Personal notes

## 🤖 AI Integration Security

### GPT-4o API Protection
- **Server-Side Only**: All OpenAI API calls handled server-side
- **No Client Exposure**: API keys never sent to client
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: IP-based throttling on AI endpoints

### Voice Integration Safeguards
- **Audio Processing**: Streamed server-side transcription
- **Data Retention**: Voice data automatically deleted after processing
- **Permission Controls**: Explicit user consent for microphone access
- **Content Filtering**: AI responses filtered for appropriate content

### AI Data Handling
- **No Training Data**: User conversations never used for model training
- **Context Isolation**: Each session maintains separate context
- **Response Sanitization**: Output filtered for sensitive information
- **Audit Logging**: All AI interactions logged for security monitoring

## 🌐 Web Application Security

### HTTP Security Headers
Comprehensive security headers implemented in `next.config.js`:

```javascript
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; media-src 'self';",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### Input Validation & Sanitization
- **XSS Prevention**: All user inputs sanitized
- **SQL Injection**: Parameterized queries only
- **CSRF Protection**: Built-in Next.js CSRF protection
- **File Upload Security**: Strict file type and size validation

### Rate Limiting
Protection against abuse with configurable rate limits:
- **Authentication**: 5 attempts per 15 minutes
- **AI Requests**: 20 requests per minute per user
- **API Endpoints**: 100 requests per 15 minutes per IP
- **Voice Calls**: 10 requests per 5 minutes per user

## 🚀 Deployment Security

### Environment Variables
Secure environment configuration:
- **Production Keys**: Stored in deployment platform secrets
- **Development**: Local `.env.local` file (never committed)
- **API Keys**: Server-side only, never exposed to client
- **Database URLs**: Encrypted connection strings

### Netlify Deployment Hardening
- **HTTPS Enforcement**: All traffic redirected to HTTPS
- **Branch Protections**: Production branch requires review
- **Build Security**: Dependencies scanned for vulnerabilities
- **Domain Security**: DNS CAA records configured

### Monitoring & Alerting
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Real-time performance metrics
- **Security Events**: Automated alerts for suspicious activity
- **Audit Trails**: Complete access and modification logs

## 📱 Client-Side Security

### Browser Security
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **Local Storage**: Minimal sensitive data storage
- **Session Handling**: Automatic timeout and cleanup
- **Content Security**: CSP prevents code injection

### Privacy Protection
- **Data Minimization**: Only necessary data collected
- **User Consent**: Explicit consent for data processing
- **Right to Deletion**: User data deletion capabilities
- **Data Portability**: Export functionality for user data

## 🔍 Incident Response

### Vulnerability Reporting
If you discover a security vulnerability, please:
1. **Email**: security@durhamlaw.ai
2. **Do Not** disclose publicly until we've addressed the issue
3. **Include**: Detailed steps to reproduce the vulnerability
4. **Response Time**: We respond within 48 hours

### Security Incident Handling
1. **Immediate Response**: Contain and assess the incident
2. **User Notification**: Inform affected users within 72 hours
3. **Remediation**: Deploy fixes and security patches
4. **Post-Incident**: Conduct security review and improvements

## 📋 Compliance & Standards

### Data Protection
- **GDPR Compliance**: Full compliance with EU data protection regulations
- **CCPA Compliance**: California Consumer Privacy Act compliance
- **Data Processing**: Lawful basis for all data processing activities

### Security Standards
- **OWASP Top 10**: Protection against all OWASP vulnerabilities
- **Security Headers**: A+ rating on SecurityHeaders.com
- **SSL/TLS**: A+ rating on SSL Labs
- **Regular Audits**: Quarterly security assessments

### Academic Integrity
- **AI Ethics**: Transparent AI usage with clear guidelines
- **Academic Honesty**: Tools designed to support, not replace learning
- **Content Attribution**: Proper citation of AI-generated content
- **Plagiarism Prevention**: Built-in academic integrity safeguards

## 🔄 Regular Security Maintenance

### Updates & Patches
- **Dependency Updates**: Weekly automated security updates
- **Platform Updates**: Monthly Next.js and Supabase updates
- **Security Patches**: Immediate deployment of critical patches
- **Third-Party Audits**: Annual professional security assessments

### Security Reviews
- **Code Reviews**: All changes require security review
- **Penetration Testing**: Quarterly external security testing
- **Vulnerability Scanning**: Daily automated vulnerability scans
- **Security Training**: Regular team security awareness training

---

## 📞 Contact Information

**Security Team**: security@durhamlaw.ai  
**General Support**: support@durhamlaw.ai  
**Emergency Contact**: +44 (0) 191 334 2000

**Last Updated**: January 2025  
**Next Review**: April 2025

---

*This security policy is reviewed and updated quarterly to reflect current best practices and emerging threats. Users will be notified of any significant changes.*