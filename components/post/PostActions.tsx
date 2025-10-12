import { Button } from '@/components/ui/button'
import {
  Heart,
  MessageCircle,
  RotateCcw,
  ArrowUpFromLine,
  Star
} from 'lucide-react'

interface PostActionsProps {
  commentsCount: number
  retweetsCount: number
  likesCount: number
  isLiked: boolean
  isRetweeted: boolean
  isBookmarked: boolean
  onComment: () => void
  onRetweet: () => void
  onLike: () => void
  onBookmark: () => void
}

export function PostActions({
  commentsCount,
  retweetsCount,
  likesCount,
  isLiked,
  isRetweeted,
  isBookmarked,
  onComment,
  onRetweet,
  onLike,
  onBookmark
}: PostActionsProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center space-x-2 sm:space-x-4 text-muted-foreground dark:text-white/85">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComment}
          className="flex items-center space-x-1 text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110"
        >
          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 hover:rotate-12" />
          <span className="text-xs font-medium">{commentsCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRetweet}
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
          onClick={onLike}
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
          onClick={onBookmark}
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
  )
}

