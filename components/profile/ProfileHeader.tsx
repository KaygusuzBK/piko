import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Edit2 } from 'lucide-react'
import { User } from '@/lib/types'
import { FollowButton } from '@/components/FollowButton'
import { useRouter } from 'next/navigation'

interface ProfileHeaderProps {
  user: User
  isOwner: boolean
  isCompact: boolean
  currentUserId?: string
  onBannerChange?: (file: File) => void
  onAvatarChange?: (file: File) => void
}

export function ProfileHeader({ user, isOwner, isCompact, currentUserId, onBannerChange, onAvatarChange }: ProfileHeaderProps) {
  const router = useRouter()

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onBannerChange) {
      onBannerChange(file)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAvatarChange) {
      onAvatarChange(file)
    }
  }

  const handleFollowingClick = () => {
    router.push(`/users/${user.id}/following`)
  }

  const handleFollowersClick = () => {
    router.push(`/users/${user.id}/followers`)
  }

  return (
    <div className={`transition-all duration-300 ${isCompact ? 'pb-2' : 'pb-4'}`}>
      {/* Banner */}
      <div className="relative group">
        <div
          className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-all duration-300 ${
            isCompact ? 'h-20 sm:h-24' : 'h-32 sm:h-40 lg:h-48'
          }`}
          style={user.banner_url ? { backgroundImage: `url(${user.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        {isOwner && (
          <label className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-lg bg-black/40 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
            <span className="inline-flex items-center gap-2 text-white font-medium px-3 py-1.5 rounded-full bg-black/60">
              <Camera className="h-4 w-4" /> Kapağı değiştir
            </span>
          </label>
        )}
      </div>

      {/* Avatar & User Info */}
      <div className="px-3 sm:px-4">
        <div className="flex items-start justify-between">
          <div className="relative group">
            <Avatar className={`border-4 border-background transition-all duration-300 ${isCompact ? 'w-24 h-24 -mt-12' : 'w-28 h-28 lg:w-32 lg:h-32 -mt-16 lg:-mt-20'}`}>
              <AvatarImage
                src={user.avatar_url}
                alt={user.name || 'Kullanıcı'}
                className="object-cover"
              />
              <AvatarFallback className={`${isCompact ? 'text-lg' : 'text-2xl'}`}>
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <label className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-full bg-black/40 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <span className="inline-flex items-center gap-2 text-white font-medium px-3 py-1.5 rounded-full bg-black/60">
                  <Edit2 className="h-4 w-4" /> Avatarı değiştir
                </span>
              </label>
            )}
          </div>

          {!isCompact && (
            isOwner ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {}}
              >
                Profili Düzenle
              </Button>
            ) : (
              <div className="mt-2">
                <FollowButton
                  currentUserId={currentUserId}
                  targetUserId={user.id}
                  size="sm"
                />
              </div>
            )
          )}
        </div>

        {!isCompact && (
          <div className="mt-3 space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold">{user.name || 'İsim belirtilmemiş'}</h2>
            <p className="text-sm text-muted-foreground">@{user.username || 'kullanici'}</p>
            {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
            {(user.website || user.location) && (
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                {user.location && <span>📍 {user.location}</span>}
                {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:underline">🔗 {user.website}</a>}
              </div>
            )}
            {/* Follow Stats */}
            <div className="flex gap-4 mt-3 text-sm">
              <button 
                onClick={handleFollowingClick}
                className="hover:underline transition-colors cursor-pointer"
              >
                <span className="font-bold">{user.following_count || 0}</span>{' '}
                <span className="text-muted-foreground">Takip Edilen</span>
              </button>
              <button 
                onClick={handleFollowersClick}
                className="hover:underline transition-colors cursor-pointer"
              >
                <span className="font-bold">{user.followers_count || 0}</span>{' '}
                <span className="text-muted-foreground">Takipçi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

