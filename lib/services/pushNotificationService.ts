/**
 * Push Notification Service (Firebase FCM)
 * 
 * Manages web push notifications using Firebase Cloud Messaging.
 * No VAPID keys required - Firebase handles everything.
 */

import { notificationRepository } from '@/lib/repositories/notificationRepository'
import { getFCMToken, registerServiceWorker, onForegroundMessage } from '@/lib/firebase'
import type { PushSubscription as PushSubscriptionType } from '@/lib/types'

// Firebase message payload type
interface FirebaseMessagePayload {
  notification?: {
    title?: string
    body?: string
    icon?: string
    badge?: string
  }
  data?: Record<string, string>
  from?: string
  messageId?: string
  collapseKey?: string
}

export class PushNotificationService {
  private notificationRepo = notificationRepository

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Initialize Firebase FCM
   */
  async initialize(): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.error('Push notifications are not supported')
      return false
    }

    try {
      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        console.error('Failed to register service worker')
        return false
      }

      // Set up foreground message listener
      onForegroundMessage((payload) => {
        console.log('Foreground message received:', payload)
        // You can show a toast notification here
        this.showForegroundNotification(payload)
      })

      console.log('Firebase FCM initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing Firebase FCM:', error)
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

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Push notification permission denied')
        return false
      }

      // Get FCM token
      const fcmToken = await getFCMToken()
      if (!fcmToken) {
        console.error('Failed to get FCM token')
        return false
      }

      // Save subscription info to our database
      const subscriptionData: Omit<PushSubscriptionType, 'id' | 'created_at'> = {
        user_id: userId,
        endpoint: fcmToken, // FCM token as endpoint
        p256dh: '', // Not needed for Firebase FCM
        auth: fcmToken
      }

      const success = await this.notificationRepo.createPushSubscription(subscriptionData)
      
      if (success) {
        console.log('Firebase FCM subscription created successfully')
      }

      return success
    } catch (error) {
      console.error('Error subscribing to Firebase FCM:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      // Get user's subscriptions
      const subscriptions = await this.notificationRepo.getPushSubscriptions(userId)
      
      // Remove from our database
      for (const sub of subscriptions) {
        await this.notificationRepo.deletePushSubscription(sub.endpoint, userId)
      }
      
      console.log('Firebase FCM subscription removed successfully')
      return true
    } catch (error) {
      console.error('Error unsubscribing from Firebase FCM:', error)
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

      const permission = Notification.permission
      return permission === 'granted'
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  /**
   * Show foreground notification (when app is open)
   */
  private showForegroundNotification(payload: FirebaseMessagePayload): void {
    if (typeof window !== 'undefined') {
      // You can integrate with your toast system here
      console.log('Showing foreground notification:', payload)
      
      // Example: Show a custom toast notification
      const event = new CustomEvent('fcm-notification', {
        detail: payload
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Test notification (local)
   */
  async showTestNotification(): Promise<void> {
    if (!this.isPushSupported()) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    // Show a test notification
    new Notification('SOC AI Test', {
      body: 'Firebase FCM push bildirimleri başarıyla kuruldu!',
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
      // This would typically be done server-side via Firebase Admin SDK
      // For now, we'll just log it
      console.log(`Sending push notification to user ${userId}:`, { title, message, url })
      
      // In a real implementation, you would call Firebase Admin SDK here
      // or use the REST API endpoint we'll create
      
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()