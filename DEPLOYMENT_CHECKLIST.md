
# MyDurhamLaw - Billing & AWY Deployment Checklist

## 🚀 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run `src/sql/billing_schema.sql` in Supabase SQL editor
- [ ] Run `src/sql/enhanced_awy_schema.sql` in Supabase SQL editor
- [ ] Verify all tables are created successfully
- [ ] Check RLS policies are enabled and working
- [ ] Test database functions with sample data

### 2. Environment Variables
- [ ] Update `.env.local` with all required variables
- [ ] Set `NEXT_PUBLIC_ENABLE_BILLING=true`
- [ ] Set `NEXT_PUBLIC_ENABLE_AWY=true`
- [ ] Configure Stripe keys (when ready for payments)
- [ ] Verify Supabase connection strings

### 3. Code Integration
- [ ] Import new components in existing pages
- [ ] Add TrialBanner to main dashboard
- [ ] Replace existing AWY widget with EnhancedAWYWidget
- [ ] Add billing navigation links
- [ ] Test all new API endpoints

### 4. Testing
- [ ] Test user registration triggers trial creation
- [ ] Test subscription status display
- [ ] Test AWY connection creation and management
- [ ] Test real-time presence updates
- [ ] Test interaction sending (waves, hearts, etc.)
- [ ] Test notification system
- [ ] Verify usage tracking works

## 🔧 Production Deployment Steps

### 1. Database Migration
```sql
-- 1. Backup existing data
pg_dump your_database > backup_before_billing_awy.sql

-- 2. Run new schemas
\i src/sql/billing_schema.sql
\i src/sql/enhanced_awy_schema.sql

-- 3. Migrate existing AWY data (if any)
-- See migration script in implementation guide
```

### 2. Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_ENABLE_AWY=true
NEXT_PUBLIC_TRIAL_DAYS=14

# Stripe production keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Build and Deploy
```bash
# Install dependencies
npm install

# Build application
npm run build

# Deploy to Netlify/Vercel
# Ensure all environment variables are set in deployment platform
```

## 🧪 Post-Deployment Testing

### 1. User Flow Testing
- [ ] New user registration creates trial subscription
- [ ] Trial banner appears with correct days remaining
- [ ] Subscription status shows correctly
- [ ] AWY widget loads and functions
- [ ] Pricing page displays correctly
- [ ] Billing dashboard is accessible

### 2. API Testing
```bash
# Test subscription API
curl -X GET https://yourdomain.com/api/billing/subscription

# Test AWY connections API
curl -X GET https://yourdomain.com/api/awy/connections

# Test presence API
curl -X POST https://yourdomain.com/api/awy/presence \
  -H "Content-Type: application/json" \
  -d '{"is_online": true}'
```

### 3. Database Verification
```sql
-- Check subscription plans are loaded
SELECT * FROM subscription_plans;

-- Check trial subscriptions are being created
SELECT * FROM user_subscriptions WHERE status = 'trial';

-- Check AWY tables are working
SELECT * FROM awy_connections LIMIT 5;
```

## 🚨 Rollback Plan

If issues occur, follow this rollback procedure:

### 1. Immediate Rollback
```bash
# Disable new features via environment variables
NEXT_PUBLIC_ENABLE_BILLING=false
NEXT_PUBLIC_ENABLE_AWY=false

# Redeploy with previous version
git checkout previous-stable-commit
npm run build && deploy
```

### 2. Database Rollback
```sql
-- Drop new tables if needed (CAUTION: This will lose data)
DROP TABLE IF EXISTS billing_events CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

DROP TABLE IF EXISTS awy_notifications CASCADE;
DROP TABLE IF EXISTS awy_call_sessions CASCADE;
DROP TABLE IF EXISTS awy_interactions CASCADE;
DROP TABLE IF EXISTS awy_presence CASCADE;
DROP TABLE IF EXISTS awy_connections CASCADE;

-- Restore from backup
psql your_database < backup_before_billing_awy.sql
```

## 📊 Monitoring & Alerts

### 1. Key Metrics to Monitor
- [ ] Trial conversion rate
- [ ] Subscription churn rate
- [ ] AWY connection creation rate
- [ ] API error rates
- [ ] Database performance

### 2. Set Up Alerts
- [ ] High API error rates (>5%)
- [ ] Database connection issues
- [ ] Failed subscription creations
- [ ] AWY real-time connection failures

### 3. Logging
- [ ] Enable detailed API logging
- [ ] Monitor Supabase logs
- [ ] Set up error tracking (Sentry)
- [ ] Track user engagement metrics

## 🔐 Security Verification

### 1. RLS Policies
- [ ] Users can only see their own subscription data
- [ ] AWY connections respect privacy settings
- [ ] No data leakage between users
- [ ] Service role access is properly restricted

### 2. API Security
- [ ] All endpoints require authentication
- [ ] Input validation is working
- [ ] Rate limiting is in place
- [ ] No sensitive data in error messages

### 3. Data Protection
- [ ] Personal data is encrypted
- [ ] GDPR compliance maintained
- [ ] Data retention policies applied
- [ ] Audit trails are working

## 📈 Performance Optimization

### 1. Database Optimization
- [ ] Indexes are created and used
- [ ] Query performance is acceptable
- [ ] Connection pooling is configured
- [ ] Real-time subscriptions are efficient

### 2. Frontend Optimization
- [ ] Components are properly memoized
- [ ] API calls are debounced
- [ ] Loading states are implemented
- [ ] Error boundaries are in place

### 3. Caching Strategy
- [ ] Subscription data is cached appropriately
- [ ] Presence data has reasonable TTL
- [ ] Static assets are cached
- [ ] API responses are cached where appropriate

## 🎯 Success Criteria

The deployment is considered successful when:

- [ ] All new users automatically get trial subscriptions
- [ ] Trial banners appear at appropriate times
- [ ] AWY connections can be created and managed
- [ ] Real-time presence updates work
- [ ] Interactions (waves, hearts) are sent and received
- [ ] Notifications appear in real-time
- [ ] Billing dashboard loads without errors
- [ ] Pricing page displays correctly
- [ ] No increase in error rates
- [ ] Database performance remains stable

## 📞 Emergency Contacts

- **Database Issues**: Supabase Support
- **Deployment Issues**: Netlify/Vercel Support  
- **Payment Issues**: Stripe Support
- **Application Issues**: Development Team

## 📝 Documentation Updates

After successful deployment:

- [ ] Update user documentation
- [ ] Create admin guides for subscription management
- [ ] Document new API endpoints
- [ ] Update troubleshooting guides
- [ ] Create user onboarding materials

---

**Remember**: Always test in a staging environment before production deployment!
