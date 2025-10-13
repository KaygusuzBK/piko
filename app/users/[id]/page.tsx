'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, use as usePromise } from 'react'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
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
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop
        setIsCompact(scrollTop > 100)
      }
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleAvatarChange = async (file: File) => {
    const url = await uploadAvatar(file)
    if (url) {
      const updated = await updateProfile({ avatar_url: url })
      if (updated) setDbUser(updated)
    }
  }

  const handleBannerChange = async (file: File) => {
    const url = await uploadBanner(file)
    if (url) {
      const updated = await updateProfile({ banner_url: url })
      if (updated) setDbUser(updated)
    }
  }

  const updatePostInAllLists = (postId: string, updates: Record<string, unknown>) => {
    setPosts(prev => prev.map(post => post.id === postId ? { ...post, ...updates } : post))
    setLikedPosts(prev => prev.map(post => post.id === postId ? { ...post, ...updates } : post))
    setFavoritePosts(prev => prev.map(post => post.id === postId ? { ...post, ...updates } : post))
    setMediaPosts(prev => prev.map(post => post.id === postId ? { ...post, ...updates } : post))
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    
    const currentPost = posts.find(p => p.id === postId)
    if (!currentPost) return
    
    // Optimistic update
    updatePostInAllLists(postId, {
      user_interaction_status: {
        isLiked: true,
        isRetweeted: false,
        isBookmarked: false
      },
      likes_count: currentPost.likes_count + 1
    })
    
    try {
      await toggleLike(postId, user.id)
    } catch {
      // Revert on error
      updatePostInAllLists(postId, {
        user_interaction_status: {
          isLiked: false,
          isRetweeted: false,
          isBookmarked: false
        },
        likes_count: currentPost.likes_count
      })
    }
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    
    const currentPost = posts.find(p => p.id === postId)
    if (!currentPost) return
    
    // Optimistic update
    updatePostInAllLists(postId, {
      user_interaction_status: {
        isLiked: false,
        isRetweeted: true,
        isBookmarked: false
      },
      retweets_count: currentPost.retweets_count + 1
    })
    
    try {
      await toggleRetweet(postId, user.id)
    } catch {
      // Revert on error
      updatePostInAllLists(postId, {
        user_interaction_status: {
          isLiked: false,
          isRetweeted: false,
          isBookmarked: false
        },
        retweets_count: currentPost.retweets_count
      })
    }
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.id) return
    
    // Optimistic update
    updatePostInAllLists(postId, {
      user_interaction_status: {
        isLiked: false,
        isRetweeted: false,
        isBookmarked: true
      }
    })
    
    try {
      await toggleBookmark(postId, user.id)
    } catch {
      // Revert on error
      updatePostInAllLists(postId, {
        user_interaction_status: {
          isLiked: false,
          isRetweeted: false,
          isBookmarked: false
        }
      })
    }
  }

  const handleDelete = (postId: string) => {
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
  }

  const handleComment = () => {
    console.log('Comment functionality')
  }

  const confirmDelete = async () => {
    if (!user?.id || !postToDelete) return

    // Close dialog
    setDeleteDialogOpen(false)

    // Optimistic update - remove from UI immediately
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete))
    setLikedPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete))
    setFavoritePosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete))
    setMediaPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete))

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

  const currentPosts = (() => {
    switch (activeTab) {
      case 'posts':
        return posts
      case 'replies':
        return posts.filter(post => post.content.includes('@'))
      case 'media':
        return mediaPosts
      case 'likes':
        return likedPosts
      case 'favorites':
        return favoritePosts
      default:
        return posts
    }
  })()

  const emptyMessage = (() => {
    switch (activeTab) {
      case 'posts':
        return user.id === paramsId ? 'Henüz gönderi paylaşmadın' : 'Bu kullanıcı henüz gönderi paylaşmamış'
      case 'replies':
        return user.id === paramsId ? 'Henüz yanıt vermedin' : 'Bu kullanıcı henüz yanıt vermemiş'
      case 'media':
        return user.id === paramsId ? 'Henüz medya paylaşmadın' : 'Bu kullanıcı henüz medya paylaşmamış'
      case 'likes':
        return user.id === paramsId ? 'Henüz beğendiğin gönderi yok' : 'Bu kullanıcı henüz hiçbir gönderiyi beğenmemiş'
      case 'favorites':
        return user.id === paramsId ? 'Henüz kaydettiğin gönderi yok' : 'Bu kullanıcı henüz hiçbir gönderiyi kaydetmemiş'
      default:
        return 'Gönderi bulunamadı'
    }
  })()

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
            <LeftSidebar />

            <div className="lg:col-span-2 flex flex-col min-h-0">
              <div className="flex items-center gap-4 mb-4 sm:mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Geri</span>
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold">{dbUser.name}</h1>
                  <p className="text-sm text-muted-foreground">@{dbUser.username}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative">
                  <ProfileHeader
                    user={dbUser}
                    currentUserId={user.id}
                    isOwner={user.id === paramsId}
                    isCompact={isCompact}
                    onAvatarChange={handleAvatarChange}
                    onBannerChange={handleBannerChange}
                  />

                  <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto"
                >
                  <ProfilePosts
                    posts={currentPosts}
                    loading={postsLoading}
                    emptyMessage={emptyMessage}
                    onLike={handleLike}
                    onRetweet={handleRetweet}
                    onBookmark={handleBookmark}
                    onComment={handleComment}
                    currentUserId={user.id}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </div>

            <RightSidebar />
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