'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { PostWithAuthor, Post } from '@/lib/posts'
import { FeedSkeleton } from '@/components/skeletons/PostSkeleton'
import { useInfiniteFeedPosts } from '@/hooks/useInfiniteScroll'

type MainFeedProps = {
  posts: PostWithAuthor[]
  onPostCreated: (newPost: Post) => void
  isCreatePostCompact: boolean
  setIsCreatePostCompact: (v: boolean) => void
  onLike: (postId: string) => Promise<void>
  onRetweet: (postId: string) => Promise<void>
  onBookmark: (postId: string) => Promise<void>
  onComment: (postId: string) => void
  currentUserId?: string
  onDelete?: (postId: string) => void
  useInfiniteScroll?: boolean
  onRefresh?: () => void // Yenileme fonksiyonu
}

export function MainFeed({
  posts,
  onPostCreated,
  isCreatePostCompact,
  setIsCreatePostCompact,
  onLike,
  onRetweet,
  onBookmark,
  onComment,
  currentUserId,
  onDelete,
  useInfiniteScroll: useInfinite = false,
  onRefresh,
}: MainFeedProps) {
  const mainFeedRef = useRef<HTMLDivElement>(null)
  
  // Infinite scroll hook - always call, but conditionally use
  const infiniteScrollResult = useInfiniteFeedPosts(currentUserId || undefined, 20)
  
  const {
    posts: infinitePosts = [],
    isLoading: isLoadingInfinite = false,
    hasNextPage = false,
    isFetchingNextPage = false,
    loadMoreRef = null
  } = infiniteScrollResult

  // Use infinite scroll posts if enabled, otherwise use passed posts
  const displayPosts = useInfinite ? infinitePosts : posts
  const isLoading = useInfinite ? isLoadingInfinite : false

  // Otomatik yenileme - sayfa odaklandığında
  useEffect(() => {
    const handleFocus = () => {
      // Sayfa odaklandığında yenile
      onRefresh?.()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Sayfa görünür hale geldiğinde yenile
        onRefresh?.()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onRefresh])

  useEffect(() => {
    const handleScroll = () => {
      if (mainFeedRef.current) {
        const scrollTop = mainFeedRef.current.scrollTop
        setIsCreatePostCompact(scrollTop > 10)
      }
    }
    const mainFeed = mainFeedRef.current
    mainFeed?.addEventListener('scroll', handleScroll)
    return () => mainFeed?.removeEventListener('scroll', handleScroll)
  }, [setIsCreatePostCompact])

  return (
    <div ref={mainFeedRef} className="main-feed lg:col-span-2 space-y-2 sm:space-y-3 h-full min-h-0 overflow-y-auto scrollbar-hide pb-20">
      <div className="sticky top-0 z-10 bg-soc-ai-header/60 backdrop-blur pb-3">
        <CreatePost onPostCreated={onPostCreated} isCompact={isCreatePostCompact} />
        <Separator className="mt-3" />
      </div>

      {/* Loading state */}
      {isLoading && displayPosts.length === 0 && (
        <FeedSkeleton count={5} />
      )}

      {/* Empty state for first-time users */}
      {!isLoading && displayPosts.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                <span className="text-2xl sm:text-3xl">✨</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                Henüz soc-ai yok
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                İlk soc-ai&apos;nı sen at! Düşündüğün bir şeyi paylaş ve sohbeti başlat.
              </p>
              <Button
                className="mt-2"
                onClick={() => {
                  setIsCreatePostCompact(false)
                  mainFeedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                İlk SOC AI Yaz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 sm:space-y-3">
        {displayPosts.map((post) => (
          <div key={post.id} className="mb-2 sm:mb-3">
            <PostCard
              post={post}
              onLike={onLike}
              onRetweet={onRetweet}
              onBookmark={onBookmark}
              onComment={onComment}
              canDelete={currentUserId === post.author_id}
              onDelete={onDelete}
            />
          </div>
        ))}
        
        {/* Load more trigger for infinite scroll */}
        {useInfinite && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm">Daha fazla yükleniyor...</span>
              </div>
            )}
            {!hasNextPage && displayPosts.length > 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                Tüm gönderiler yüklendi
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


