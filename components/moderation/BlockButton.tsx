'use client'

import { useState } from 'react'
import { useBlockUser, useUnblockUser, useIsUserBlocked } from '@/hooks/useModeration'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertTriangle, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

interface BlockButtonProps {
  blockerId: string
  blockedId: string
  blockedUsername: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showDialog?: boolean
}

export function BlockButton({ 
  blockerId, 
  blockedId, 
  blockedUsername,
  variant = 'ghost',
  size = 'sm',
  className = '',
  showDialog = true
}: BlockButtonProps) {
  const [open, setOpen] = useState(false)
  
  const { data: isBlocked, isLoading: isLoadingBlockStatus } = useIsUserBlocked(blockerId, blockedId)
  const blockUserMutation = useBlockUser()
  const unblockUserMutation = useUnblockUser()

  const handleBlock = async () => {
    try {
      await blockUserMutation.mutateAsync({ blockerId, blockedId })
      setOpen(false)
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const handleUnblock = async () => {
    try {
      await unblockUserMutation.mutateAsync({ blockerId, blockedId })
    } catch (error) {
      console.error('Error unblocking user:', error)
    }
  }

  const handleToggleBlock = () => {
    if (isBlocked) {
      handleUnblock()
    } else if (showDialog) {
      setOpen(true)
    } else {
      handleBlock()
    }
  }

  if (isLoadingBlockStatus) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <UserX className="h-4 w-4" />
      </Button>
    )
  }

  const blockDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={(e) => {
            e.stopPropagation()
            if (!showDialog) {
              handleToggleBlock()
            }
          }}
        >
          <UserX className="h-4 w-4" />
          <span className="sr-only">
            {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isBlocked ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isBlocked ? (
              <>
                <strong>@{blockedUsername}</strong> kullanıcısının engelini kaldırmak istediğinizden emin misiniz?
                Bu kullanıcının gönderilerini tekrar görebileceksiniz.
              </>
            ) : (
              <>
                <strong>@{blockedUsername}</strong> kullanıcısını engellemek istediğinizden emin misiniz?
                Bu kullanıcının gönderilerini artık göremeyeceksiniz ve sizi takip edemeyecek.
              </>
            )}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={blockUserMutation.isPending || unblockUserMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              onClick={handleToggleBlock}
              disabled={blockUserMutation.isPending || unblockUserMutation.isPending}
            >
              {blockUserMutation.isPending || unblockUserMutation.isPending ? (
                'İşleniyor...'
              ) : isBlocked ? (
                'Engeli Kaldır'
              ) : (
                'Engelle'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (showDialog) {
    return blockDialog
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        handleToggleBlock()
      }}
    >
      {isBlocked ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserX className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
      </span>
    </Button>
  )
}
