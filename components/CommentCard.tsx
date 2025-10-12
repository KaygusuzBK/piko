'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CommentWithAuthor } from '@/lib/types'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CommentCardProps {
  comment: CommentWithAuthor
  canDelete?: boolean
  onDelete?: (commentId: string) => void
}

export function CommentCard({ comment, canDelete = false, onDelete }: CommentCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return
    
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="w-full border-0 border-b border-border bg-transparent rounded-none hover:bg-accent/5 transition-colors">
      <CardContent className="p-3 sm:p-4">
        <div className="flex space-x-3">
          {/* Avatar */}
          <Avatar 
            className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => router.push(`/users/${comment.author.id}`)}
          >
            <AvatarImage 
              src={comment.author.avatar_url} 
              alt={comment.author.username}
              className="object-cover"
            />
            <AvatarFallback className="text-xs sm:text-sm font-semibold bg-primary text-primary-foreground">
              {comment.author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2 min-w-0">
                <span 
                  className="font-semibold text-sm text-foreground hover:underline cursor-pointer truncate"
                  onClick={() => router.push(`/users/${comment.author.id}`)}
                >
                  {comment.author.name || comment.author.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{comment.author.username}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                </span>
              </div>

              {/* Delete Button */}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Comment Content */}
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

