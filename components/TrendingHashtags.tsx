'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Hash } from 'lucide-react'
import { useTrendingHashtags } from '@/hooks/useHashtags'
import { useRouter } from 'next/navigation'

interface TrendingHashtagsProps {
  limit?: number
}

export function TrendingHashtags({ limit = 5 }: TrendingHashtagsProps) {
  const { data: hashtags = [], isLoading: loading } = useTrendingHashtags(limit)
  const router = useRouter()

  const handleHashtagClick = (hashtagName: string) => {
    router.push(`/hashtags/${hashtagName}`)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Olan Konular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-8 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hashtags.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trend Olan Konular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            Henüz trend olan konu yok
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trend Olan Konular
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hashtags.map((hashtag, index) => (
          <div
            key={hashtag.name}
            className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
            onClick={() => handleHashtagClick(hashtag.name)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-bold text-primary">
                {index + 1}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {hashtag.name}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex-shrink-0">
              {hashtag.usage_count} gönderi
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
