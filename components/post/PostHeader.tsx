import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatTimeAgo } from '@/lib/utils/dateFormatter'

interface PostHeaderProps {
  author: {
    username: string
    avatar_url?: string
  }
  createdAt: string
  canDelete?: boolean
  onDelete?: () => void
}

export function PostHeader({ author, createdAt, canDelete, onDelete }: PostHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
        <h3 className="font-semibold text-foreground dark:text-white text-xs sm:text-sm truncate">
          @{author.username}
        </h3>
        <span className="text-muted-foreground dark:text-white/70 text-xs flex-shrink-0">·</span>
        <span className="text-muted-foreground dark:text-white/70 text-xs flex-shrink-0">
          {formatTimeAgo(createdAt)}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
          >
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
              onClick={onDelete}
            >
              Sil
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

