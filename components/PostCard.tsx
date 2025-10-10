'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  MessageCircle, 
  RotateCcw, 
  ArrowUpFromLine, 
  MoreHorizontal,
  Star
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { PostWithAuthor } from '@/lib/posts'

interface PostCardProps {
  post: PostWithAuthor
  onLike?: (postId: string) => void
  onRetweet?: (postId: string) => void
  onBookmark?: (postId: string) => void
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

  // Post'tan gelen interaction status'u kullan
  useEffect(() => {
    if (post.user_interaction_status) {
      setIsLiked(post.user_interaction_status.isLiked)
      setIsRetweeted(post.user_interaction_status.isRetweeted)
      setIsBookmarked(post.user_interaction_status.isBookmarked)
    }
  }, [post.user_interaction_status])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    onLike?.(post.id)
  }

  const handleRetweet = () => {
    setIsRetweeted(!isRetweeted)
    setRetweetsCount(prev => isRetweeted ? prev - 1 : prev + 1)
    onRetweet?.(post.id)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.(post.id)
  }

  const handleComment = () => {
    onComment?.(post.id)
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'şimdi'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}sa`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}g`
    return postDate.toLocaleDateString('tr-TR')
  }

  return (
        <Card
          className="w-full border border-border transition-colors duration-200 bg-card dark:bg-transparent card-dark-gradient"
        >
          <CardContent className="p-2 sm:p-3">
        <div className="flex space-x-2 sm:space-x-3 transition-transform duration-500 data-[appear=true]:animate-none" data-appear={post as any && (post as any).__appear ? true : undefined}>
          <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(191,9,47,0.75) 0%, rgba(191,9,47,0.45) 55%, rgba(191,9,47,0) 80%)',
                filter: 'blur(3px)',
                transform: 'scale(1.6)'
              }}
            />
            <div className="h-full w-full rounded-full p-[2px] bg-black dark:bg-[#BF092F]">
            <Avatar className="h-full w-full rounded-full">
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
          </div>
          
          <div className="flex-1 space-y-1 min-w-0 text-foreground dark:text-white">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <h3 className="font-semibold text-foreground dark:text-white text-xs sm:text-sm truncate">
                  @{post.author.username}
                </h3>
                <span className="text-muted-foreground dark:text-white/70 text-xs flex-shrink-0">·</span>
                <span className="text-muted-foreground dark:text-white/70 text-xs flex-shrink-0">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0">
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only">Daha fazla</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Paylaş</DropdownMenuItem>
                  <DropdownMenuItem>Kopyala</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">Şikayet et</DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete?.(post.id)}
                    >
                      Sil
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Content */}
            <div className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-foreground dark:text-white">
              {post.content}
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2 sm:space-x-4 text-muted-foreground dark:text-white/85">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110"
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-xs font-medium">{post.comments_count}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetweet}
                  className={`flex items-center space-x-1 h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110 ${
                    isRetweeted 
                      ? 'text-pink-400' 
                      : 'text-muted-foreground hover:text-pink-400 dark:text-white/80'
                  }`}
                >
                  <RotateCcw
                    className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 hover:rotate-180 ${
                      isRetweeted
                        ? 'text-pink-500 dark:text-pink-400'
                        : 'text-muted-foreground dark:text-white/70'
                    }`}
                    strokeWidth={2.5}
                  />
                  <span className="text-xs font-medium">{retweetsCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-1 h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110 ${
                    isLiked 
                      ? 'text-destructive' 
                      : 'text-muted-foreground hover:text-destructive dark:text-white/80'
                  }`}
                >
                  <Heart className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 hover:scale-125 ${isLiked ? 'fill-current animate-pulse' : ''}`} />
                  <span className="text-xs font-medium">{likesCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={`flex items-center space-x-1 h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110 ${
                    isBookmarked 
                      ? 'text-yellow-400' 
                      : 'text-muted-foreground hover:text-yellow-400 dark:text-white/80'
                  }`}
                >
                  <Star
                    className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 hover:rotate-12 ${
                      isBookmarked
                        ? 'text-yellow-500 dark:text-yellow-400 fill-current'
                        : 'text-muted-foreground dark:text-white/70'
                    }`}
                  />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110"
              >
                <ArrowUpFromLine className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 hover:translate-y-[-2px]" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
