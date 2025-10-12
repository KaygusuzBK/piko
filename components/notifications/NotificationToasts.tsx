/**
 * Simple Notification Toast Component
 * 
 * In-app notification display without external packages.
 */

'use client'

import { useEffect, useState } from 'react'
import { useNotificationStore, type Notification } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { X, Heart, MessageCircle, UserPlus, AtSign, Reply } from 'lucide-react'
import { cn } from '@/lib/utils'

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4 text-red-500" />
    case 'comment':
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case 'follow':
      return <UserPlus className="h-4 w-4 text-green-500" />
    case 'mention':
      return <AtSign className="h-4 w-4 text-purple-500" />
    case 'reply':
      return <Reply className="h-4 w-4 text-orange-500" />
    default:
      return <MessageCircle className="h-4 w-4 text-gray-500" />
  }
}

const getNotificationMessage = (notification: Notification) => {
  const { actorName, type } = notification
  
  switch (type) {
    case 'like':
      return `${actorName} gönderinizi beğendi`
    case 'comment':
      return `${actorName} gönderinize yorum yaptı`
    case 'follow':
      return `${actorName} sizi takip etmeye başladı`
    case 'mention':
      return `${actorName} sizden bahsetti`
    case 'reply':
      return `${actorName} yorumunuza cevap verdi`
    default:
      return notification.message
  }
}

interface NotificationToastProps {
  notification: Notification
  onClose: (id: string) => void
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(notification.id), 300) // Wait for animation
    }, 4000)

    return () => clearTimeout(timer)
  }, [notification.id, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg p-3 mb-2',
        'animate-in slide-in-from-right duration-300',
        'hover:shadow-xl transition-all duration-200',
        'max-w-sm w-full'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.actorAvatar} />
          <AvatarFallback>
            {notification.actorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getNotificationIcon(notification.type)}
            <p className="text-sm font-medium text-foreground">
              {getNotificationMessage(notification)}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {new Date(notification.timestamp).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onClose(notification.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function NotificationToasts() {
  const { notifications, removeNotification } = useNotificationStore()
  const { user } = useAuthStore()

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    notification => notification.recipientId === user?.id
  )

  if (!user) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {userNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}
