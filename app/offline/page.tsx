/**
 * Offline Page
 * 
 * Shown when the app is offline and PWA service worker is active.
 */

'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, FileText, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import Image from 'next/image'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const { offlinePosts, queueItems, status, clearAll } = useOfflineQueue()

  useEffect(() => {
    // Check if online
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Don't auto-reload, let user see the sync process
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/soc-ai_logo.png"
              alt="SOC AI"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">Çevrimdışı Mod</h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            İnternet bağlantınız yok, ancak çevrimdışı içeriklerinizi görüntüleyebilirsiniz.
          </p>

          {/* Status */}
          {isOnline ? (
            <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-lg">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Bağlantı yeniden sağlandı! Değişiklikler senkronize ediliyor...
            </div>
          ) : (
            <div className="mb-4 p-3 bg-orange-500/10 text-orange-600 rounded-lg">
              <Clock className="h-4 w-4 inline mr-2" />
              Çevrimdışı modundasınız
            </div>
          )}
        </div>

        {/* Offline Content */}
        <div className="space-y-6">
          {/* Offline Posts */}
          {offlinePosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Çevrimdışı Taslaklar ({offlinePosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {offlinePosts.map((post) => (
                  <div key={post.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                      <Badge variant={post.status === 'draft' ? 'secondary' : 'destructive'}>
                        {post.status === 'draft' ? 'Taslak' : 'Başarısız'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Queue Items */}
          {queueItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Bekleyen İşlemler ({queueItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {queueItems.map((item) => (
                  <div key={item.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {item.type === 'post' ? 'Gönderi' : 
                         item.type === 'like' ? 'Beğeni' :
                         item.type === 'comment' ? 'Yorum' :
                         item.type === 'retweet' ? 'Retweet' :
                         item.type === 'follow' ? 'Takip' : item.type}
                      </span>
                      <Badge variant="outline">
                        {item.retry_count} deneme
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(item.timestamp).toISOString())}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {offlinePosts.length === 0 && queueItems.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Çevrimdışı İçerik Yok</h3>
                <p className="text-muted-foreground mb-4">
                  Henüz çevrimdışı taslak veya bekleyen işlem bulunmuyor.
                </p>
                <p className="text-sm text-muted-foreground">
                  İnternet bağlantınız olmadığında oluşturduğunuz içerikler burada görünecek.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleRetry}
              className="flex-1"
              disabled={!isOnline}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isOnline ? 'Senkronize Et' : 'Tekrar Dene'}
            </Button>
            
            {(offlinePosts.length > 0 || queueItems.length > 0) && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="flex-1"
              >
                Temizle
              </Button>
            )}
          </div>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Çevrimdışı Mod İpuçları</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Çevrimdışıyken oluşturduğunuz gönderiler otomatik olarak taslak olarak kaydedilir</li>
                <li>Beğeni, yorum ve takip işlemleri çevrimdışı kuyruğunda bekler</li>
                <li>İnternet bağlantısı geri geldiğinde tüm işlemler otomatik olarak senkronize edilir</li>
                <li>Çevrimdışı içeriklerinizi bu sayfadan görüntüleyebilir ve yönetebilirsiniz</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

