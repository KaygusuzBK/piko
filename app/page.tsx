'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { MainFeed } from '@/components/MainFeed'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { getPosts, PostWithAuthor, toggleLike, toggleRetweet } from '@/lib/posts'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
// import { Users, Sparkles } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [isCreatePostCompact, setIsCreatePostCompact] = useState(false)
  // mainFeedRef kaldırıldı

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
      const isLiked = await toggleLike(postId, user.id)
      console.log(isLiked ? 'Post liked' : 'Post unliked')
      
      // Feed'i yenileme - PostCard zaten optimistic update yapıyor
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    
    try {
      const isRetweeted = await toggleRetweet(postId, user.id)
      console.log(isRetweeted ? 'Post retweeted' : 'Post unretweeted')
      
      // Feed'i yenileme - PostCard zaten optimistic update yapıyor
    } catch (error) {
      console.error('Error toggling retweet:', error)
    }
  }

  const handleBookmark = (postId: string) => {
    console.log('Bookmarked post:', postId)
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