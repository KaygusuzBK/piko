'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  ArrowUpFromLine,
  Link as LinkIcon,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Mail,
  Check
} from 'lucide-react'

interface ShareMenuProps {
  postId: string
  postContent: string
}

export function ShareMenu({ postId, postContent }: ShareMenuProps) {
  const [copied, setCopied] = useState(false)
  
  const postUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/posts/${postId}`
    : ''

  const shareText = postContent.length > 100 
    ? postContent.substring(0, 100) + '...' 
    : postContent

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`
    window.open(url, '_blank')
  }

  const handleShareEmail = () => {
    const subject = 'SOC-AI Gönderisi'
    const body = `${shareText}\n\n${postUrl}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SOC-AI Gönderisi',
          text: shareText,
          url: postUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground dark:text-white/80 dark:hover:text-white h-6 sm:h-7 px-1 sm:px-2 transition-all duration-200 hover:scale-110"
        >
          <ArrowUpFromLine className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 hover:translate-y-[-2px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-500">Bağlantı kopyalandı!</span>
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              <span>Bağlantıyı kopyala</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
          <Twitter className="mr-2 h-4 w-4" />
          <span>Twitter&apos;da paylaş</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareFacebook} className="cursor-pointer">
          <Facebook className="mr-2 h-4 w-4" />
          <span>Facebook&apos;ta paylaş</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareLinkedIn} className="cursor-pointer">
          <Linkedin className="mr-2 h-4 w-4" />
          <span>LinkedIn&apos;de paylaş</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>WhatsApp&apos;ta paylaş</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareEmail} className="cursor-pointer">
          <Mail className="mr-2 h-4 w-4" />
          <span>E-posta ile paylaş</span>
        </DropdownMenuItem>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleShareNative} className="cursor-pointer">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              <span>Daha fazla seçenek...</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

