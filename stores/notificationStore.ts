/**
 * Notification Store
 * 
 * Simple in-app notification system using Zustand.
 * No external packages required.
 */

import { create } from 'zustand'

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'reply'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  recipientId: string  // Bildirimi alan kişi
  actorId: string      // Bildirimi gönderen kişi
  actorName: string    // Bildirimi gönderen kişinin adı
  actorAvatar?: string // Bildirimi gönderen kişinin avatar'ı
  postId?: string
  commentId?: string
  timestamp: number
  isRead: boolean
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isRead: false,
    }

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
      unreadCount: state.unreadCount + 1,
    }))

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(notification.id)
    }, 5000)
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      }
    })
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    })
  },
}))
