/**
 * Push Notification Service
 * 
 * Manages web push notifications.
 * Handles subscription management and notification sending.
 */

import { notificationRepository } from '@/lib/repositories/notificationRepository'
import type { PushSubscription as PushSubscriptionType } from '@/lib/types'

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
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      throw new Error('Push notifications are not supported')
    }

    return await Notification.requestPermission()
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission | null {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null
    }
    return Notification.permission
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        console.error('Push notifications are not supported')
        return false
      }

      // Request permission first
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.log('Push notification permission denied')
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return false
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer
      })

      // Save subscription to database
      const subscriptionData: Omit<PushSubscriptionType, 'id' | 'created_at'> = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      }

      const success = await this.notificationRepo.createPushSubscription(subscriptionData)
      
      if (success) {
        console.log('Push subscription created successfully')
      }

      return success
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Remove from database
        await this.notificationRepo.deletePushSubscription(subscription.endpoint, userId)
        
        console.log('Push subscription removed successfully')
        return true
      }

      return false
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
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

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      return subscription !== null
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.isPushSupported()) {
        return null
      }

      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  }

  /**
   * Test notification (local)
   */
  async showTestNotification(): Promise<void> {
    if (!this.isPushSupported()) {
      throw new Error('Notifications not supported')
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    new Notification('SOC AI Test', {
      body: 'Push bildirimleri başarıyla kuruldu!',
      icon: '/soc-ai_logo.png',
      badge: '/soc-ai_logo.png',
      tag: 'test-notification'
    })
  }

  // Helper methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''
    
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()

