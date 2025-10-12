/**
 * Notification Types
 * 
 * Type definitions for the notification system.
 * Supports various notification types including likes, comments, follows, etc.
 */

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'retweet' 
  | 'follow' 
  | 'mention' 
  | 'reply' 
  | 'bookmark'
  | 'weekly_summary'
  | 'trending'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id?: string
  post_id?: string
  comment_id?: string
  message: string
  is_read: boolean
  is_emailed: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface NotificationActor {
  id: string
  name?: string
  username?: string
  avatar_url?: string
}

export interface NotificationWithActor extends Notification {
  actor?: NotificationActor
}

export interface NotificationPreferences {
  like: boolean
  comment: boolean
  retweet: boolean
  follow: boolean
  mention: boolean
  reply: boolean
  weekly_summary: boolean
}

export interface CreateNotificationData {
  user_id: string
  type: NotificationType
  actor_id?: string
  post_id?: string
  comment_id?: string
  message: string
  metadata?: Record<string, unknown>
}

export interface PushSubscription {
  id?: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at?: string
}

export interface WeeklySummaryStats {
  newFollowers: number
  totalLikes: number
  totalComments: number
  totalRetweets: number
  topPost?: {
    id: string
    content: string
    likes_count: number
  }
}

