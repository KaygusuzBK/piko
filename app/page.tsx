'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { getPosts, PostWithAuthor, toggleLike, toggleRetweet } from '@/lib/posts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Home as HomeIcon, 
  Search, 
  Bell, 
  Mail, 
  Star, 
  User, 
  Settings,
  Users,
  Sparkles
} from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [isCreatePostCompact, setIsCreatePostCompact] = useState(false)
  const mainFeedRef = useRef<HTMLDivElement>(null)

  // Scroll pozisyonunu takip et
  useEffect(() => {
    const handleScroll = () => {
      if (mainFeedRef.current) {
        const scrollTop = mainFeedRef.current.scrollTop
        console.log('Scroll top:', scrollTop) // Debug için
        setIsCreatePostCompact(scrollTop > 10) // 10px scroll sonrası kompakt mod
      }
    }

    // DOM'un yüklenmesini bekle
    const timer = setTimeout(() => {
      const mainFeed = mainFeedRef.current
      if (mainFeed) {
        console.log('Main feed found, adding scroll listener') // Debug için
        mainFeed.addEventListener('scroll', handleScroll)
      } else {
        console.log('Main feed not found') // Debug için
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      const mainFeed = mainFeedRef.current
      if (mainFeed) {
        mainFeed.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

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
    return null // Redirect will happen
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
        <div className="h-screen bg-background flex flex-col overflow-hidden">
          <Header />

          <main className="flex-1 max-w-7xl mx-auto w-full py-4 sm:py-6 px-3 sm:px-4 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 flex-1">
          {/* Left Sidebar - Hidden on mobile and tablet, visible on desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
                <Card className="border-border bg-card">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3 sm:space-y-4">
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <HomeIcon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Ana Sayfa</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <Search className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Keşfet</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <Bell className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Bildirimler</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <Mail className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Mesajlar</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <Star className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Favoriler</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <User className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Profil</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                        <Settings className="mr-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-12" />
                        <span className="text-sm sm:text-base">Ayarlar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

            {/* Trending */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Trending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Henüz trending konu yok</p>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Users */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Önerilen Kullanıcılar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Henüz önerilen kullanıcı yok</p>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

              {/* Main Feed */}
              <div ref={mainFeedRef} className="main-feed lg:col-span-2 space-y-2 sm:space-y-3 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 z-10 bg-background pb-3">
              <CreatePost onPostCreated={handlePostCreated} isCompact={isCreatePostCompact} />
              <Separator className="mt-3" />
            </div>
            
            {/* Database Setup Notice */}
            {posts.length === 0 && (
              <Card className="bg-accent/10 border-accent/30">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📊</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                        Veritabanı Kurulumu Gerekli
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gönderileri görmek için önce Supabase veritabanını kurmanız gerekiyor. 
                        README.md dosyasındaki adımları takip edin.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2 sm:space-y-3 pb-4">
              {posts.map((post) => (
                <div key={post.id} className="mb-2 sm:mb-3">
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onRetweet={handleRetweet}
                    onBookmark={handleBookmark}
                    onComment={handleComment}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Hidden on mobile, visible on tablet+ */}
          <div className="hidden md:block lg:col-span-1">
            <div className="sticky top-20 space-y-4 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Kimleri Takip Ediyorsun</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Henüz kimseyi takip etmiyorsun</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-3 sm:p-4">
                <div className="text-center space-y-2">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Daha fazla kişi keşfet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Arkadaşlarını bul ve takip etmeye başla
                  </p>
                  <Button className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 transition-transform duration-200 hover:rotate-12" />
                    Keşfet
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}