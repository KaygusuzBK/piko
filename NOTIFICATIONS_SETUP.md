# 🔔 Notification System Setup Guide

## Overview

SOC AI includes a comprehensive notification system with:
- **In-app toast notifications** (using Sonner)
- **Real-time notifications** (via Supabase Realtime)
- **Web push notifications** (PWA support)
- **Email notifications** (via Resend - ready to implement)

## Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Email Service (Optional - for email notifications)
RESEND_API_KEY=your_resend_api_key

# VAPID Keys for Web Push Notifications (Required for PWA)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

## Generating VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
=======================================

Public Key:
BPx...xxx

Private Key:
abc...xyz

=======================================
```

Add these to your `.env.local` file.

## Database Setup

The notification tables are included in `supabase/schema.sql`. Run this SQL in your Supabase dashboard:

### Tables Created:
- `notifications` - Stores all notifications
- `push_subscriptions` - Stores web push subscriptions

### Triggers:
Auto-create notifications for:
- Post likes
- Comments
- Retweets
- Follows
- Mentions (ready to implement)
- Replies (ready to implement)

## Notification Types

The system supports:
- `like` - Someone liked your post
- `comment` - Someone commented on your post
- `retweet` - Someone retweeted your post
- `follow` - Someone followed you
- `mention` - Someone mentioned you in a post
- `reply` - Someone replied to your comment
- `bookmark` - Someone bookmarked your post
- `weekly_summary` - Weekly activity summary
- `trending` - Trending posts notification

## Features

### 1. Real-time Notifications
- Instant notifications via Supabase Realtime
- Toast notifications appear automatically
- Badge count updates in real-time
- No page refresh needed

### 2. Notification Center
- Click the bell icon in the header
- View recent notifications
- Mark as read/unread
- Navigate to relevant content

### 3. Notifications Page
- Full notifications page at `/notifications`
- Filter by: All, Unread, Mentions
- Pagination support
- Delete notifications

### 4. Web Push Notifications
- PWA-enabled push notifications
- Browser notifications even when app is closed
- Customizable notification preferences
- Subscription management

### 5. Notification Preferences
- Control which notifications you receive
- Enable/disable email notifications
- Enable/disable push notifications
- Per-notification-type preferences

## Testing Notifications

### 1. Test In-App Notifications

```typescript
import { useToast } from '@/hooks'

const toast = useToast()
toast.success('Test notification!')
```

### 2. Test Real-time

Like a post, comment, or follow a user. You should see notifications appear instantly.

### 3. Test Push Notifications

1. Allow notifications when prompted
2. Subscribe via the banner
3. Send a test notification:

```typescript
import { pushNotificationService } from '@/lib/services/pushNotificationService'

await pushNotificationService.showTestNotification()
```

### 4. Test API

```bash
curl -X POST http://localhost:3000/api/notifications/push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "Test",
    "message": "This is a test notification",
    "url": "/"
  }'
```

## Email Notifications (Optional)

To enable email notifications:

1. Sign up at [Resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxx
```

4. Email templates are in `lib/emails/` (ready to implement)

## PWA Setup

The app is PWA-ready with:
- Service worker at `/sw.js`
- Web app manifest at `/manifest.json`
- Install banner support
- Offline page at `/offline`

### Install as App

1. Visit the site
2. Click "Install" in the browser
3. App will be available as a standalone app

## Architecture

### Repository Layer
- `lib/repositories/notificationRepository.ts` - Data access
- `lib/repositories/userRepository.ts` - User preferences

### Service Layer
- `lib/services/notificationService.ts` - Business logic
- `lib/services/realtimeService.ts` - Real-time subscriptions
- `lib/services/pushNotificationService.ts` - Push notifications

### Hooks
- `hooks/useNotifications.ts` - Notification hooks
- `hooks/useToast.ts` - Toast notifications

### Components
- `components/notifications/NotificationCenter.tsx` - Header dropdown
- `components/notifications/NotificationList.tsx` - Full list
- `components/notifications/NotificationCard.tsx` - Single notification
- `components/notifications/PushSubscriptionBanner.tsx` - Push subscription UI

## SOLID Principles

The notification system follows SOLID principles:

1. **Single Responsibility**: Each class handles one concern
2. **Open/Closed**: Extensible without modification
3. **Liskov Substitution**: Consistent interfaces
4. **Interface Segregation**: Specialized interfaces
5. **Dependency Inversion**: Depends on abstractions

## Troubleshooting

### Notifications not appearing?

1. Check Supabase Realtime is enabled
2. Verify database triggers are created
3. Check browser console for errors
4. Ensure user is authenticated

### Push notifications not working?

1. Check VAPID keys are configured
2. Verify HTTPS (required for push)
3. Check browser permissions
4. Ensure service worker is registered

### Can't subscribe to push?

1. Clear browser cache
2. Unregister old service workers
3. Check browser compatibility
4. Verify manifest.json is accessible

## Browser Compatibility

- **Desktop**: Chrome 42+, Firefox 44+, Safari 16+, Edge 79+
- **Mobile**: Chrome Android 42+, Safari iOS 16.4+
- **Push Notifications**: Chrome 50+, Firefox 44+, Safari 16+

## Performance

- Real-time subscriptions are lightweight
- Notifications are paginated
- Debounced updates prevent spam
- Indexed database queries
- Optimistic UI updates

## Security

- Row Level Security (RLS) enabled
- Users can only see their notifications
- Push subscriptions tied to user
- VAPID keys secure endpoints
- No sensitive data in push payloads

## Future Enhancements

Ready to implement:
- Email notification sending
- Weekly summary emails
- Trending posts notifications
- Notification grouping
- Notification sound preferences
- Custom notification sounds
- Desktop notifications
- iOS/Android native apps

## Support

For issues or questions:
- Check browser console for errors
- Verify environment variables
- Test database triggers
- Review Supabase logs

