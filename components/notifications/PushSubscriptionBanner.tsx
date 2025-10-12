/**
 * PushSubscriptionBanner Component (Firebase FCM)
 * 
 * Banner to request push notification permission from users.
 * Uses Firebase FCM instead of OneSignal or VAPID.
 */

'use client'

import { useState, useEffect } from 'react'
import { pushNotificationService } from '@/lib/services/pushNotificationService'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks'

export function PushSubscriptionBanner() {
  const { user } = useAuthStore()
  const toast = useToast()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      // Don't show if user is not logged in
      if (!user) {
        setShow(false)
        return
      }

      // Don't show if push is not supported
      if (!pushNotificationService.isPushSupported()) {
        setShow(false)
        return
      }

      // Check notification permission
      if (Notification.permission === 'granted') {
        setShow(false)
        return
      }

      // Don't show if permission is denied
      if (Notification.permission === 'denied') {
        setShow(false)
        return
      }

      // Check if user dismissed the banner
      const dismissed = localStorage.getItem('push-banner-dismissed')
      if (dismissed === 'true') {
        setShow(false)
        return
      }

      // Show the banner
      setShow(true)
    }

    checkSubscription()
  }, [user])

  const handleSubscribe = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Initialize Firebase FCM first
      const initialized = await pushNotificationService.initialize()
      if (!initialized) {
        toast.error('Firebase FCM başlatılamadı', {
          description: 'Lütfen sayfayı yenileyin ve tekrar deneyin'
        })
        return
      }

      // Subscribe to push notifications
      const success = await pushNotificationService.subscribe(user.id)

      if (success) {
        toast.success('Push bildirimleri aktif!', {
          description: 'Artık önemli güncellemelerden haberdar olacaksınız'
        })
        setShow(false)
      } else {
        toast.error('Push bildirimleri etkinleştirilemedi', {
          description: 'Lütfen tarayıcı ayarlarınızı kontrol edin'
        })
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
      toast.error('Bir hata oluştu', {
        description: 'Push bildirimleri etkinleştirilemedi'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('push-banner-dismissed', 'true')
    setShow(false)
  }

  if (!show) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            Push Bildirimlerini Aç
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Beğeniler, yorumlar ve yeni takipçiler hakkında anında bildirim alın
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={loading}
              className="text-xs h-8"
            >
              {loading ? 'Etkinleştiriliyor...' : 'Etkinleştir'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs h-8"
            >
              Daha sonra
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}