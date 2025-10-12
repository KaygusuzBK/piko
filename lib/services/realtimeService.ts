/**
 * Realtime Service
 * 
 * Manages real-time subscriptions using Supabase Realtime.
 * Handles notification updates in real-time.
 */

import { createClient } from '@/lib/supabase'
import type { Notification } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Subscribe to notifications for a specific user
   * Returns an unsubscribe function
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channelName = `notifications:${userId}`

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.warn(`Already subscribed to ${channelName}`)
      return () => this.unsubscribeFromNotifications(userId)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          callback(payload.new as Notification)
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${channelName}:`, status)
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromNotifications(userId)
  }

  /**
   * Unsubscribe from notifications for a specific user
   */
  unsubscribeFromNotifications(userId: string): void {
    const channelName = `notifications:${userId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`Unsubscribed from ${channelName}`)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      this.supabase.removeChannel(channel)
      console.log(`Unsubscribed from ${channelName}`)
    })
    this.channels.clear()
  }

  /**
   * Subscribe to notification updates (mark as read)
   */
  subscribeToNotificationUpdates(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channelName = `notification-updates:${userId}`

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.warn(`Already subscribed to ${channelName}`)
      return () => {
        const channel = this.channels.get(channelName)
        if (channel) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload)
          callback(payload.new as Notification)
        }
      )
      .subscribe((status) => {
        console.log(`Realtime update subscription status for ${channelName}:`, status)
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      const ch = this.channels.get(channelName)
      if (ch) {
        this.supabase.removeChannel(ch)
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.channels.size
  }

  /**
   * Check if subscribed to a specific channel
   */
  isSubscribed(userId: string, type: 'notifications' | 'updates' = 'notifications'): boolean {
    const channelName = type === 'notifications' 
      ? `notifications:${userId}` 
      : `notification-updates:${userId}`
    return this.channels.has(channelName)
  }
}

// Singleton instance
export const realtimeService = new RealtimeService()

