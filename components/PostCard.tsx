'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostWithAuthor } from '@/lib/types'
import { PostHeader } from './post/PostHeader'
import { PostContent } from './post/PostContent'
import { PostActions } from './post/PostActions'
import Image from 'next/image'

interface PostCardProps {
  post: PostWithAuthor
  onLike?: (postId: string) => Promise<void>
  onRetweet?: (postId: string) => Promise<void>
  onBookmark?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  canDelete?: boolean
  onDelete?: (postId: string) => void
}

export function PostCard({
  post,
  onLike,
  onRetweet,
  onBookmark,
  onComment,
  canDelete = false,
  onDelete
}: PostCardProps) {
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
    } catch {
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

  return (
    <Card className="w-full border border-border bg-transparent dark:bg-[#171717]">
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

            {/* Post Image */}
            {post.image_url && (
              <div className="relative w-full mt-2 rounded-lg overflow-hidden border border-border/50">
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <Image
                    src={post.image_url}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
            )}

            <PostActions
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

