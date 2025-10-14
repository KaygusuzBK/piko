'use client'

import { useState } from 'react'
import { useMuteUser, useUnmuteUser, useIsUserMuted } from '@/hooks/useModeration'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VolumeX, Volume2 } from 'lucide-react'

interface MuteButtonProps {
  muterId: string
  mutedId: string
  mutedUsername: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showDialog?: boolean
}

export function MuteButton({ 
  muterId, 
  mutedId, 
  mutedUsername,
  variant = 'ghost',
  size = 'sm',
  className = '',
  showDialog = true
}: MuteButtonProps) {
  const [open, setOpen] = useState(false)
  
  const { data: isMuted, isLoading: isLoadingMuteStatus } = useIsUserMuted(muterId, mutedId)
  const muteUserMutation = useMuteUser()
  const unmuteUserMutation = useUnmuteUser()

  const handleMute = async () => {
    try {
      await muteUserMutation.mutateAsync({ muterId, mutedId })
      setOpen(false)
    } catch (error) {
      console.error('Error muting user:', error)
    }
  }

  const handleUnmute = async () => {
    try {
      await unmuteUserMutation.mutateAsync({ muterId, mutedId })
    } catch (error) {
      console.error('Error unmuting user:', error)
    }
  }

  const handleToggleMute = () => {
    if (isMuted) {
      handleUnmute()
    } else if (showDialog) {
      setOpen(true)
    } else {
      handleMute()
    }
  }

  if (isLoadingMuteStatus) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <VolumeX className="h-4 w-4" />
      </Button>
    )
  }

  const muteDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={(e) => {
            e.stopPropagation()
            if (!showDialog) {
              handleToggleMute()
            }
          }}
        >
          <VolumeX className="h-4 w-4" />
          <span className="sr-only">
            {isMuted ? 'Susturmayı Kaldır' : 'Sustur'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VolumeX className="h-5 w-5" />
            {isMuted ? 'Susturmayı Kaldır' : 'Kullanıcıyı Sustur'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isMuted ? (
              <>
                <strong>@{mutedUsername}</strong> kullanıcısının susturmasını kaldırmak istediğinizden emin misiniz?
                Bu kullanıcının gönderilerini tekrar görebileceksiniz.
              </>
            ) : (
              <>
                <strong>@{mutedUsername}</strong> kullanıcısını susturmak istediğinizden emin misiniz?
                Bu kullanıcının gönderilerini artık görmeyeceksiniz ama takip etmeye devam edecek.
              </>
            )}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={muteUserMutation.isPending || unmuteUserMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant={isMuted ? "default" : "secondary"}
              onClick={handleToggleMute}
              disabled={muteUserMutation.isPending || unmuteUserMutation.isPending}
            >
              {muteUserMutation.isPending || unmuteUserMutation.isPending ? (
                'İşleniyor...'
              ) : isMuted ? (
                'Susturmayı Kaldır'
              ) : (
                'Sustur'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (showDialog) {
    return muteDialog
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        handleToggleMute()
      }}
    >
      {isMuted ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isMuted ? 'Susturmayı Kaldır' : 'Sustur'}
      </span>
    </Button>
  )
}
