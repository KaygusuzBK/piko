'use client'

import { useState } from 'react'
import { useCreatePoll } from '@/hooks/usePolls'
import { CreatePollData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, X, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface PollCreatorProps {
  postId: string
  onPollCreated?: (pollId: string) => void
  onCancel?: () => void
  onCreatePostFirst?: () => void
}

export function PollCreator({ postId, onPollCreated, onCancel, onCreatePostFirst }: PollCreatorProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  const createPollMutation = useCreatePoll()

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async () => {
    // Validation
    if (!question.trim()) {
      toast.error('Anket sorusu gereklidir')
      return
    }

    const validOptions = options.filter(option => option.trim().length > 0)
    if (validOptions.length < 2) {
      toast.error('En az 2 seçenek gereklidir')
      return
    }

    if (hasEndDate && (!endDate || !endTime)) {
      toast.error('Bitiş tarihi ve saati gereklidir')
      return
    }

    try {
      const pollData: CreatePollData = {
        post_id: postId,
        question: question.trim(),
        options: validOptions,
        allow_multiple: allowMultiple,
        is_anonymous: isAnonymous,
        ends_at: hasEndDate ? `${endDate}T${endTime}:00` : undefined
      }

      const poll = await createPollMutation.mutateAsync(pollData)
      
      if (poll) {
        toast.success('Anket başarıyla oluşturuldu')
        onPollCreated?.(poll.id)
      }
    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error('Anket oluşturulurken hata oluştu')
    }
  }

  const formatDateTime = () => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5)
    return { date, time }
  }

  const { date: defaultDate, time: defaultTime } = formatDateTime()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Anket Oluştur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question">Anket Sorusu</Label>
          <Input
            id="question"
            placeholder="Anket sorusunu yazın..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {question.length}/200 karakter
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <Label>Seçenekler</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Seçenek ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {options.length < 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Seçenek Ekle
            </Button>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-multiple">Çoklu Seçim</Label>
            <Switch
              id="allow-multiple"
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">Anonim Oy</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="end-date">Bitiş Tarihi</Label>
            <Switch
              id="end-date"
              checked={hasEndDate}
              onCheckedChange={setHasEndDate}
            />
          </div>

          {hasEndDate && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  value={endDate || defaultDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={defaultDate}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="time">Saat</Label>
                <Input
                  id="time"
                  type="time"
                  value={endTime || defaultTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          {!postId && onCreatePostFirst ? (
            <Button
              onClick={onCreatePostFirst}
              className="flex items-center gap-2"
            >
              Önce Post Oluştur
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createPollMutation.isPending}
              className="flex items-center gap-2"
            >
              {createPollMutation.isPending ? 'Oluşturuluyor...' : 'Anket Oluştur'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
