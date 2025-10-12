/**
 * NotificationCenter Component
 * 
 * Dropdown notification center for the header.
 * Shows recent notifications with quick actions.
 */

'use client'

import { NotificationWithActor } from '@/lib/types'
import { NotificationCard } from './NotificationCard'
import { Button } from '@/components/ui/button'
import { Bell, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface NotificationCenterProps {
  notifications: NotificationWithActor[]
  unreadCount: number
  loading?: boolean
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
}

export function NotificationCenter({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationCenterProps) {
  const recentNotifications = notifications.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[400px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Bildirimler</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs h-8"
              >
                Tümünü okundu işaretle
              </Button>
            )}
            <Link href="/settings#notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Henüz bildiriminiz yok
              </p>
            </div>
          ) : (
            <>
              {recentNotifications.map(notification => (
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
            </>
          )}
        </div>

        {/* Footer - View All Link */}
        {recentNotifications.length > 0 && (
          <div className="border-t border-border">
            <Link href="/notifications">
              <Button 
                variant="ghost" 
                className="w-full rounded-none text-primary hover:text-primary hover:bg-primary/10"
              >
                Tüm bildirimleri görüntüle
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

