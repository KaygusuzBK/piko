/**
 * Offline Queue Utilities
 * 
 * Handles offline functionality, background sync, and offline post drafts.
 */

import { PostWithAuthor } from '@/lib/types'

export interface OfflinePost {
  id: string
  content: string
  image_urls?: string[]
  type: 'text' | 'media'
  author_id: string
  created_at: string
  status: 'draft' | 'pending' | 'failed'
  retry_count: number
  last_retry?: string
}

export interface OfflineQueueItem {
  id: string
  type: 'post' | 'like' | 'comment' | 'retweet' | 'follow'
  data: any
  timestamp: number
  retry_count: number
  max_retries: number
}

class OfflineQueue {
  private queue: OfflineQueueItem[] = []
  private posts: OfflinePost[] = []
  private isOnline: boolean = true

  constructor() {
    this.loadFromStorage()
    this.setupOnlineListener()
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processQueue()
        this.notifyOnlineStatus(true)
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.notifyOnlineStatus(false)
      })

      // Check initial status
      this.isOnline = navigator.onLine
    }
  }

  /**
   * Add item to offline queue
   */
  addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retry_count'>): string {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      timestamp: Date.now(),
      retry_count: 0,
      ...item
    }

    this.queue.push(queueItem)
    this.saveToStorage()

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue()
    }

    return queueItem.id
  }

  /**
   * Add offline post draft
   */
  addOfflinePost(post: Omit<OfflinePost, 'id' | 'created_at' | 'status' | 'retry_count'>): string {
    const offlinePost: OfflinePost = {
      id: this.generateId(),
      created_at: new Date().toISOString(),
      status: 'draft',
      retry_count: 0,
      ...post
    }

    this.posts.push(offlinePost)
    this.saveToStorage()

    return offlinePost.id
  }

  /**
   * Update offline post status
   */
  updatePostStatus(postId: string, status: OfflinePost['status']) {
    const post = this.posts.find(p => p.id === postId)
    if (post) {
      post.status = status
      if (status === 'failed') {
        post.retry_count++
        post.last_retry = new Date().toISOString()
      }
      this.saveToStorage()
    }
  }

  /**
   * Remove offline post
   */
  removeOfflinePost(postId: string) {
    this.posts = this.posts.filter(p => p.id !== postId)
    this.saveToStorage()
  }

  /**
   * Get offline posts
   */
  getOfflinePosts(): OfflinePost[] {
    return [...this.posts]
  }

  /**
   * Get queue items
   */
  getQueueItems(): OfflineQueueItem[] {
    return [...this.queue]
  }

  /**
   * Process offline queue
   */
  async processQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return
    }

    const itemsToProcess = [...this.queue]
    
    for (const item of itemsToProcess) {
      try {
        await this.processQueueItem(item)
        this.removeFromQueue(item.id)
      } catch (error) {
        console.error('Failed to process queue item:', error)
        item.retry_count++
        
        if (item.retry_count >= item.max_retries) {
          this.removeFromQueue(item.id)
        } else {
          // Exponential backoff
          const delay = Math.pow(2, item.retry_count) * 1000
          setTimeout(() => {
            this.processQueue()
          }, delay)
        }
      }
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: OfflineQueueItem) {
    switch (item.type) {
      case 'post':
        await this.processPost(item.data)
        break
      case 'like':
        await this.processLike(item.data)
        break
      case 'comment':
        await this.processComment(item.data)
        break
      case 'retweet':
        await this.processRetweet(item.data)
        break
      case 'follow':
        await this.processFollow(item.data)
        break
      default:
        throw new Error(`Unknown queue item type: ${item.type}`)
    }
  }

  /**
   * Process post creation
   */
  private async processPost(data: any) {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Process like action
   */
  private async processLike(data: any) {
    const response = await fetch(`/api/posts/${data.postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to like post: ${response.statusText}`)
    }
  }

  /**
   * Process comment action
   */
  private async processComment(data: any) {
    const response = await fetch(`/api/posts/${data.postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to comment on post: ${response.statusText}`)
    }
  }

  /**
   * Process retweet action
   */
  private async processRetweet(data: any) {
    const response = await fetch(`/api/posts/${data.postId}/retweet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to retweet post: ${response.statusText}`)
    }
  }

  /**
   * Process follow action
   */
  private async processFollow(data: any) {
    const response = await fetch(`/api/users/${data.userId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to follow user: ${response.statusText}`)
    }
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(itemId: string) {
    this.queue = this.queue.filter(item => item.id !== itemId)
    this.saveToStorage()
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save to localStorage
   */
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('offline_queue', JSON.stringify(this.queue))
        localStorage.setItem('offline_posts', JSON.stringify(this.posts))
      } catch (error) {
        console.error('Failed to save offline data:', error)
      }
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const queueData = localStorage.getItem('offline_queue')
        const postsData = localStorage.getItem('offline_posts')

        if (queueData) {
          this.queue = JSON.parse(queueData)
        }

        if (postsData) {
          this.posts = JSON.parse(postsData)
        }
      } catch (error) {
        console.error('Failed to load offline data:', error)
        this.queue = []
        this.posts = []
      }
    }
  }

  /**
   * Clear all offline data
   */
  clearAll() {
    this.queue = []
    this.posts = []
    this.saveToStorage()
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      postsLength: this.posts.length,
      hasPendingItems: this.queue.length > 0 || this.posts.some(p => p.status === 'pending')
    }
  }

  /**
   * Notify online status change
   */
  private notifyOnlineStatus(isOnline: boolean) {
    // Dispatch custom event for components to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-status-change', {
        detail: { isOnline }
      }))
    }
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue()

// Utility functions
export const isOnline = () => {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

export const addToOfflineQueue = (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retry_count'>) => {
  return offlineQueue.addToQueue(item)
}

export const addOfflinePost = (post: Omit<OfflinePost, 'id' | 'created_at' | 'status' | 'retry_count'>) => {
  return offlineQueue.addOfflinePost(post)
}

export const getOfflinePosts = () => {
  return offlineQueue.getOfflinePosts()
}

export const getOfflineStatus = () => {
  return offlineQueue.getStatus()
}
