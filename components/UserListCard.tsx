'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FollowButton } from '@/components/FollowButton'
import { useRouter } from 'next/navigation'
import type { FollowUser } from '@/lib/types/follow.types'

interface UserListCardProps {
  user: FollowUser
  currentUserId: string | undefined
  showFollowButton?: boolean
}

export function UserListCard({ user, currentUserId, showFollowButton = true }: UserListCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/users/${user.id}`)
  }

  const isOwnProfile = currentUserId === user.id

  return (
    <div className="flex items-start justify-between p-4 hover:bg-accent/50 transition-colors border-b border-border last:border-b-0">
      <div
        className="flex items-start space-x-3 flex-1 cursor-pointer"
        onClick={handleClick}
      >
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'User'} />
          <AvatarFallback className="text-lg">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate hover:underline">
              {user.name || 'İsimsiz'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            @{user.username || 'kullanici'}
          </p>
          {user.bio && (
            <p className="text-sm text-foreground mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span>
              <span className="font-bold text-foreground">{user.following_count || 0}</span> Takip
            </span>
            <span>
              <span className="font-bold text-foreground">{user.followers_count || 0}</span> Takipçi
            </span>
          </div>
        </div>
      </div>

      {showFollowButton && !isOwnProfile && (
        <div className="ml-3 flex-shrink-0">
          <FollowButton
            currentUserId={currentUserId}
            targetUserId={user.id}
            size="sm"
            showIcon={false}
          />
        </div>
      )}
    </div>
  )
}

