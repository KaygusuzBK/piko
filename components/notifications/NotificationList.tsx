/**
 * NotificationList Component
 * 
 * Full notification list with filtering, pagination, and empty states.
 * Used in the main notifications page.
 */

'use client'

import { useState } from 'react'
import { NotificationWithActor } from '@/lib/types'
import { NotificationCard } from './NotificationCard'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationListProps {
  notifications: NotificationWithActor[]
  loading?: boolean
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
}

type FilterTab = 'all' | 'unread' | 'mentions'

export function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  hasMore
}: NotificationListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'unread') {
      return !notification.is_read
    }
    if (activeFilter === 'mentions') {
      return notification.type === 'mention' || notification.type === 'reply'
    }
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-4 py-3 text-sm font-semibold transition-colors relative',
              activeFilter === 'all'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Tümü
            {activeFilter === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter('unread')}
            className={cn(
              'px-4 py-3 text-sm font-semibold transition-colors relative',
              activeFilter === 'unread'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Okunmamış {unreadCount > 0 && `(${unreadCount})`}
            {activeFilter === 'unread' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter('mentions')}
            className={cn(
              'px-4 py-3 text-sm font-semibold transition-colors relative',
              activeFilter === 'mentions'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mention
            {activeFilter === 'mentions' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && onMarkAllAsRead && (
          <div className="px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <Check className="h-4 w-4 mr-1" />
              Tümünü okundu işaretle
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading && filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Bildirimler yükleniyor...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold mb-1">Bildirim yok</p>
            <p className="text-sm text-muted-foreground text-center">
              {activeFilter === 'unread' 
                ? 'Tüm bildirimleriniz okundu'
                : activeFilter === 'mentions'
                ? 'Henüz mention veya yanıt almadınız'
                : 'Henüz bildiriminiz yok'}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => {
                  if (!notification.is_read && onMarkAsRead) {
                    onMarkAsRead(notification.id)
                  }
                }}
              />
            ))}

            {/* Load More Button */}
            {hasMore && onLoadMore && (
              <div className="p-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    'Daha fazla yükle'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

