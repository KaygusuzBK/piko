'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostWithAuthor } from '@/lib/types'
import { PostHeader } from './post/PostHeader'
import { PostContent } from './post/PostContent'
import { PostActions } from './post/PostActions'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { SentryService } from '@/lib/utils/sentry'
import Image from 'next/image'

interface PostCardProps {
  post: PostWithAuthor
  onLike?: (postId: string) => Promise<void>
  onRetweet?: (postId: string) => Promise<void>
  onBookmark?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  canDelete?: boolean
  onDelete?: (postId: string) => void
  disableNavigation?: boolean
}

export function PostCard({
  post,
  onLike,
  onRetweet,
  onBookmark,
  onComment,
  canDelete = false,
  onDelete,
  disableNavigation = false
}: PostCardProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const [isLiked, setIsLiked] = useState(post.user_interaction_status?.isLiked || false)
  const [isRetweeted, setIsRetweeted] = useState(post.user_interaction_status?.isRetweeted || false)
  const [isBookmarked, setIsBookmarked] = useState(post.user_interaction_status?.isBookmarked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [retweetsCount, setRetweetsCount] = useState(post.retweets_count)

  // Sync with post changes - use individual values as dependencies
  useEffect(() => {
    setIsLiked(post.user_interaction_status?.isLiked || false)
    setIsRetweeted(post.user_interaction_status?.isRetweeted || false)
    setIsBookmarked(post.user_interaction_status?.isBookmarked || false)
    setLikesCount(post.likes_count)
    setRetweetsCount(post.retweets_count)
  }, [
    post.user_interaction_status?.isLiked,
    post.user_interaction_status?.isRetweeted,
    post.user_interaction_status?.isBookmarked,
    post.likes_count,
    post.retweets_count,
    post.id // Post ID değişirse tüm state'i reset et
  ])

  const handleLike = async () => {
    const prevLiked = isLiked
    const prevCount = likesCount
    // Optimistic update
    setIsLiked(!prevLiked)
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1)

    try {
      await onLike?.(post.id)
      
      // Track post interaction with Sentry
      SentryService.trackPostInteraction(
        prevLiked ? 'unlike' : 'like',
        post.id,
        {
          authorId: post.author.id,
          postType: post.type,
          hasMedia: !!post.image_urls?.length
        }
      )
      
        // Add notification if user liked someone else's post
        if (!prevLiked && user && user.id !== post.author.id) {
          addNotification({
            type: 'like',
            message: 'Gönderiniz beğenildi',
            recipientId: post.author.id,  // Bildirimi alan kişi (gönderi sahibi)
            actorId: user.id,             // Bildirimi gönderen kişi (beğenen kişi)
            actorName: user.email?.split('@')[0] || 'Kullanıcı',
            actorAvatar: undefined,
            postId: post.id,
          })
        }
    } catch (error) {
      // Track error with Sentry
      SentryService.trackError(error as Error, {
        action: 'like_post',
        postId: post.id,
        authorId: post.author.id
      })
      
      // Revert on error
      setIsLiked(prevLiked)
      setLikesCount(prevCount)
    }
  }

  const handleRetweet = async () => {
    const prevRetweeted = isRetweeted
    const prevCount = retweetsCount
    // Optimistic update
    setIsRetweeted(!prevRetweeted)
    setRetweetsCount(prevRetweeted ? prevCount - 1 : prevCount + 1)

    try {
      await onRetweet?.(post.id)
    } catch {
      // Revert on error
      setIsRetweeted(prevRetweeted)
      setRetweetsCount(prevCount)
    }
  }

  const handleBookmark = async () => {
    const prevBookmarked = isBookmarked
    // Optimistic update
    setIsBookmarked(!prevBookmarked)

    try {
      await onBookmark?.(post.id)
    } catch {
      // Revert on error
      setIsBookmarked(prevBookmarked)
    }
  }

  const handleComment = () => {
    onComment?.(post.id)
  }

  const handleDelete = () => {
    onDelete?.(post.id)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      disableNavigation ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[role="menu"]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[data-state]') ||
      target.hasAttribute('data-radix-collection-item')
    ) {
      return
    }
    router.push(`/posts/${post.id}`)
  }

  return (
    <Card 
      className="w-full border border-border bg-transparent dark:bg-[#171717] cursor-pointer hover:bg-accent/5 transition-colors"
      onClick={handleCardClick}
    >
      <CardContent className="p-2 sm:p-3">
        <div className="flex space-x-2 sm:space-x-3 transition-transform duration-500 relative">
          {/* Soft gradient in top-left corner */}
          <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-[#BF092F]/20 to-transparent rounded-full blur-xl pointer-events-none" />

          <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <Avatar className="h-full w-full rounded-full border-2 border-[#BF092F]/30">
              <AvatarImage
                src={post.author.avatar_url}
                alt={post.author.username}
                className="object-cover"
              />
              <AvatarFallback className="text-xs sm:text-sm font-semibold bg-primary text-primary-foreground">
                {post.author.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-1 min-w-0 text-foreground dark:text-white">
            <PostHeader
              author={post.author}
              createdAt={post.created_at}
              canDelete={canDelete}
              onDelete={handleDelete}
            />

            <PostContent content={post.content} />

            {/* Multiple Post Images */}
            {post.image_urls && post.image_urls.length > 0 && (
              <div className={`w-full mt-2 grid gap-2 ${
                post.image_urls.length === 1 ? 'grid-cols-1' :
                post.image_urls.length === 2 ? 'grid-cols-2' :
                post.image_urls.length === 3 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {post.image_urls.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className={`relative rounded-lg overflow-hidden border border-border/50 ${
                      post.image_urls!.length === 3 && index === 0 ? 'col-span-2' : ''
                    }`}
                  >
                    <div className="relative w-full" style={{ aspectRatio: post.image_urls!.length === 1 ? '16/9' : '1/1' }}>
                      <Image
                        src={imageUrl}
                        alt={`Post image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <PostActions
              postId={post.id}
              postContent={post.content}
              commentsCount={post.comments_count}
              retweetsCount={retweetsCount}
              likesCount={likesCount}
              isLiked={isLiked}
              isRetweeted={isRetweeted}
              isBookmarked={isBookmarked}
              onComment={handleComment}
              onRetweet={handleRetweet}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

