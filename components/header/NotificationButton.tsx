/**
 * Simple Notification Button Component
 * 
 * Uses Zustand notification store instead of complex hooks.
 */

'use client'

import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export function NotificationButton() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  return (
    <div className="hidden sm:block">
      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}