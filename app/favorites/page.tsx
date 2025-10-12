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
  const { posts: favorites, setPosts: setFavorites, loading: isLoading } = useFavoritePosts(user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    setFavorites(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const isCurrentlyLiked = post.user_interaction_status?.isLiked || false
        return {
          ...post,
          likes_count: isCurrentlyLiked ? post.likes_count - 1 : post.likes_count + 1,
          user_interaction_status: {
            isLiked: !isCurrentlyLiked,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: post.user_interaction_status?.isBookmarked || false
          }
        }
      }
      return post
    }))
    
    try {
      await toggleLike(postId, user.id)
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setFavorites(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const isCurrentlyLiked = post.user_interaction_status?.isLiked || false
          return {
            ...post,
            likes_count: isCurrentlyLiked ? post.likes_count - 1 : post.likes_count + 1,
            user_interaction_status: {
              isLiked: !isCurrentlyLiked,
              isRetweeted: post.user_interaction_status?.isRetweeted || false,
              isBookmarked: post.user_interaction_status?.isBookmarked || false
            }
          }
        }
        return post
      }))
    }
  }, [user?.id, toggleLike, setFavorites])

  const handleRetweet = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    setFavorites(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const isCurrentlyRetweeted = post.user_interaction_status?.isRetweeted || false
        return {
          ...post,
          retweets_count: isCurrentlyRetweeted ? post.retweets_count - 1 : post.retweets_count + 1,
          user_interaction_status: {
            isLiked: post.user_interaction_status?.isLiked || false,
            isRetweeted: !isCurrentlyRetweeted,
            isBookmarked: post.user_interaction_status?.isBookmarked || false
          }
        }
      }
      return post
    }))
    
    try {
      await toggleRetweet(postId, user.id)
    } catch (error) {
      console.error('Error toggling retweet:', error)
      // Revert on error
      setFavorites(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const isCurrentlyRetweeted = post.user_interaction_status?.isRetweeted || false
          return {
            ...post,
            retweets_count: isCurrentlyRetweeted ? post.retweets_count - 1 : post.retweets_count + 1,
            user_interaction_status: {
              isLiked: post.user_interaction_status?.isLiked || false,
              isRetweeted: !isCurrentlyRetweeted,
              isBookmarked: post.user_interaction_status?.isBookmarked || false
            }
          }
        }
        return post
      }))
    }
  }, [user?.id, toggleRetweet, setFavorites])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    setFavorites(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const isCurrentlyBookmarked = post.user_interaction_status?.isBookmarked || false
        return {
          ...post,
          user_interaction_status: {
            isLiked: post.user_interaction_status?.isLiked || false,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: !isCurrentlyBookmarked
          }
        }
      }
      return post
    }))
    
    try {
      await toggleBookmark(postId, user.id)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      // Revert on error
      setFavorites(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const isCurrentlyBookmarked = post.user_interaction_status?.isBookmarked || false
          return {
            ...post,
            user_interaction_status: {
              isLiked: post.user_interaction_status?.isLiked || false,
              isRetweeted: post.user_interaction_status?.isRetweeted || false,
              isBookmarked: !isCurrentlyBookmarked
            }
          }
        }
        return post
      }))
    }
  }, [user?.id, toggleBookmark, setFavorites])

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

          <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border pb-20">
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

