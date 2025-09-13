# 💕 Always With You (AWY) Widget

## Purpose & Philosophy

The AWY (Always With You) widget embodies the core philosophy: **"presence, not chat"**. 

AWY is not a chat application or messaging system. Instead, it serves as an emotional anchor - a gentle, persistent reminder that loved ones are connected, available, and emotionally present. Every green dot represents reassurance: "I am not alone."

The widget provides:
- **Presence awareness** - See when loved ones are online
- **Gentle connection** - Send waves to show you're thinking of them
- **Call integration** - Quick access to video calls when deeper connection is needed
- **Emotional comfort** - A floating reminder of your support network

## Required Environment Variables

To enable the AWY widget, set the following environment variables:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_FEATURE_AWY=1` - Feature flag to enable AWY widget

### Optional
No additional API keys are required for core AWY functionality.

## Database Schema Overview

The AWY system uses four main database tables:

### 1. `awy_connections`
Manages relationships between users and their loved ones.
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- loved_one_id (uuid, references auth.users)
- nickname (text, optional display name)
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. `awy_presence` 
Tracks real-time online/offline status.
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- is_online (boolean)
- last_seen (timestamp)
- updated_at (timestamp)
```

### 3. `awy_events`
Logs interactions like waves and connection events.
```sql
- id (uuid, primary key)
- from_user_id (uuid, references auth.users)
- to_user_id (uuid, references auth.users)
- event_type (text: 'wave', 'connect', etc.)
- created_at (timestamp)
```

### 4. `awy_call_links`
Stores personalized video call URLs for each connection.
```sql
- id (uuid, primary key)
- owner_id (uuid, references auth.users)
- loved_one_id (uuid, references auth.users) 
- url (text, video call link)
- updated_at (timestamp)
```

### Views
- `awy_visible_presence` - Secure view showing presence data with RLS applied

## Adding Loved Ones

To connect users in the AWY system:

### 1. Via Database (Development)
```sql
-- Connect two users bidirectionally
INSERT INTO awy_connections (user_id, loved_one_id, nickname)
VALUES 
  ('user-a-uuid', 'user-b-uuid', 'Mom'),
  ('user-b-uuid', 'user-a-uuid', 'Sarah');
```

### 2. Via Settings Page
1. Navigate to `/settings/awy`
2. Add loved one's email address
3. Set optional nickname
4. Configure video call URL
5. Save connection

### 3. Connection Requirements
- Both users must have accounts in the system
- Connections are typically bidirectional for mutual presence visibility
- Each user can customize nicknames and call links independently

## QA Testing Checklist

### Core Functionality
- [ ] **Wave Notifications**: User A sends wave to User B → B receives toast notification within ≤2 seconds
- [ ] **Presence Updates**: Close User A's tab → after ~120 seconds, A's avatar turns grey for User B  
- [ ] **Call Link Management**: Change call link in settings/awy → widget enables/disables 📞 button accordingly without page refresh
- [ ] **Feature Gating**: Set `NEXT_PUBLIC_FEATURE_AWY=0` → widget does not render on page

### User Interface
- [ ] **Widget Positioning**: Widget renders in bottom-right corner without overlapping other elements
- [ ] **Draggable**: Widget can be dragged to different positions and remembers location
- [ ] **Z-index**: AWY widget layers below Durmah widget (proper stacking order)
- [ ] **Responsive**: Widget adapts properly on mobile devices
- [ ] **Window Resize**: Widget remains visible and properly positioned after window resize

### Accessibility
- [ ] **Keyboard Navigation**: All buttons and interactive elements are keyboard focusable
- [ ] **ARIA Labels**: Proper aria-labels present on avatar buttons and controls  
- [ ] **Touch Targets**: Clickable elements are ≥40px for touch accessibility
- [ ] **Screen Reader**: Widget announces presence changes and actions appropriately
- [ ] **Console Errors**: No JavaScript errors in browser console during normal usage

### Performance
- [ ] **Animation Performance**: Smooth animations without high CPU usage
- [ ] **Real-time Updates**: Presence changes propagate within acceptable time limits
- [ ] **Memory Usage**: No memory leaks during extended usage
- [ ] **Network Efficiency**: Reasonable data usage for presence updates

### Security & Data
- [ ] **RLS Policies**: Row Level Security properly restricts data access
- [ ] **Authentication**: Widget only shows data for authenticated users
- [ ] **Privacy**: Users only see presence of their connected loved ones
- [ ] **Data Persistence**: Call links and preferences persist between sessions

## Troubleshooting

### Widget Not Appearing
- Verify `NEXT_PUBLIC_FEATURE_AWY=1` is set
- Check browser console for JavaScript errors
- Confirm user is authenticated

### Presence Not Updating
- Check database connectivity
- Verify RLS policies allow current user access
- Test WebSocket/realtime connections

### Waves Not Received
- Confirm bidirectional connection exists in `awy_connections`
- Check notification permissions in browser
- Verify toast notification system is working

## Development Notes

- AWY integrates globally via `_app.tsx` when feature flag is enabled
- Widget uses `useAwyPresence` hook for state management
- Database queries respect Row Level Security policies
- Component is built with React and Tailwind CSS
- Real-time updates use Supabase realtime subscriptions

---

*AWY represents the emotional heart of MyDurhamLaw - not just legal education technology, but a reminder that learning and growth happen best when we know we're supported and never truly alone.*
