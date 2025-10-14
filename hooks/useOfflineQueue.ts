import { useState, useEffect, useCallback } from 'react'
import { offlineQueue, OfflinePost, OfflineQueueItem } from '@/lib/utils/offlineQueue'

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlinePosts, setOfflinePosts] = useState<OfflinePost[]>([])
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([])
  const [status, setStatus] = useState(offlineQueue.getStatus())

  // Update state when offline data changes
  const updateState = useCallback(() => {
    setOfflinePosts(offlineQueue.getOfflinePosts())
    setQueueItems(offlineQueue.getQueueItems())
    setStatus(offlineQueue.getStatus())
  }, [])

  useEffect(() => {
    // Initial load
    updateState()

    // Listen for online/offline status changes
    const handleOnlineStatusChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline)
      updateState()
    }

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'offline_queue' || event.key === 'offline_posts') {
        updateState()
      }
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      updateState()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updateState()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('offline-status-change', handleOnlineStatusChange as EventListener)
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('offline-status-change', handleOnlineStatusChange as EventListener)
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [updateState])

  const addOfflinePost = useCallback((post: Omit<OfflinePost, 'id' | 'created_at' | 'status' | 'retry_count'>) => {
    const id = offlineQueue.addOfflinePost(post)
    updateState()
    return id
  }, [updateState])

  const updatePostStatus = useCallback((postId: string, status: OfflinePost['status']) => {
    offlineQueue.updatePostStatus(postId, status)
    updateState()
  }, [updateState])

  const removeOfflinePost = useCallback((postId: string) => {
    offlineQueue.removeOfflinePost(postId)
    updateState()
  }, [updateState])

  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retry_count'>) => {
    const id = offlineQueue.addToQueue(item)
    updateState()
    return id
  }, [updateState])

  const clearAll = useCallback(() => {
    offlineQueue.clearAll()
    updateState()
  }, [updateState])

  return {
    isOnline,
    offlinePosts,
    queueItems,
    status,
    addOfflinePost,
    updatePostStatus,
    removeOfflinePost,
    addToQueue,
    clearAll,
    refresh: updateState
  }
}
