/**
 * Simple Notification Button Component
 * 
 * Uses Zustand notification store instead of complex hooks.
 */

'use client'

import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useAuthStore } from '@/stores/authStore'

export function NotificationButton() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore()
  const { user } = useAuthStore()

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    notification => notification.recipientId === user?.id
  )
  
  const userUnreadCount = userNotifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  if (!user) return null

  return (
    <div className="hidden sm:block">
      <NotificationCenter
        notifications={userNotifications}
        unreadCount={userUnreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}