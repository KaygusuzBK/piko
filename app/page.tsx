'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { MainFeed } from '@/components/MainFeed'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { PushSubscriptionBanner } from '@/components/notifications/PushSubscriptionBanner'
import { useFeedPosts } from '@/hooks/usePosts'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { deletePost } from '@/lib/posts'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const { posts, setPosts, refresh } = useFeedPosts(user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()
  const [isCreatePostCompact, setIsCreatePostCompact] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => {
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
      setPosts(prevPosts => prevPosts.map(post => {
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
      throw error
    }
  }, [user?.id, toggleLike, setPosts])

  const handleRetweet = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    try {
      const isRetweeted = await toggleRetweet(postId, user.id)
      if (isRetweeted) {
        // Move to top and update
        setPosts(prevPosts => {
          const retweetedPost = prevPosts.find(p => p.id === postId)
          if (retweetedPost) {
            const updatedPost = {
              ...retweetedPost,
              retweets_count: retweetedPost.retweets_count + 1,
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
        // Just update the count
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              retweets_count: post.retweets_count - 1,
              user_interaction_status: {
                isLiked: post.user_interaction_status?.isLiked || false,
                isRetweeted: false,
                isBookmarked: post.user_interaction_status?.isBookmarked || false
              }
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error toggling retweet:', error)
      throw error
    }
  }, [user?.id, toggleRetweet, setPosts])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => {
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
      setPosts(prevPosts => prevPosts.map(post => {
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
      throw error
    }
  }, [user?.id, toggleBookmark, setPosts])

  const handleComment = useCallback((postId: string) => {
    console.log('Comment on post:', postId)
  }, [])

  const handleDelete = useCallback((postId: string) => {
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!user?.id || !postToDelete) return

    // Close dialog
    setDeleteDialogOpen(false)

    // Optimistic update - remove from UI immediately
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete))

    try {
      const success = await deletePost(postToDelete, user.id)
      if (!success) {
        // Revert on error
        refresh()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      refresh()
    } finally {
      setPostToDelete(null)
    }
  }, [user?.id, postToDelete, setPosts, refresh])

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
    <>
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
              onDelete={handleDelete}
            />

            <RightSidebar />
          </div>
        </main>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      <PushSubscriptionBanner />
    </>
  )
}

