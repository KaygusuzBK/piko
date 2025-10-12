'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead, 
  useNotificationSubscription 
} from '@/hooks'
import type { Notification } from '@/lib/types'

export function NotificationButton() {
  const { user } = useAuthStore()
  const { notifications, refresh: refreshNotifications } = useNotifications(user?.id, 10)
  const { count, increment, decrement } = useUnreadCount(user?.id)
  const { markAsRead, markAllAsRead } = useMarkAsRead()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle new notification from real-time subscription
  const handleNewNotification = (notification: Notification) => {
    console.log('New notification received in NotificationButton:', notification)
    increment()
    refreshNotifications()
  }

  // Subscribe to real-time notifications
  useNotificationSubscription(user?.id, handleNewNotification)

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return
    
    const success = await markAsRead(notificationId, user.id)
    if (success) {
      decrement()
      refreshNotifications()
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    
    const success = await markAllAsRead(user.id)
    if (success) {
      refreshNotifications()
    }
  }

  // Don't render on server or if user is not logged in
  if (!mounted || !user) {
    return null
  }

  return (
    <div className="hidden sm:block">
      <NotificationCenter
        notifications={notifications}
        unreadCount={count}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  )
}

