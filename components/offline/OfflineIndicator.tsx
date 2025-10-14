'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'

export function OfflineIndicator() {
  const { isOnline, status } = useOfflineQueue()
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Auto-hide after 3 seconds when coming back online
    if (isOnline && status.hasPendingItems) {
      const timer = setTimeout(() => {
        setShowDetails(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, status.hasPendingItems])

  if (isOnline && !status.hasPendingItems) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-600">
                    Çevrimdışı değişiklikler senkronize ediliyor...
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    Çevrimdışısınız
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {status.queueLength > 0 && (
                <span className="text-xs text-muted-foreground">
                  {status.queueLength} işlem bekliyor
                </span>
              )}
              
              {status.postsLength > 0 && (
                <span className="text-xs text-muted-foreground">
                  {status.postsLength} taslak
                </span>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? 'Gizle' : 'Detaylar'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2">
                  {status.queueLength > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        {status.queueLength} işlem çevrimdışı kuyruğunda bekliyor
                      </span>
                    </div>
                  )}
                  
                  {status.postsLength > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        {status.postsLength} taslak gönderi çevrimdışı kaydedildi
                      </span>
                    </div>
                  )}

                  {!isOnline && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <WifiOff className="h-3 w-3" />
                      <span>
                        İnternet bağlantısı geri geldiğinde otomatik olarak senkronize edilecek
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
