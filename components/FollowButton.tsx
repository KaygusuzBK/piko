'use client'

import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useFollow } from '@/hooks/useFollow'

interface FollowButtonProps {
  currentUserId: string | undefined
  targetUserId: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

export function FollowButton({
  currentUserId,
  targetUserId,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = '',
}: FollowButtonProps) {
  const { followStatus, loading, toggleFollow } = useFollow(currentUserId, targetUserId)

  // Don't show button if user is viewing their own profile
  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await toggleFollow()
  }

  const isFollowing = followStatus.isFollowing
  const isFollowedBy = followStatus.isFollowedBy

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={`transition-all duration-200 ${className} ${
        isFollowing
          ? 'hover:bg-red-500 hover:text-white hover:border-red-500 group'
          : 'bg-primary hover:bg-primary/90'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>İşleniyor...</span>
        </>
      ) : isFollowing ? (
        <>
          {showIcon && (
            <UserCheck className="h-4 w-4 mr-2 group-hover:hidden" />
          )}
          {showIcon && (
            <span className="hidden group-hover:inline-block mr-2">✕</span>
          )}
          <span className="group-hover:hidden">Takip Ediliyor</span>
          <span className="hidden group-hover:inline">Takibi Bırak</span>
        </>
      ) : (
        <>
          {showIcon && <UserPlus className="h-4 w-4 mr-2" />}
          <span>Takip Et</span>
        </>
      )}
      {isFollowedBy && !isFollowing && (
        <span className="ml-2 text-xs opacity-70">(Seni takip ediyor)</span>
      )}
    </Button>
  )
}

