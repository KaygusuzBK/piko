/**
 * Push Notification Service (OneSignal)
 * 
 * Manages web push notifications using OneSignal.
 * No VAPID keys required - uses OneSignal's infrastructure.
 */

import { notificationRepository } from '@/lib/repositories/notificationRepository'
import type { PushSubscription as PushSubscriptionType } from '@/lib/types'

// OneSignal SDK types
interface OneSignalSDK {
  init: (config: OneSignalConfig) => Promise<void>
  Notifications: {
    requestPermission: () => Promise<boolean>
    getPermission: () => Promise<boolean>
    create: (options: NotificationOptions) => Promise<void>
  }
  User: {
    getOnesignalId: () => Promise<string | null>
  }
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
}

interface OneSignalConfig {
  appId: string
  allowLocalhostAsSecureOrigin?: boolean
  notifyButton?: {
    enable: boolean
  }
  promptOptions?: {
    slidedown?: {
      enabled: boolean
    }
  }
}

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
}

declare global {
  interface Window {
    OneSignal?: OneSignalSDK
  }
}

export class PushNotificationService {
  private notificationRepo = notificationRepository
  private oneSignalAppId: string

  constructor() {
    this.oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
  }

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Initialize OneSignal
   */
  async initialize(): Promise<boolean> {
    if (!this.isPushSupported() || !this.oneSignalAppId) {
      return false
    }

    try {
      // OneSignal SDK will be loaded dynamically
      const OneSignal = window.OneSignal
      if (!OneSignal) {
        console.error('OneSignal SDK not loaded')
        return false
      }

      await OneSignal.init({
        appId: this.oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false, // We'll use our custom UI
        },
        promptOptions: {
          slidedown: {
            enabled: false, // We'll handle permission prompts manually
          },
        },
      })

      return true
    } catch (error) {
      console.error('Error initializing OneSignal:', error)
      return false
    }
  }

  /**
   * Request notification permission and subscribe
   */
  async subscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        console.error('Push notifications are not supported')
        return false
      }

      const OneSignal = window.OneSignal
      if (!OneSignal) {
        console.error('OneSignal not initialized')
        return false
      }

      // Request permission
      const permission = await OneSignal.Notifications.requestPermission()
      if (!permission) {
        console.log('Push notification permission denied')
        return false
      }

      // Get user ID from OneSignal
      const oneSignalUserId = await OneSignal.User.getOnesignalId()
      if (!oneSignalUserId) {
        console.error('Failed to get OneSignal user ID')
        return false
      }

      // Set external user ID to link with our user
      await OneSignal.login(userId)

      // Save subscription info to our database
      const subscriptionData: Omit<PushSubscriptionType, 'id' | 'created_at'> = {
        user_id: userId,
        endpoint: `onesignal:${oneSignalUserId}`, // Custom endpoint format
        p256dh: '', // Not needed for OneSignal
        auth: oneSignalUserId
      }

      const success = await this.notificationRepo.createPushSubscription(subscriptionData)
      
      if (success) {
        console.log('OneSignal subscription created successfully')
      }

      return success
    } catch (error) {
      console.error('Error subscribing to OneSignal:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const OneSignal = window.OneSignal
      if (!OneSignal) {
        return false
      }

      // Get user's subscriptions
      const subscriptions = await this.notificationRepo.getPushSubscriptions(userId)
      
      // Remove from OneSignal
      await OneSignal.logout()

      // Remove from our database
      for (const sub of subscriptions) {
        await this.notificationRepo.deletePushSubscription(sub.endpoint, userId)
      }
      
      console.log('OneSignal subscription removed successfully')
      return true
    } catch (error) {
      console.error('Error unsubscribing from OneSignal:', error)
      return false
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        return false
      }

      const OneSignal = window.OneSignal
      if (!OneSignal) {
        return false
      }

      const permission = await OneSignal.Notifications.getPermission()
      return permission === true
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  /**
   * Test notification (local)
   */
  async showTestNotification(): Promise<void> {
    if (!this.isPushSupported()) {
      throw new Error('Notifications not supported')
    }

    const OneSignal = window.OneSignal
    if (!OneSignal) {
      throw new Error('OneSignal not initialized')
    }

    const permission = await OneSignal.Notifications.requestPermission()
    if (!permission) {
      throw new Error('Notification permission denied')
    }

    // Show a test notification using OneSignal
    await OneSignal.Notifications.create({
      title: 'SOC AI Test',
      body: 'Push bildirimleri başarıyla kuruldu!',
      icon: '/soc-ai_logo.png',
      badge: '/soc-ai_logo.png',
      tag: 'test-notification'
    })
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(userId: string, title: string, message: string, url?: string): Promise<boolean> {
    try {
      // This would typically be done server-side via OneSignal REST API
      // For now, we'll just log it
      console.log(`Sending push notification to user ${userId}:`, { title, message, url })
      
      // In a real implementation, you would call OneSignal's REST API here
      // POST https://onesignal.com/api/v1/notifications
      
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()