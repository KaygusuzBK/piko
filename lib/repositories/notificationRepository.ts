/**
 * Notification Repository
 * 
 * Data access layer for notifications.
 * Handles all database operations related to notifications.
 */

import { createClient } from '@/lib/supabase'
import type { 
  Notification, 
  NotificationWithActor, 
  CreateNotificationData,
  PushSubscription as PushSubscriptionType
} from '@/lib/types'

export class NotificationRepository {
  private supabase = createClient()

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: data.type,
          actor_id: data.actor_id,
          post_id: data.post_id,
          comment_id: data.comment_id,
          message: data.message,
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return null
      }

      return notification
    } catch (error) {
      console.error('Error in create notification:', error)
      return null
    }
  }

  /**
   * Find notification by ID with actor details
   */
  async findById(id: string): Promise<NotificationWithActor | null> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          actor:public.users!notifications_actor_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching notification:', error)
        return null
      }

      return data as unknown as NotificationWithActor
    } catch (error) {
      console.error('Error in findById:', error)
      return null
    }
  }

  /**
   * Find notifications for a user with pagination
   */
  async findByUserId(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<NotificationWithActor[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          actor:public.users!notifications_actor_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return (data as unknown as NotificationWithActor[]) || []
    } catch (error) {
      console.error('Error in findByUserId:', error)
      return []
    }
  }

  /**
   * Find unread notifications for a user
   */
  async findUnreadByUserId(userId: string): Promise<NotificationWithActor[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          actor:public.users!notifications_actor_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching unread notifications:', error)
        return []
      }

      return (data as unknown as NotificationWithActor[]) || []
    } catch (error) {
      console.error('Error in findUnreadByUserId:', error)
      return []
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      return false
    }
  }

  /**
   * Mark a notification as emailed
   */
  async markAsEmailed(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_emailed: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as emailed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAsEmailed:', error)
      return false
    }
  }

  /**
   * Delete a notification
   */
  async deleteById(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteById:', error)
      return false
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllByUserId(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting all notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteAllByUserId:', error)
      return false
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  /**
   * Get unemailed notifications for batch processing
   */
  async getUnemailedNotifications(limit: number = 100): Promise<NotificationWithActor[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          actor:public.users!notifications_actor_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('is_emailed', false)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching unemailed notifications:', error)
        return []
      }

      return (data as unknown as NotificationWithActor[]) || []
    } catch (error) {
      console.error('Error in getUnemailedNotifications:', error)
      return []
    }
  }

  /**
   * Create push subscription
   */
  async createPushSubscription(subscription: Omit<PushSubscriptionType, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('push_subscriptions')
        .upsert({
          user_id: subscription.user_id,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }, {
          onConflict: 'user_id,endpoint'
        })

      if (error) {
        console.error('Error creating push subscription:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in createPushSubscription:', error)
      return false
    }
  }

  /**
   * Get push subscriptions for a user
   */
  async getPushSubscriptions(userId: string): Promise<PushSubscriptionType[]> {
    try {
      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching push subscriptions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPushSubscriptions:', error)
      return []
    }
  }

  /**
   * Delete push subscription
   */
  async deletePushSubscription(endpoint: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting push subscription:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deletePushSubscription:', error)
      return false
    }
  }
}

// Singleton instance
export const notificationRepository = new NotificationRepository()

