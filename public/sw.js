/**
 * Service Worker for SOC AI
 * 
 * Handles:
 * - Push notifications
 * - Background sync
 * - Offline caching
 */

const CACHE_NAME = 'soc-ai-v1'
const OFFLINE_URL = '/offline'

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching offline page')
      return cache.addAll([
        OFFLINE_URL,
        '/',
        '/soc-ai_logo.png'
      ]).catch(err => {
        console.error('[SW] Cache addAll error:', err)
      })
    })
  )
  
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
  }
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event)
  
  let data = {
    title: 'SOC AI',
    body: 'Yeni bildiriminiz var',
    icon: '/soc-ai_logo.png',
    badge: '/soc-ai_logo.png',
    tag: 'notification',
    requireInteraction: false
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/soc-ai_logo.png',
    badge: data.badge || '/soc-ai_logo.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    vibrate: [200, 100, 200],
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered', event.tag)
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  console.log('[SW] Syncing notifications')
  // Implementation for syncing notifications when back online
  return Promise.resolve()
}

// Message event for communication with client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[SW] Service worker loaded')

