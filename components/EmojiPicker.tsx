'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Smile } from 'lucide-react'

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

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Yüz İfadeleri')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-all duration-200 hover:scale-110"
        >
          <Smile className="h-3 w-3 transition-transform duration-200 hover:scale-125" />
          <span className="sr-only">Emoji ekle</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-2">
        {/* Category Tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="text-2xl hover:bg-muted rounded p-1 transition-all duration-200 hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

