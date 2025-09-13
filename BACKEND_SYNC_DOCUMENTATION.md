# Backend Synchronization Documentation
## Streamlined Signup Flow Implementation

### Overview
This document details the complete backend synchronization for the new streamlined signup flow. The system has been updated to support a two-step process:
1. **Step 1**: Google OAuth authentication
2. **Step 2**: Manual profile completion via `/complete-profile` page

---

## 🗄️ Database Changes

### New Migration Files Created

#### 1. `20250801010000_streamline_signup_flow.sql`
- **Purpose**: Initial streamlined signup setup
- **Key Changes**:
  - Disabled automatic profile creation in `handle_new_user()` function
  - Updated RLS policies for manual profile creation
  - Added performance indexes for auth flow
  - Added table comments for documentation

#### 2. `20250801020000_complete_backend_sync.sql`
- **Purpose**: Comprehensive backend synchronization
- **Key Changes**:
  - Enhanced profile table structure with new columns:
    - `created_via` - Tracks creation method (manual/automatic)
    - `profile_completed_at` - Timestamp of profile completion
    - `last_updated_at` - Auto-updated timestamp
  - Added helper functions:
    - `user_has_completed_profile(user_id)` - Check completion status
    - `get_profile_completion_status(user_id)` - Detailed status JSON
  - Enhanced RLS policies with comprehensive security checks
  - Performance indexes for optimized queries

#### 3. `20250801030000_enhanced_rls_policies.sql`
- **Purpose**: Advanced security and validation
- **Key Changes**:
  - Profile validation triggers with data sanitization
  - API helper functions for safe profile operations:
    - `create_user_profile()` - Safe profile creation
    - `update_user_profile()` - Safe profile updates
  - Admin policies for debugging and support
  - Monitoring views for analytics
  - Cleanup functions for maintenance

---

## 🔐 Security Enhancements

### Row Level Security (RLS) Policies

#### Profile Access Policies
```sql
-- Users can create their own profile with validation
"Users can insert own profile" - Requires valid year_group, display_name, and agreed_to_terms

-- Users can read their own profile
"Users can view own profile" - Standard self-access policy

-- Users can update their own profile with constraints
"Users can update own profile" - Prevents ID changes and terms agreement removal

-- Admin access for support (optional)
"Admins can view all profiles" - For debugging and customer support

-- Profile deletion policy
"Users can delete own profile" - Self-service account deletion
```

### Data Validation

#### Automatic Validation Triggers
- **Year Group Validation**: Only allows `foundation`, `year1`, `year2`, `year3`
- **Display Name Sanitization**: Trims whitespace, enforces length limits (1-100 chars)
- **Terms Agreement**: Ensures users cannot create profiles without agreeing to terms
- **Duplicate Prevention**: Prevents multiple profiles per user

---

## 🔧 API Functions

### Profile Management Functions

#### `public.create_user_profile(year_group, display_name, agreed_to_terms, avatar_url)`
```typescript
// Frontend usage example
const { data, error } = await supabase.rpc('create_user_profile', {
  p_year_group: 'year1',
  p_display_name: 'John Doe',
  p_agreed_to_terms: true,
  p_avatar_url: 'https://example.com/avatar.jpg'
})
```

#### `public.update_user_profile(year_group, display_name, avatar_url)`
```typescript
// Frontend usage example
const { data, error } = await supabase.rpc('update_user_profile', {
  p_display_name: 'Jane Smith',
  p_avatar_url: 'https://example.com/new-avatar.jpg'
})
```

#### `public.get_profile_completion_status(user_id)`
```typescript
// Returns detailed JSON with completion status
const { data, error } = await supabase.rpc('get_profile_completion_status', {
  user_id: userId
})
```

---

## 📊 Monitoring and Analytics

### Profile Completion Statistics
- **View**: `public.profile_completion_stats`
- **Metrics**:
  - Total users registered
  - Profiles created vs total users
  - Profile completion rate percentage
  - Average time from registration to profile completion

### Maintenance Functions
- **`cleanup_incomplete_oauth_sessions()`**: Identifies abandoned OAuth sessions
- **Verification functions**: Validate migration success

---

## 🚦 Authentication Flow Changes

### Old Flow (Disabled)
```
Google OAuth → Automatic Profile Creation → Dashboard
```

### New Flow (Current)
```
Google OAuth → Manual Profile Completion Page → Dashboard
```

### Backend Flow Details

#### 1. OAuth Authentication
- User completes Google OAuth
- `handle_new_user()` trigger fires but **does NOT** create profile
- User metadata stored in `auth.users.raw_user_meta_data`
- Session established, user redirected to `/complete-profile`

#### 2. Profile Completion
- User fills out profile form on `/complete-profile` page
- Frontend calls `create_user_profile()` function
- Profile created with validation and security checks
- `profile_completed_at` timestamp set
- User redirected to appropriate dashboard

#### 3. Subsequent Logins
- Existing users bypass profile completion
- Direct routing to dashboard based on `year_group`

---

## 🛠️ Frontend Integration Points

### Updated Components
- **`/signup`** - Google-only authentication button
- **`/complete-profile`** - Profile completion form
- **`/auth/callback`** - OAuth callback handling
- **`/LoginRedirectPage`** - Route users to appropriate next step

### API Integration
Components should use the new API functions instead of direct database operations:

```typescript
// ❌ Old approach - direct database insert
const { error } = await supabase.from('profiles').insert({...})

// ✅ New approach - use API function
const { data, error } = await supabase.rpc('create_user_profile', {...})
```

---

## 🚀 Deployment

### Migration Deployment Order
1. Apply `20250801010000_streamline_signup_flow.sql`
2. Apply `20250801020000_complete_backend_sync.sql` 
3. Apply `20250801030000_enhanced_rls_policies.sql`

### Verification Steps
After deployment, run these verification queries:
```sql
-- Check migration success
SELECT * FROM public.verify_streamlined_signup_setup();
SELECT * FROM public.verify_enhanced_rls_setup();

-- Monitor profile completion
SELECT * FROM public.profile_completion_stats;
```

### Environment Variables
Ensure these are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

---

## 🔄 Rollback Plan

### Database Rollback
```sql
-- Reset to previous state (if needed)
DROP FUNCTION IF EXISTS public.create_user_profile;
DROP FUNCTION IF EXISTS public.update_user_profile;
DROP VIEW IF EXISTS public.profile_completion_stats;

-- Restore original handle_new_user function
-- (Would need to restore previous version)
```

### Frontend Rollback
- Revert to previous signup flow components
- Update OAuth redirect URLs
- Deploy previous application version

---

## 📋 Testing Checklist

### Backend Testing
- [ ] New user OAuth flow creates no automatic profile
- [ ] Profile completion API functions work correctly
- [ ] Validation triggers prevent invalid data
- [ ] RLS policies enforce proper access control
- [ ] Monitoring views return accurate data

### Frontend Integration Testing
- [ ] `/signup` page redirects to Google OAuth
- [ ] OAuth callback processes successfully
- [ ] `/complete-profile` page creates profile via API
- [ ] Existing users skip profile completion
- [ ] Dashboard routing works for all user types

### Production Testing
- [ ] Full signup flow works end-to-end
- [ ] Error handling displays appropriate messages
- [ ] Performance is acceptable under load
- [ ] Analytics and monitoring function correctly

---

## 📞 Support and Troubleshooting

### Common Issues

#### 1. Profile Creation Fails
- **Check**: RLS policies allow user to create profile
- **Verify**: Required fields (year_group, display_name, agreed_to_terms) provided
- **Debug**: Check validation trigger error messages

#### 2. OAuth Flow Breaks
- **Check**: Callback URL matches OAuth provider settings
- **Verify**: `handle_new_user()` function is updated version
- **Debug**: Check session storage and metadata persistence

#### 3. Users Stuck in Completion Loop
- **Check**: Profile completion detection logic
- **Verify**: `profile_completed_at` timestamp is set
- **Debug**: Use `get_profile_completion_status()` function

### Monitoring Queries
```sql
-- Find users with incomplete profiles
SELECT u.id, u.email, u.created_at, p.profile_completed_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL OR p.profile_completed_at IS NULL;

-- Check recent signups and completion rates
SELECT * FROM public.profile_completion_stats;

-- Find potential OAuth issues
SELECT * FROM public.cleanup_incomplete_oauth_sessions();
```

---

## ✅ Summary

The backend has been fully synchronized with the new streamlined signup flow:

✅ **Database Schema**: Updated with new columns and indexes
✅ **Security**: Enhanced RLS policies and validation triggers  
✅ **API Functions**: Safe profile management functions created
✅ **Monitoring**: Analytics views and maintenance functions
✅ **Documentation**: Comprehensive migration and usage documentation
✅ **Deployment**: Production-ready deployment script provided

The system now supports the two-step signup process while maintaining security, performance, and user experience standards.