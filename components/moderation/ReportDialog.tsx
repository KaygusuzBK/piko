'use client'

import { useState } from 'react'
import { useCreateReport } from '@/hooks/useModeration'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag, AlertTriangle } from 'lucide-react'

interface ReportDialogProps {
  contentId: string
  contentType: 'post' | 'comment' | 'user' | 'message'
  reporterId: string
  trigger?: React.ReactNode
  onReportSubmitted?: () => void
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Taciz' },
  { value: 'hate_speech', label: 'Nefret Söylemi' },
  { value: 'violence', label: 'Şiddet' },
  { value: 'nudity', label: 'Müstehcen İçerik' },
  { value: 'fake_news', label: 'Sahte Haber' },
  { value: 'copyright', label: 'Telif Hakkı İhlali' },
  { value: 'impersonation', label: 'Kimlik Taklidi' },
  { value: 'other', label: 'Diğer' }
]

export function ReportDialog({ 
  contentId, 
  contentType, 
  reporterId, 
  trigger,
  onReportSubmitted 
}: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createReportMutation = useCreateReport()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await createReportMutation.mutateAsync({
        reportData: {
          reported_content_id: contentId,
          content_type: contentType,
          reason,
          description: description.trim() || undefined
        },
        reporterId
      })
      
      setOpen(false)
      setReason('')
      setDescription('')
      onReportSubmitted?.()
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'post': return 'gönderi'
      case 'comment': return 'yorum'
      case 'user': return 'kullanıcı'
      case 'message': return 'mesaj'
      default: return 'içerik'
    }
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
      <Flag className="h-4 w-4" />
      <span className="sr-only">Rapor Et</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            İçerik Rapor Et
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rapor Sebebi</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sebep seçin" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Açıklama (İsteğe bağlı)
            </Label>
            <Textarea
              id="description"
              placeholder={`Bu ${getContentTypeLabel()} hakkında ek bilgi verin...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 karakter
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? 'Raporlanıyor...' : 'Rapor Et'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
