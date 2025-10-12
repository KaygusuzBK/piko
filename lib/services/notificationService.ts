/**
 * Notification Service
 * 
 * Business logic layer for notifications.
 * Handles notification creation, retrieval, and management.
 */

import { notificationRepository } from '@/lib/repositories/notificationRepository'
import { userRepository } from '@/lib/repositories/userRepository'
import type {
  Notification,
  NotificationWithActor,
  CreateNotificationData
} from '@/lib/types'

export class NotificationService {
  private notificationRepo = notificationRepository
  private userRepo = userRepository

  /**
   * Create a notification with user preference check
   */
  async createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
      // Check user's notification preferences
      const prefs = await this.userRepo.getNotificationPreferences(data.user_id)
      
      // Skip if user has disabled this notification type
      if (prefs && data.type in prefs && !prefs[data.type as keyof typeof prefs]) {
        console.log(`Notification type ${data.type} is disabled for user ${data.user_id}`)
        return null
      }

      return await this.notificationRepo.create(data)
    } catch (error) {
      console.error('Error in createNotification:', error)
      return null
    }
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationWithActor[]> {
    return await this.notificationRepo.findByUserId(userId, limit, offset)
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<NotificationWithActor[]> {
    return await this.notificationRepo.findUnreadByUserId(userId)
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    return await this.notificationRepo.markAsRead(notificationId, userId)
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    return await this.notificationRepo.markAllAsRead(userId)
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    return await this.notificationRepo.deleteById(id, userId)
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepo.getUnreadCount(userId)
  }

  /**
   * Helper: Create notification for a post like
   */
  async notifyLike(postId: string, postAuthorId: string, actorId: string): Promise<void> {
    // Don't notify if user likes their own post
    if (postAuthorId === actorId) {
      return
    }

    await this.createNotification({
      user_id: postAuthorId,
      type: 'like',
      actor_id: actorId,
      post_id: postId,
      message: 'gönderini beğendi'
    })
  }

  /**
   * Helper: Create notification for a comment
   */
  async notifyComment(
    postId: string,
    postAuthorId: string,
    actorId: string,
    commentId: string
  ): Promise<void> {
    // Don't notify if user comments on their own post
    if (postAuthorId === actorId) {
      return
    }

    await this.createNotification({
      user_id: postAuthorId,
      type: 'comment',
      actor_id: actorId,
      post_id: postId,
      comment_id: commentId,
      message: 'gönderine yorum yaptı'
    })
  }

  /**
   * Helper: Create notification for a retweet
   */
  async notifyRetweet(postId: string, postAuthorId: string, actorId: string): Promise<void> {
    // Don't notify if user retweets their own post
    if (postAuthorId === actorId) {
      return
    }

    await this.createNotification({
      user_id: postAuthorId,
      type: 'retweet',
      actor_id: actorId,
      post_id: postId,
      message: 'gönderini retweetledi'
    })
  }

  /**
   * Helper: Create notification for a follow
   */
  async notifyFollow(followedUserId: string, followerId: string): Promise<void> {
    await this.createNotification({
      user_id: followedUserId,
      type: 'follow',
      actor_id: followerId,
      message: 'seni takip etmeye başladı'
    })
  }

  /**
   * Helper: Create notification for a mention in a post
   */
  async notifyMention(mentionedUserId: string, actorId: string, postId: string): Promise<void> {
    // Don't notify if user mentions themselves
    if (mentionedUserId === actorId) {
      return
    }

    await this.createNotification({
      user_id: mentionedUserId,
      type: 'mention',
      actor_id: actorId,
      post_id: postId,
      message: 'seni bir gönderide bahsetti'
    })
  }

  /**
   * Helper: Create notification for a reply to a comment
   */
  async notifyReply(
    parentCommentAuthorId: string,
    actorId: string,
    postId: string,
    commentId: string
  ): Promise<void> {
    // Don't notify if user replies to their own comment
    if (parentCommentAuthorId === actorId) {
      return
    }

    await this.createNotification({
      user_id: parentCommentAuthorId,
      type: 'reply',
      actor_id: actorId,
      post_id: postId,
      comment_id: commentId,
      message: 'yorumuna cevap verdi'
    })
  }

  /**
   * Helper: Create notification for bookmark (optional)
   */
  async notifyBookmark(postId: string, postAuthorId: string, actorId: string): Promise<void> {
    // Don't notify if user bookmarks their own post
    if (postAuthorId === actorId) {
      return
    }

    await this.createNotification({
      user_id: postAuthorId,
      type: 'bookmark',
      actor_id: actorId,
      post_id: postId,
      message: 'gönderini favorilere ekledi'
    })
  }

  /**
   * Batch create notifications (for efficiency)
   */
  async batchCreateNotifications(notifications: CreateNotificationData[]): Promise<void> {
    const promises = notifications.map(notif => this.createNotification(notif))
    await Promise.all(promises)
  }

  /**
   * Get unemailed notifications for batch email processing
   */
  async getUnemailedNotifications(limit: number = 100): Promise<NotificationWithActor[]> {
    return await this.notificationRepo.getUnemailedNotifications(limit)
  }

  /**
   * Mark notification as emailed
   */
  async markAsEmailed(notificationId: string): Promise<boolean> {
    return await this.notificationRepo.markAsEmailed(notificationId)
  }
}

// Singleton instance
export const notificationService = new NotificationService()

