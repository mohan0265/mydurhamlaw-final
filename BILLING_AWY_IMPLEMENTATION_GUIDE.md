
# MyDurhamLaw - Billing, Trial & Enhanced AWY Implementation Guide

## 🎯 Overview

This implementation adds comprehensive billing, subscription management, and enhanced Always With You (AWY) features to the MyDurhamLaw application.

## 📋 Features Implemented

### 1. Billing & Subscription System
- **Subscription Plans**: Free Trial, Student Basic, Student Premium, Student Pro
- **Trial Management**: 14-day free trial with automatic expiration handling
- **Usage Tracking**: Monitor AI chat usage, AWY connections, and other features
- **Billing History**: Track payments and subscription changes
- **Plan Management**: Upgrade, downgrade, cancel, and reactivate subscriptions

### 2. Enhanced AWY (Always With You)
- **Advanced Connections**: Relationship-based connections with permissions
- **Real-time Presence**: Enhanced presence tracking with mood and activity status
- **Interactions**: Wave, heart, thinking of you, and quick messages
- **Video Calls**: Integrated video calling system with WebRTC
- **Notifications**: Real-time notifications for all AWY activities

### 3. User Interface Components
- **Subscription Status Widget**: Shows current plan and trial information
- **Pricing Plans Page**: Beautiful pricing display with feature comparison
- **Trial Banner**: Prominent trial expiration warnings
- **Enhanced AWY Widget**: Redesigned widget with modern UI
- **Billing Dashboard**: Complete subscription management interface

## 🗄️ Database Schema

### New Tables Created

1. **subscription_plans** - Available subscription plans
2. **user_subscriptions** - User subscription records
3. **usage_tracking** - Feature usage monitoring
4. **billing_events** - Audit trail for billing events
5. **awy_connections** - Enhanced AWY connections
6. **awy_presence** - Real-time presence data
7. **awy_interactions** - User interactions (waves, hearts, etc.)
8. **awy_call_sessions** - Video call session management
9. **awy_notifications** - Real-time notifications

### Key Database Functions

- `get_user_subscription_info()` - Get user's subscription details
- `user_has_feature_access()` - Check feature access permissions
- `start_user_trial()` - Initialize trial subscription
- `create_awy_connection()` - Create new AWY connection
- `accept_awy_invitation()` - Accept connection invitation
- `send_awy_interaction()` - Send interactions between users

## 🚀 Installation & Setup

### 1. Database Setup

Run the SQL schema files in your Supabase dashboard:

```sql
-- 1. First run the billing schema
-- Execute: src/sql/billing_schema.sql

-- 2. Then run the enhanced AWY schema  
-- Execute: src/sql/enhanced_awy_schema.sql
```

### 2. Environment Variables

Update your `.env.local` file:

```env
# Existing variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Billing Configuration
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_TRIAL_DAYS=14

# Stripe Configuration (for future payment integration)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWY Configuration
NEXT_PUBLIC_ENABLE_AWY=true
NEXT_PUBLIC_AWY_MAX_CONNECTIONS_FREE=3
NEXT_PUBLIC_AWY_MAX_CONNECTIONS_BASIC=5
NEXT_PUBLIC_AWY_MAX_CONNECTIONS_PREMIUM=10
```

### 3. Install Dependencies

The implementation uses existing dependencies, but ensure you have:

```bash
npm install
# All required packages are already in package.json
```

## 📁 File Structure

```
src/
├── components/
│   ├── billing/
│   │   ├── SubscriptionStatus.tsx      # Subscription status widget
│   │   ├── PricingPlans.tsx           # Pricing plans display
│   │   └── TrialBanner.tsx            # Trial expiration banner
│   └── awy/
│       └── EnhancedAWYWidget.tsx      # Enhanced AWY widget
├── hooks/
│   ├── useSubscription.ts             # Subscription management hook
│   └── useAWYEnhanced.ts              # Enhanced AWY hook
├── lib/
│   ├── billing/
│   │   └── subscriptionService.ts     # Subscription service layer
│   └── awy/
│       └── awyService.ts              # AWY service layer
├── pages/
│   ├── api/
│   │   ├── billing/
│   │   │   ├── subscription.ts        # Subscription API
│   │   │   ├── plans.ts              # Plans API
│   │   │   └── usage.ts              # Usage tracking API
│   │   └── awy/
│   │       ├── connections.ts         # Connections API
│   │       ├── presence.ts           # Presence API
│   │       ├── interactions.ts       # Interactions API
│   │       ├── calls.ts              # Call sessions API
│   │       └── notifications.ts      # Notifications API
│   ├── billing.tsx                   # Billing dashboard page
│   └── pricing.tsx                   # Public pricing page
├── sql/
│   ├── billing_schema.sql            # Billing database schema
│   └── enhanced_awy_schema.sql       # Enhanced AWY schema
└── types/
    └── billing.ts                    # TypeScript type definitions
```

## 🔧 API Endpoints

### Billing APIs
- `GET /api/billing/subscription` - Get user subscription info
- `POST /api/billing/subscription` - Start trial or create subscription
- `PUT /api/billing/subscription` - Update subscription (cancel/reactivate)
- `GET /api/billing/plans` - Get available subscription plans
- `GET /api/billing/usage` - Get usage data
- `POST /api/billing/usage` - Track feature usage

### AWY APIs
- `GET /api/awy/connections` - Get user connections
- `POST /api/awy/connections` - Create new connection
- `PUT /api/awy/connections` - Update connection permissions
- `DELETE /api/awy/connections` - Delete connection
- `GET /api/awy/presence` - Get presence data
- `POST /api/awy/presence` - Update user presence
- `GET /api/awy/interactions` - Get recent interactions
- `POST /api/awy/interactions` - Send interaction
- `GET /api/awy/calls` - Get call session
- `POST /api/awy/calls` - Initiate call
- `GET /api/awy/notifications` - Get notifications
- `PUT /api/awy/notifications` - Mark notifications as read

## 🎨 Usage Examples

### 1. Using the Subscription Hook

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent({ userId }: { userId: string }) {
  const {
    subscription,
    loading,
    hasFeatureAccess,
    getTrialDaysRemaining,
    startTrial
  } = useSubscription(userId);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Plan: {subscription?.plan_name}</h2>
      <p>Status: {subscription?.status}</p>
      
      {subscription?.status === 'trial' && (
        <p>Trial expires in {getTrialDaysRemaining()} days</p>
      )}
      
      {hasFeatureAccess('Unlimited AI Chat') && (
        <div>You have unlimited AI chat access!</div>
      )}
      
      {!subscription && (
        <button onClick={startTrial}>Start Free Trial</button>
      )}
    </div>
  );
}
```

### 2. Using the Enhanced AWY Hook

```tsx
import { useAWYEnhanced } from '@/hooks/useAWYEnhanced';

function AWYComponent({ userId }: { userId: string }) {
  const {
    connections,
    getOnlineConnections,
    sendInteraction,
    createConnection,
    notifications
  } = useAWYEnhanced(userId);

  const handleSendWave = async (connectionId: string) => {
    try {
      await sendInteraction(connectionId, 'wave');
    } catch (error) {
      console.error('Failed to send wave:', error);
    }
  };

  return (
    <div>
      <h2>AWY Connections</h2>
      <p>Online: {getOnlineConnections().length}</p>
      <p>Notifications: {notifications.length}</p>
      
      {connections.map(connection => (
        <div key={connection.id}>
          <span>{connection.relationship_label}</span>
          {connection.status === 'active' && (
            <button onClick={() => handleSendWave(connection.id)}>
              Send Wave
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. Adding Components to Existing Pages

```tsx
// In your dashboard or main layout
import { TrialBanner } from '@/components/billing/TrialBanner';
import { EnhancedAWYWidget } from '@/components/awy/EnhancedAWYWidget';

function Dashboard({ user }) {
  return (
    <div>
      <TrialBanner userId={user.id} onUpgrade={() => router.push('/billing')} />
      
      {/* Your existing dashboard content */}
      
      <EnhancedAWYWidget userId={user.id} />
    </div>
  );
}
```

## 🔒 Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only access their own subscription data
- AWY connections respect privacy settings
- Service role can manage all data for admin operations

### API Security
- All APIs require authentication
- User ID validation on all operations
- Input sanitization and validation
- Rate limiting considerations

## 🚦 Testing

### 1. Database Testing
```sql
-- Test subscription creation
SELECT start_user_trial('user-uuid-here');

-- Test feature access
SELECT user_has_feature_access('user-uuid-here', 'Unlimited AI Chat');

-- Test AWY connection creation
SELECT create_awy_connection(
  'user-uuid-here',
  'parent@example.com',
  'Mum',
  'Sarah'
);
```

### 2. API Testing
```bash
# Test subscription endpoint
curl -X GET http://localhost:3000/api/billing/subscription \
  -H "Authorization: Bearer your-jwt-token"

# Test AWY connections
curl -X POST http://localhost:3000/api/awy/connections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"connectionEmail": "test@example.com", "relationshipLabel": "Friend"}'
```

## 🔄 Migration from Existing AWY

If you have existing AWY data, run this migration:

```sql
-- Migrate existing parent connections to new AWY system
INSERT INTO awy_connections (user_id, connection_email, relationship_label, display_name, status)
SELECT 
  id as user_id,
  parent1_email as connection_email,
  parent1_relationship as relationship_label,
  parent1_display_name as display_name,
  'active' as status
FROM profiles 
WHERE parent1_email IS NOT NULL;

-- Repeat for parent2 if needed
INSERT INTO awy_connections (user_id, connection_email, relationship_label, display_name, status)
SELECT 
  id as user_id,
  parent2_email as connection_email,
  parent2_relationship as relationship_label,
  parent2_display_name as display_name,
  'active' as status
FROM profiles 
WHERE parent2_email IS NOT NULL;
```

## 🎯 Next Steps

### 1. Payment Integration
- Integrate Stripe for payment processing
- Add webhook handlers for subscription events
- Implement subscription upgrade/downgrade flows

### 2. Enhanced Features
- Add usage analytics dashboard
- Implement referral system
- Add team/group subscriptions for study groups

### 3. AWY Enhancements
- Implement WebRTC video calling
- Add screen sharing capabilities
- Create mobile app companion

## 📞 Support

For implementation support or questions:
1. Check the API responses for detailed error messages
2. Review the database logs in Supabase
3. Test individual components in isolation
4. Verify environment variables are set correctly

## 🎉 Conclusion

This implementation provides a complete billing and enhanced AWY system for MyDurhamLaw. The modular design allows for easy customization and extension while maintaining security and performance standards.

The system is designed to scale with your user base and can be easily extended with additional features as needed.
