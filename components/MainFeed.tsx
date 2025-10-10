'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { PostWithAuthor } from '@/lib/posts'

type MainFeedProps = {
  posts: PostWithAuthor[]
  onPostCreated: () => void
  isCreatePostCompact: boolean
  setIsCreatePostCompact: (v: boolean) => void
  onLike: (postId: string) => void
  onRetweet: (postId: string) => void
  onBookmark: (postId: string) => void
  onComment: (postId: string) => void
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
}: MainFeedProps) {
  const mainFeedRef = useRef<HTMLDivElement>(null)

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
    <div ref={mainFeedRef} className="main-feed lg:col-span-2 space-y-2 sm:space-y-3 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <CreatePost onPostCreated={onPostCreated} isCompact={isCreatePostCompact} />
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

      <div className="space-y-2 sm:space-y-3 ">
        {posts.map((post) => (
          <div key={post.id} className="mb-2 sm:mb-3">
            <PostCard
              post={post}
              onLike={onLike}
              onRetweet={onRetweet}
              onBookmark={onBookmark}
              onComment={onComment}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


