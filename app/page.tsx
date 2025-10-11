'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { MainFeed } from '@/components/MainFeed'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { getPosts, PostWithAuthor, toggleLike, toggleRetweet, togglePostBookmark, getUserInteractionStatus } from '@/lib/posts'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
// import { Users, Sparkles } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [isCreatePostCompact, setIsCreatePostCompact] = useState(false)
  // const mainFeedRef = useRef<HTMLDivElement>(null)

  // Scroll takibi MainFeed içine taşındı

  // Load posts from Supabase - sadece bir kez yükle
  useEffect(() => {
    if (!user?.id || loading) return
    
    const loadPosts = async () => {
      try {
        const fetchedPosts = await getPosts(1000, 0, user.id)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      }
    }
    
    loadPosts()
  }, [user?.id, loading])

  // Eğer kullanıcı yoksa login'e yönlendir
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handlePostCreated = useCallback(() => {
    // Yeni gönderi oluşturulduğunda feed'i yenile
    if (!user?.id) return
    
    const loadPosts = async () => {
      try {
        const fetchedPosts = await getPosts(1000, 0, user.id)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      }
    }
    
    loadPosts()
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect handled above
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    
    try {
      await toggleLike(postId, user.id)
      // Refresh interaction status for this post
      const fetchedPosts = await getPosts(1000, 0, user.id)
      setPosts(fetchedPosts)
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    
    try {
      await toggleRetweet(postId, user.id)
      // Check current retweet status; if retweeted, move post to top
      const status = await getUserInteractionStatus(postId, user.id)
      if (status.isRetweeted) {
        setPosts((prev) => {
          const idx = prev.findIndex(p => p.id === postId)
          if (idx === -1) return prev
          const post = prev[idx]
          const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)]
          return [post, ...rest]
        })
      } else {
        // If un-retweeted, refresh to restore natural order
        const fetchedPosts = await getPosts(1000, 0, user.id)
        setPosts(fetchedPosts)
      }
    } catch (error) {
      console.error('Error toggling retweet:', error)
      throw error
    }
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.id) return
    try {
      await togglePostBookmark(postId, user.id)
      // Refresh interaction status for this post
      const fetchedPosts = await getPosts(1000, 0, user.id)
      setPosts(fetchedPosts)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      throw error
    }
  }

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId)
  }

      return (
        <div className="h-screen flex flex-col overflow-hidden">
          <Header />

          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          {/* Left Sidebar */}
          <LeftSidebar />

          {/* Main Feed */}
          <MainFeed
            posts={posts}
            onPostCreated={handlePostCreated}
            isCreatePostCompact={isCreatePostCompact}
            setIsCreatePostCompact={setIsCreatePostCompact}
            onLike={handleLike}
            onRetweet={handleRetweet}
            onBookmark={handleBookmark}
            onComment={handleComment}
            currentUserId={user.id}
            onDelete={() => {
              // Silme sonrası feed'i yenilemek için
              handlePostCreated()
            }}
          />

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </main>
    </div>
  )
}