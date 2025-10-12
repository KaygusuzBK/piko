/**
 * NotificationCard Component
 * 
 * Displays a single notification with actor info, message, and actions.
 * Supports different notification types with appropriate icons and navigation.
 */

'use client'

import { NotificationWithActor } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Heart, MessageCircle, Repeat2, UserPlus, AtSign, Reply, Bookmark, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: NotificationWithActor
  onClick?: () => void
}

const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  retweet: Repeat2,
  follow: UserPlus,
  mention: AtSign,
  reply: Reply,
  bookmark: Bookmark,
  weekly_summary: TrendingUp,
  trending: TrendingUp
}

const notificationColors = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  retweet: 'text-green-500',
  follow: 'text-purple-500',
  mention: 'text-yellow-500',
  reply: 'text-blue-500',
  bookmark: 'text-orange-500',
  weekly_summary: 'text-pink-500',
  trending: 'text-pink-500'
}

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const router = useRouter()
  const Icon = notificationIcons[notification.type]
  const iconColor = notificationColors[notification.type]

  const handleClick = () => {
    // Navigate based on notification type
    if (notification.type === 'follow' && notification.actor?.username) {
      router.push(`/users/${notification.actor_id}`)
    } else if (notification.post_id) {
      router.push(`/posts/${notification.post_id}`)
    }

    // Call external onClick handler
    if (onClick) {
      onClick()
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: tr
  })

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Actor Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.actor?.avatar_url} alt={notification.actor?.username || 'User'} />
          <AvatarFallback>
            {notification.actor?.name?.[0]?.toUpperCase() || notification.actor?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Notification Icon Badge */}
        <div className={cn(
          'absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background flex items-center justify-center border-2 border-background',
          iconColor
        )}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">
                {notification.actor?.username || 'Birisi'}
              </span>
              {' '}
              <span className="text-muted-foreground">
                {notification.message}
              </span>
            </p>
          </div>
          
          {/* Unread Indicator */}
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Time */}
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  )
}

