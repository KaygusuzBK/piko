/**
 * Notifications Page
 * 
 * Full-page notifications view with filtering and pagination.
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { NotificationList } from '@/components/notifications/NotificationList'
import { 
  useNotifications, 
  useMarkAsRead, 
  useNotificationSubscription 
} from '@/hooks'
import type { Notification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  
  const { 
    notifications, 
    loading: notificationsLoading, 
    refresh 
  } = useNotifications(user?.id, limit, offset)
  
  const { markAsRead, markAllAsRead } = useMarkAsRead()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Handle new notification from real-time subscription
  const handleNewNotification = (notification: Notification) => {
    console.log('New notification received on notifications page:', notification)
    refresh()
  }

  // Subscribe to real-time notifications
  useNotificationSubscription(user?.id, handleNewNotification)

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return
    
    const success = await markAsRead(notificationId, user.id)
    if (success) {
      refresh()
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    
    const success = await markAllAsRead(user.id)
    if (success) {
      refresh()
    }
  }

  const handleLoadMore = () => {
    setOffset(prev => prev + limit)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar hideExtras />

          <div className="lg:col-span-3 h-full min-h-0 flex flex-col border-x border-border">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/60 backdrop-blur px-3 sm:px-4 py-2 flex items-center space-x-4 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold">Bildirimler</h1>
                <p className="text-xs text-muted-foreground">
                  {notifications.length} bildirim
                </p>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-hidden">
              <NotificationList
                notifications={notifications}
                loading={notificationsLoading}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onLoadMore={handleLoadMore}
                hasMore={notifications.length >= offset + limit}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

