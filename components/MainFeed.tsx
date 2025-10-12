'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { PostWithAuthor } from '@/lib/posts'

type MainFeedProps = {
  posts: PostWithAuthor[]
  onPostCreated: () => void
  isCreatePostCompact: boolean
  setIsCreatePostCompact: (v: boolean) => void
  onLike: (postId: string) => Promise<void>
  onRetweet: (postId: string) => Promise<void>
  onBookmark: (postId: string) => Promise<void>
  onComment: (postId: string) => void
  currentUserId?: string
  onDelete?: (postId: string) => void
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
    <div ref={mainFeedRef} className="main-feed lg:col-span-2 space-y-2 sm:space-y-3 h-full min-h-0 overflow-y-auto scrollbar-hide">
      <div className="sticky top-0 z-10 bg-soc-ai-header/60 backdrop-blur pb-3">
        <CreatePost onPostCreated={onPostCreated} isCompact={isCreatePostCompact} />
        <Separator className="mt-3" />
      </div>

      {/* Empty state for first-time users */}
      {posts.length === 0 && (
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
                İlk Pikonu Yaz
              </Button>
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
              canDelete={currentUserId === post.author_id}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


