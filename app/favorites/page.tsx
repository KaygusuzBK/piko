'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { PostCard } from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'
import { useFavoritePosts } from '@/hooks/usePosts'
import { usePostInteractions } from '@/hooks/usePostInteractions'

export default function FavoritesPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const { posts: favorites, loading: isLoading, refresh } = useFavoritePosts(user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id) return
    await toggleLike(postId, user.id)
    refresh()
  }, [user?.id, toggleLike, refresh])

  const handleRetweet = useCallback(async (postId: string) => {
    if (!user?.id) return
    await toggleRetweet(postId, user.id)
    refresh()
  }, [user?.id, toggleRetweet, refresh])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user?.id) return
    await toggleBookmark(postId, user.id)
    refresh()
  }, [user?.id, toggleBookmark, refresh])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar />

          <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border">
            <div className="sticky top-0 z-10 bg-soc-ai-header/60 backdrop-blur px-3 sm:px-4 py-3">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">Favoriler</h1>
            </div>

            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Favoriler yükleniyor...</div>
            ) : favorites.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">Henüz favori yok.</div>
            ) : (
              <div className="space-y-2 sm:space-y-3 p-0">
                {favorites.map((post) => (
                  <div key={post.id} className="px-0">
                    <PostCard
                      post={post}
                      onLike={handleLike}
                      onRetweet={handleRetweet}
                      onBookmark={handleBookmark}
                      onComment={() => {}}
                      canDelete={user.id === post.author_id}
                      onDelete={() => {}}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  )
}

