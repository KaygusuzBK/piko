'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, use as usePromise } from 'react'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfilePosts } from '@/components/profile/ProfilePosts'
import { useUserProfile, useUpdateProfile, useImageUpload } from '@/hooks/useUserProfile'
import { useUserPosts } from '@/hooks/usePosts'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { deletePost } from '@/lib/posts'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id: paramsId } = usePromise(params)
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const { user: dbUser, loading: userLoading, setUser: setDbUser } = useUserProfile(paramsId)
  const { posts, likedPosts, favoritePosts, loading: postsLoading, refresh } = useUserPosts(paramsId, user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()
  const { updateProfile } = useUpdateProfile(paramsId)
  const { uploadImage: uploadAvatar } = useImageUpload(paramsId, 'avatar')
  const { uploadImage: uploadBanner } = useImageUpload(paramsId, 'banner')
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes' | 'favorites'>('posts')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      const threshold = 40
      setIsCompact(el.scrollTop > threshold)
    }

    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const handleAvatarChange = async (file: File) => {
    if (!user?.id) return
    const url = await uploadAvatar(file)
    if (url) {
      const updated = await updateProfile({ avatar_url: url })
      if (updated) setDbUser(updated)
    }
  }

  const handleBannerChange = async (file: File) => {
    if (!user?.id) return
    const url = await uploadBanner(file)
    if (url) {
      const updated = await updateProfile({ banner_url: url })
      if (updated) setDbUser(updated)
    }
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    await toggleLike(postId, user.id)
    refresh()
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    await toggleRetweet(postId, user.id)
    refresh()
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.id) return
    await toggleBookmark(postId, user.id)
    refresh()
  }

  const handleDelete = async (postId: string) => {
    if (!user?.id) return
    await deletePost(postId, user.id)
    refresh()
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user || !dbUser) {
    return null
  }

  const isOwner = user.id === dbUser.id

  const currentPosts = activeTab === 'posts' ? posts : activeTab === 'likes' ? likedPosts : favoritePosts
  const emptyMessage =
    activeTab === 'posts'
      ? 'Henüz gönderi yok.'
      : activeTab === 'likes'
      ? 'Henüz beğeni yok.'
      : 'Henüz favori yok.'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar hideExtras />

          <div
            ref={scrollContainerRef}
            className="lg:col-span-3 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border"
          >
            <div className="sticky top-0 z-10 bg-background/60 backdrop-blur px-3 sm:px-4 py-2 flex items-center space-x-4 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold">{dbUser.name || 'Kullanıcı'}</h1>
                <p className="text-xs text-muted-foreground">
                  {posts.length || 0} {posts.length === 1 ? 'gönderi' : 'gönderi'}
                </p>
              </div>
            </div>

            <ProfileHeader
              user={dbUser}
              isOwner={isOwner}
              isCompact={isCompact}
              onAvatarChange={handleAvatarChange}
              onBannerChange={handleBannerChange}
            />

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <ProfilePosts
              posts={currentPosts}
              loading={postsLoading}
              emptyMessage={emptyMessage}
              currentUserId={user.id}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onBookmark={handleBookmark}
              onComment={() => {}}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

