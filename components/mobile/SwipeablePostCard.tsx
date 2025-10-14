'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Repeat, Share, Trash2, Bookmark } from 'lucide-react'
import { useSwipeGesture, useSwipeToDelete } from '@/hooks/useSwipeGesture'
import { PostCard } from '@/components/PostCard'
import { PostWithAuthor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SwipeablePostCardProps {
  post: PostWithAuthor
  onLike?: (postId: string) => Promise<void>
  onRetweet?: (postId: string) => Promise<void>
  onBookmark?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  onDelete?: (postId: string) => void
  canDelete?: boolean
  disableNavigation?: boolean
  showSwipeActions?: boolean
}

export function SwipeablePostCard({
  post,
  onLike,
  onRetweet,
  onBookmark,
  onComment,
  onDelete,
  canDelete = false,
  disableNavigation = false,
  showSwipeActions = true
}: SwipeablePostCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSwipeLeft = () => {
    if (showSwipeActions) {
      setIsRevealed(true)
    }
  }

  const handleSwipeRight = () => {
    setIsRevealed(false)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    onDelete?.(post.id)
  }

  const swipeBind = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50
  })

  const deleteBind = useSwipeToDelete(handleDelete, {
    threshold: 100,
    deleteThreshold: 200
  })

  const handleAction = (action: () => void) => {
    action()
    setIsRevealed(false)
  }

  if (isDeleting) {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      />
    )
  }

  return (
    <div className="relative">
      {/* Swipe Actions Background */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-muted rounded-lg flex items-center justify-end pr-4 z-10"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => onComment?.(post.id))}
                className="h-8 w-8 p-0"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => onBookmark?.(post.id))}
                className="h-8 w-8 p-0"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => onRetweet?.(post.id))}
                className="h-8 w-8 p-0"
              >
                <Repeat className="h-4 w-4" />
              </Button>
              
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(handleDelete)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Post Card */}
      <div
        className={cn(
          "relative",
          swipeProgress > 0.8 && "shadow-lg"
        )}
        style={{
          transform: `translateX(${swipeProgress * -120}px) scale(${1 - swipeProgress * 0.05})`
        }}
      >
        <PostCard
          post={post}
          onLike={onLike}
          onRetweet={onRetweet}
          onBookmark={onBookmark}
          onComment={onComment}
          canDelete={canDelete}
          onDelete={onDelete}
          disableNavigation={disableNavigation}
        />
      </div>

      {/* Delete Progress Indicator */}
      <AnimatePresence>
        {swipeProgress > 0.8 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-500/10 rounded-lg flex items-center justify-center z-20"
          >
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span className="text-sm font-medium">Sil</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
