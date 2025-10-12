/**
 * Offline Page
 * 
 * Shown when the app is offline and PWA service worker is active.
 */

'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Check if online
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      window.location.reload()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/soc-ai_logo.png"
            alt="SOC AI"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Bağlantı Yok</h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          İnternet bağlantınızı kontrol edin ve tekrar deneyin. 
          Bağlantı sağlandığında otomatik olarak yönlendirileceksiniz.
        </p>

        {/* Status */}
        {isOnline ? (
          <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-lg">
            Bağlantı yeniden sağlandı! Sayfa yenileniyor...
          </div>
        ) : (
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Çevrimdışı modundasınız
          </div>
        )}

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          className="w-full"
          disabled={!isOnline}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>

        {/* Tips */}
        <div className="mt-8 text-left space-y-2">
          <p className="text-sm font-semibold mb-3">Yapabilecekleriniz:</p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Wi-Fi veya mobil veri bağlantınızı kontrol edin</li>
            <li>Uçak modunun kapalı olduğundan emin olun</li>
            <li>Yönlendiricinizi yeniden başlatmayı deneyin</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

