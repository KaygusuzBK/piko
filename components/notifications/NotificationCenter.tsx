/**
 * Notification Center Component
 * 
 * Dropdown showing recent notifications with unread count.
 */

'use client'

import { type Notification } from '@/stores/notificationStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Bell, Check } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'like':
      return '❤️'
    case 'comment':
      return '💬'
    case 'follow':
      return '👥'
    case 'mention':
      return '@'
    case 'reply':
      return '↩️'
    default:
      return '🔔'
  }
}

const getNotificationMessage = (notification: Notification) => {
  const { userName, type } = notification
  
  switch (type) {
    case 'like':
      return `${userName} gönderinizi beğendi`
    case 'comment':
      return `${userName} gönderinize yorum yaptı`
    case 'follow':
      return `${userName} sizi takip etmeye başladı`
    case 'mention':
      return `${userName} sizden bahsetti`
    case 'reply':
      return `${userName} yorumunuza cevap verdi`
    default:
      return notification.message
  }
}

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationCenterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-6 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Henüz bildirim yok
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.userAvatar} />
                      <AvatarFallback>
                        {notification.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                      <p className={cn(
                        'text-sm',
                        !notification.isRead && 'font-semibold'
                      )}>
                        {getNotificationMessage(notification)}
                      </p>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleString('tr-TR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-center justify-center">
                Tüm Bildirimleri Görüntüle
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}