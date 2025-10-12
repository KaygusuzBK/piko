'use client'

import { useRef, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Film, Image as ImageIcon, FileVideo } from 'lucide-react'

interface MediaPickerProps {
  onMediaSelect: (files: File[], type: 'image' | 'video' | 'gif') => void
  disabled?: boolean
}

export function MediaPicker({ onMediaSelect, disabled }: MediaPickerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const gifInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onMediaSelect(files, 'image')
      setIsOpen(false)
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onMediaSelect(files, 'video')
      setIsOpen(false)
    }
  }

  const handleGifSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onMediaSelect(files, 'gif')
      setIsOpen(false)
    }
  }

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleVideoSelect}
        className="hidden"
      />
      <input
        ref={gifInputRef}
        type="file"
        accept="image/gif"
        onChange={handleGifSelect}
        className="hidden"
      />

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="group h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white active:text-pink-500 dark:active:text-pink-400 disabled:opacity-50 transition-all duration-200 hover:scale-110"
          >
            <Film className="h-3 w-3 group-active:text-pink-500 dark:group-active:text-pink-400 transition-transform duration-200 hover:scale-125" />
            <span className="sr-only">Medya ekle</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => imageInputRef.current?.click()}
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Resim Ekle</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => videoInputRef.current?.click()}
            className="cursor-pointer"
          >
            <FileVideo className="mr-2 h-4 w-4" />
            <span>Video Ekle</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => gifInputRef.current?.click()}
            className="cursor-pointer"
          >
            <Film className="mr-2 h-4 w-4" />
            <span>GIF Ekle</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

