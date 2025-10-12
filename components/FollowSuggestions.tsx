'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2 } from 'lucide-react'
import { useFollowSuggestions, useToggleFollow } from '@/hooks/useFollow'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FollowSuggestionsProps {
  currentUserId: string | undefined
  limit?: number
}

export function FollowSuggestions({ currentUserId, limit = 5 }: FollowSuggestionsProps) {
  const { suggestions, loading, refresh } = useFollowSuggestions(currentUserId, limit)
  const { toggleFollow } = useToggleFollow()
  const router = useRouter()
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (!currentUserId) return

    setFollowingIds(prev => new Set(prev).add(userId))
    const success = await toggleFollow(currentUserId, userId)
    
    if (success) {
      await refresh()
    }
    
    setFollowingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  if (!currentUserId || loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Kimi takip etmeli?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Kimi takip etmeli?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
            onClick={() => handleUserClick(user.id)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'User'} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user.name || 'İsimsiz'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username || 'kullanici'}
                </p>
                {user.bio && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={(e) => handleFollow(e, user.id)}
              disabled={followingIds.has(user.id)}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              {followingIds.has(user.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Takip Et
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

