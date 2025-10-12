'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { MainFeed } from '@/components/MainFeed'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { useFeedPosts } from '@/hooks/usePosts'
import { usePostInteractions } from '@/hooks/usePostInteractions'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const { posts, setPosts, refresh } = useFeedPosts(user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()
  const [isCreatePostCompact, setIsCreatePostCompact] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id) return
    try {
      await toggleLike(postId, user.id)
      refresh()
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  }, [user?.id, toggleLike, refresh])

  const handleRetweet = useCallback(async (postId: string) => {
    if (!user?.id) return
    try {
      const isRetweeted = await toggleRetweet(postId, user.id)
      if (isRetweeted) {
        // Move to top
        setPosts(prevPosts => {
          const retweetedPost = prevPosts.find(p => p.id === postId)
          if (retweetedPost) {
            const updatedPost = {
              ...retweetedPost,
              user_interaction_status: {
                ...retweetedPost.user_interaction_status,
                isRetweeted: true,
                isLiked: retweetedPost.user_interaction_status?.isLiked || false,
                isBookmarked: retweetedPost.user_interaction_status?.isBookmarked || false
              }
            }
            return [updatedPost, ...prevPosts.filter(p => p.id !== postId)]
          }
          return prevPosts
        })
      } else {
        refresh()
      }
    } catch (error) {
      console.error('Error toggling retweet:', error)
      throw error
    }
  }, [user?.id, toggleRetweet, setPosts, refresh])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user?.id) return
    try {
      await toggleBookmark(postId, user.id)
      refresh()
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      throw error
    }
  }, [user?.id, toggleBookmark, refresh])

  const handleComment = useCallback((postId: string) => {
    console.log('Comment on post:', postId)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar />

          <MainFeed
            posts={posts}
            onPostCreated={refresh}
            isCreatePostCompact={isCreatePostCompact}
            setIsCreatePostCompact={setIsCreatePostCompact}
            onLike={handleLike}
            onRetweet={handleRetweet}
            onBookmark={handleBookmark}
            onComment={handleComment}
            currentUserId={user.id}
            onDelete={refresh}
          />

          <RightSidebar />
        </div>
      </main>
    </div>
  )
}

