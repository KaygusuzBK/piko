'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Smile } from 'lucide-react'
import dynamic from 'next/dynamic'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

const EMOJI_CATEGORIES = {
  'Yüz İfadeleri': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Jestler': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '💪', '🙏', '✍️', '💅', '🤳'],
  'Kalpler': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Nesneler': ['🔥', '⭐', '✨', '💫', '💥', '💢', '💦', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🎮', '🎯', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶'],
  'Yiyecek': ['☕', '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖', '🍗', '🍩', '🍪', '🎂', '🍰'],
  'Doğa': ['🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌾', '🌱', '🌲', '🌳', '🌴', '🌵', '🌊', '🌈', '⚡', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️']
}

function EmojiPickerContent({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Yüz İfadeleri')

  return (
    <DropdownMenuContent className="w-80 p-4" align="start">
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-muted"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
    </DropdownMenuContent>
  )
}

export const EmojiPicker = dynamic(() => Promise.resolve(function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Smile className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <EmojiPickerContent onEmojiSelect={onEmojiSelect} />
    </DropdownMenu>
  )
}), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Smile className="h-4 w-4" />
    </Button>
  )
})