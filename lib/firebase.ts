/**
 * Firebase Configuration
 * 
 * Firebase FCM setup for push notifications.
 * No VAPID keys required - Firebase handles everything.
 */

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// Firebase message payload types
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: ReturnType<typeof getMessaging> | null = null

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}

export { messaging }

// Service worker registration for Firebase
export const registerServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Firebase service worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Firebase service worker registration failed:', error)
      return null
    }
  }
  return null
}

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.error('Firebase messaging not initialized')
    return null
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })
    
    if (token) {
      console.log('FCM token:', token)
      return token
    } else {
      console.log('No registration token available.')
      return null
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error)
    return null
  }
}

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: FirebaseMessagePayload) => void) => {
  if (!messaging) {
    console.error('Firebase messaging not initialized')
    return
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload)
    callback(payload)
  })
}
