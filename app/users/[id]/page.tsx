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
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { useUserProfile, useUpdateProfile, useImageUpload } from '@/hooks/useUserProfile'
import { useUserPosts } from '@/hooks/usePosts'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { deletePost } from '@/lib/posts'
import { PostWithAuthor } from '@/lib/types'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id: paramsId } = usePromise(params)
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const { user: dbUser, loading: userLoading, setUser: setDbUser } = useUserProfile(paramsId)
  const { 
    posts, 
    likedPosts, 
    favoritePosts,
    mediaPosts,
    setPosts,
    setLikedPosts,
    setFavoritePosts,
    setMediaPosts,
    loading: postsLoading, 
    refresh 
  } = useUserPosts(paramsId, user?.id)
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()
  const { updateProfile } = useUpdateProfile(paramsId)
  const { uploadImage: uploadAvatar } = useImageUpload(paramsId, 'avatar')
  const { uploadImage: uploadBanner } = useImageUpload(paramsId, 'banner')
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes' | 'favorites'>('posts')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isCompact, setIsCompact] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

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

  const updatePostInAllLists = (postId: string, updateFn: (post: PostWithAuthor) => PostWithAuthor) => {
    setPosts(prev => prev.map(p => p.id === postId ? updateFn(p) : p))
    setLikedPosts(prev => prev.map(p => p.id === postId ? updateFn(p) : p))
    setFavoritePosts(prev => prev.map(p => p.id === postId ? updateFn(p) : p))
    setMediaPosts(prev => prev.map(p => p.id === postId ? updateFn(p) : p))
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    
    const post = [...posts, ...likedPosts, ...favoritePosts, ...mediaPosts].find(p => p.id === postId)
    const isCurrentlyLiked = post?.user_interaction_status?.isLiked || false
    
    // If unliking from "Beğeniler" tab, remove from list
    if (isCurrentlyLiked && activeTab === 'likes') {
      setLikedPosts(prev => prev.filter(p => p.id !== postId))
      // Update in other lists
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likes_count: p.likes_count - 1,
        user_interaction_status: {
          isLiked: false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: p.user_interaction_status?.isBookmarked || false
        }
      } : p))
      setFavoritePosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likes_count: p.likes_count - 1,
        user_interaction_status: {
          isLiked: false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: p.user_interaction_status?.isBookmarked || false
        }
      } : p))
      setMediaPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likes_count: p.likes_count - 1,
        user_interaction_status: {
          isLiked: false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: p.user_interaction_status?.isBookmarked || false
        }
      } : p))
    } else {
      // Normal optimistic update
      updatePostInAllLists(postId, (post) => {
        const isLiked = post.user_interaction_status?.isLiked || false
        return {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          user_interaction_status: {
            isLiked: !isLiked,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: post.user_interaction_status?.isBookmarked || false
          }
        }
      })
    }
    
    try {
      await toggleLike(postId, user.id)
    } catch {
      // Revert on error
      if (isCurrentlyLiked && activeTab === 'likes') {
        // Re-add to liked posts
        if (post) {
          setLikedPosts(prev => [post, ...prev])
        }
      }
      updatePostInAllLists(postId, (post) => {
        return {
          ...post,
          likes_count: isCurrentlyLiked ? post.likes_count + 1 : post.likes_count - 1,
          user_interaction_status: {
            isLiked: isCurrentlyLiked,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: post.user_interaction_status?.isBookmarked || false
          }
        }
      })
    }
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    updatePostInAllLists(postId, (post) => {
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
    })
    
    try {
      await toggleRetweet(postId, user.id)
    } catch {
      // Revert on error
      updatePostInAllLists(postId, (post) => {
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
      })
    }
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.id) return
    
    const post = [...posts, ...likedPosts, ...favoritePosts, ...mediaPosts].find(p => p.id === postId)
    const isCurrentlyBookmarked = post?.user_interaction_status?.isBookmarked || false
    
    // If removing bookmark from "Favoriler" tab, remove from list
    if (isCurrentlyBookmarked && activeTab === 'favorites') {
      setFavoritePosts(prev => prev.filter(p => p.id !== postId))
      // Update in other lists
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        user_interaction_status: {
          isLiked: p.user_interaction_status?.isLiked || false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: false
        }
      } : p))
      setLikedPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        user_interaction_status: {
          isLiked: p.user_interaction_status?.isLiked || false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: false
        }
      } : p))
      setMediaPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        user_interaction_status: {
          isLiked: p.user_interaction_status?.isLiked || false,
          isRetweeted: p.user_interaction_status?.isRetweeted || false,
          isBookmarked: false
        }
      } : p))
    } else {
      // Normal optimistic update
      updatePostInAllLists(postId, (post) => {
        const isBookmarked = post.user_interaction_status?.isBookmarked || false
        return {
          ...post,
          user_interaction_status: {
            isLiked: post.user_interaction_status?.isLiked || false,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: !isBookmarked
          }
        }
      })
    }
    
    try {
      await toggleBookmark(postId, user.id)
    } catch {
      // Revert on error
      if (isCurrentlyBookmarked && activeTab === 'favorites') {
        // Re-add to favorites
        if (post) {
          setFavoritePosts(prev => [post, ...prev])
        }
      }
      updatePostInAllLists(postId, (post) => {
        return {
          ...post,
          user_interaction_status: {
            isLiked: post.user_interaction_status?.isLiked || false,
            isRetweeted: post.user_interaction_status?.isRetweeted || false,
            isBookmarked: isCurrentlyBookmarked
          }
        }
      })
    }
  }

  const handleDelete = (postId: string) => {
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!user?.id || !postToDelete) return

    // Close dialog
    setDeleteDialogOpen(false)

    // Optimistic update - remove from all lists
    const updateAllLists = (filterFn: (post: PostWithAuthor) => boolean) => {
      setPosts(prev => prev.filter(filterFn))
      setLikedPosts(prev => prev.filter(filterFn))
      setFavoritePosts(prev => prev.filter(filterFn))
      setMediaPosts(prev => prev.filter(filterFn))
    }

    updateAllLists(post => post.id !== postToDelete)

    try {
      const success = await deletePost(postToDelete, user.id)
      if (!success) {
        refresh()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      refresh()
    } finally {
      setPostToDelete(null)
    }
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

  const currentPosts = 
    activeTab === 'posts' ? posts 
    : activeTab === 'likes' ? likedPosts 
    : activeTab === 'media' ? mediaPosts
    : favoritePosts
  const emptyMessage =
    activeTab === 'posts'
      ? 'Henüz gönderi yok.'
      : activeTab === 'likes'
      ? 'Henüz beğeni yok.'
      : activeTab === 'media'
      ? 'Henüz medya yok.'
      : 'Henüz favori yok.'

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
            <LeftSidebar hideExtras />

            <div
              ref={scrollContainerRef}
              className="lg:col-span-3 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border pb-20"
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  )
}

