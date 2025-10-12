'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'

interface AISuggestionsProps {
  onSuggestionSelect: (suggestion: string) => void
  currentContent?: string
}

const SUGGESTION_PROMPTS = [
  { label: 'Teknoloji Trendi', prompt: 'teknoloji ve yapay zeka hakkında ilginç bir gönderi' },
  { label: 'Motivasyon', prompt: 'motivasyonel ve ilham verici bir gönderi' },
  { label: 'Günlük Düşünce', prompt: 'günlük hayat hakkında düşündürücü bir gönderi' },
  { label: 'Eğlenceli', prompt: 'eğlenceli ve komik bir gönderi' },
  { label: 'Profesyonel', prompt: 'profesyonel ve iş dünyası hakkında bir gönderi' },
  { label: 'Soru Sor', prompt: 'takipçilere yönelik ilginç bir soru' },
]

export function AISuggestions({ onSuggestionSelect, currentContent }: AISuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSuggestion = async (prompt: string) => {
    setLoading(true)
    setError(null)

    try {
      // Simulated AI response - In production, this would call an AI API
      // For now, we'll generate contextual suggestions based on the prompt
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay

      const suggestions: Record<string, string[]> = {
        'teknoloji ve yapay zeka hakkında ilginç bir gönderi': [
          '🤖 Yapay zeka artık sadece bir trend değil, hayatımızın bir parçası. Sizce AI\'nın geleceği nasıl şekillenecek?',
          '💡 Teknoloji hızla ilerliyor ama en önemli soru: İnsanlığa nasıl fayda sağlayacak?',
          '🚀 AI ile çalışmak, onu rakip olarak görmekten daha akıllıca. Siz nasıl kullanıyorsunuz?'
        ],
        'motivasyonel ve ilham verici bir gönderi': [
          '✨ Başarı, her gün küçük adımlar atmaktan geçer. Bugün hangi adımı attınız?',
          '🌟 Hayalleriniz için çalışmak yorucu olabilir, ama değer. Pes etmeyin!',
          '💪 Zorluklarla karşılaştığınızda hatırlayın: Her zorluk, yeni bir fırsat demektir.'
        ],
        'günlük hayat hakkında düşündürücü bir gönderi': [
          '☕ Sabah kahvesi içerken düşündüm: Küçük anlar, büyük mutluluklar yaratıyor.',
          '🌅 Her yeni gün, yeni bir başlangıç. Bugünü nasıl değerlendiriyorsunuz?',
          '📱 Dijital dünyada kaybolurken, gerçek anları kaçırıyor muyuz?'
        ],
        'eğlenceli ve komik bir gönderi': [
          '😄 Kahve içmeden önce: 😴 Kahve içtikten sonra: 🚀 Sizin süper gücünüz ne?',
          '🤔 Neden \"Pazartesi sendromu\" var da \"Cuma coşkusu\" yok? Haksızlık!',
          '💻 Kod yazarken: \"Bu çalışacak!\" 5 dakika sonra: \"Neden çalışmıyor?\" 😅'
        ],
        'profesyonel ve iş dünyası hakkında bir gönderi': [
          '💼 İş dünyasında başarının sırrı: Sürekli öğrenme ve adaptasyon. Siz nasıl gelişiyorsunuz?',
          '🎯 Hedeflerinizi belirleyin, planınızı yapın, harekete geçin. Başarı bu kadar basit!',
          '🤝 Networking sadece kartvizit değişimi değil, değer yaratma sanatıdır.'
        ],
        'takipçilere yönelik ilginç bir soru': [
          '🤔 Sizce gelecekte hangi teknoloji hayatımızı en çok değiştirecek?',
          '💭 Eğer bir süper gücünüz olsaydı, hangisi olurdu ve neden?',
          '📚 Hayatınızı değiştiren bir kitap var mı? Önerir misiniz?'
        ]
      }

      const randomSuggestion = suggestions[prompt][Math.floor(Math.random() * suggestions[prompt].length)]
      
      // If there's current content, try to enhance it
      if (currentContent && currentContent.trim().length > 10) {
        onSuggestionSelect(`${currentContent}\n\n${randomSuggestion}`)
      } else {
        onSuggestionSelect(randomSuggestion)
      }
    } catch (err) {
      console.error('AI suggestion error:', err)
      setError('Öneri oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={loading}
          className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-all duration-200 hover:scale-110"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 transition-transform duration-200 hover:rotate-12" />
          )}
          <span className="sr-only">AI önerisi al</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          AI Gönderi Önerileri
        </div>
        {SUGGESTION_PROMPTS.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={() => generateSuggestion(item.prompt)}
            disabled={loading}
            className="cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
        {error && (
          <div className="px-2 py-1.5 text-xs text-red-500">
            {error}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

