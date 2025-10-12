'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
}

export function CommentInput({ onSubmit, placeholder = "Yorumunuzu yazın..." }: CommentInputProps) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!user) return null

  return (
    <div className="border-b border-border bg-card/50 p-3 sm:p-4">
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage 
            src={user?.user_metadata?.avatar_url} 
            alt={user?.user_metadata?.full_name || user?.email || 'Kullanıcı'}
            className="object-cover"
          />
          <AvatarFallback className="text-xs sm:text-sm font-semibold bg-primary text-primary-foreground">
            {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Input Area */}
        <div className="flex-1 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-foreground min-h-[60px]"
            maxLength={280}
          />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {content.length}/280
            </span>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || content.length > 280}
              size="sm"
              className="px-3 text-xs h-7 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Gönderiliyor...'
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Yanıtla
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

