/**
 * useNotifications Hook
 * 
 * React hooks for notification management.
 * Provides hooks for fetching, subscribing, and managing notifications.
 */

import { useState, useEffect, useCallback } from 'react'
import { notificationService } from '@/lib/services/notificationService'
import { realtimeService } from '@/lib/services/realtimeService'
import { userRepository } from '@/lib/repositories/userRepository'
import type {
  NotificationWithActor,
  NotificationPreferences,
  Notification
} from '@/lib/types'
import { useToast } from './useToast'

/**
 * Hook for fetching user notifications with pagination
 */
export function useNotifications(userId?: string, limit: number = 20, offset: number = 0) {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await notificationService.getUserNotifications(userId, limit, offset)
      setNotifications(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Bildirimler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [userId, limit, offset])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const refresh = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    refresh
  }
}

/**
 * Hook for unread notification count
 */
export function useUnreadCount(userId?: string) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const unreadCount = await notificationService.getUnreadCount(userId)
      setCount(unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  const refresh = useCallback(() => {
    fetchCount()
  }, [fetchCount])

  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(prev => Math.max(0, prev - 1))
  }, [])

  const reset = useCallback(() => {
    setCount(0)
  }, [])

  return {
    count,
    loading,
    refresh,
    increment,
    decrement,
    reset
  }
}

/**
 * Hook for real-time notification subscription
 */
export function useNotificationSubscription(userId?: string, onNewNotification?: (notification: Notification) => void) {
  const toast = useToast()

  useEffect(() => {
    if (!userId) return

    console.log('Setting up notification subscription for user:', userId)

    const unsubscribe = realtimeService.subscribeToNotifications(userId, (notification) => {
      console.log('New notification received in hook:', notification)
      
      // Show toast notification
      toast.info('Yeni bildirim', {
        description: notification.message,
        duration: 4000
      })

      // Call custom callback if provided
      if (onNewNotification) {
        onNewNotification(notification)
      }
    })

    return () => {
      console.log('Cleaning up notification subscription')
      unsubscribe()
    }
  }, [userId, onNewNotification, toast])
}

/**
 * Hook for marking notifications as read
 */
export function useMarkAsRead() {
  const [loading, setLoading] = useState(false)

  const markAsRead = useCallback(async (notificationId: string, userId: string) => {
    try {
      setLoading(true)
      const success = await notificationService.markNotificationAsRead(notificationId, userId)
      return success
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const success = await notificationService.markAllAsRead(userId)
      return success
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    markAsRead,
    markAllAsRead,
    loading
  }
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const prefs = await userRepository.getNotificationPreferences(userId)
      setPreferences(prefs)
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return false

    try {
      setUpdating(true)
      const success = await userRepository.updateNotificationPreferences(userId, newPreferences)
      
      if (success) {
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)
      }
      
      return success
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      return false
    } finally {
      setUpdating(false)
    }
  }, [userId])

  return {
    preferences,
    loading,
    updating,
    updatePreferences,
    refresh: fetchPreferences
  }
}

/**
 * Hook for deleting notifications
 */
export function useDeleteNotification() {
  const [loading, setLoading] = useState(false)

  const deleteNotification = useCallback(async (notificationId: string, userId: string) => {
    try {
      setLoading(true)
      const success = await notificationService.deleteNotification(notificationId, userId)
      return success
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    deleteNotification,
    loading
  }
}

