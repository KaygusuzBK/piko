'use client'

import { useState } from 'react'
import { useVerifyTwoFactorToken, useVerifyBackupCode, useCreateTwoFactorSession } from '@/hooks/useTwoFactor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Smartphone, Key, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorVerificationProps {
  userId: string
  onVerificationSuccess: (sessionToken?: string) => void
  onCancel?: () => void
  showTrustDevice?: boolean
}

export function TwoFactorVerification({ 
  userId, 
  onVerificationSuccess, 
  onCancel,
  showTrustDevice = true 
}: TwoFactorVerificationProps) {
  const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp')
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const verifyTokenMutation = useVerifyTwoFactorToken()
  const verifyBackupMutation = useVerifyBackupCode()
  const createSessionMutation = useCreateTwoFactorSession()

  const handleTotpVerification = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Geçerli bir 6 haneli kod girin')
      return
    }

    setIsVerifying(true)
    try {
      const isValid = await verifyTokenMutation.mutateAsync({ userId, token: totpCode })
      
      if (isValid) {
        let sessionToken: string | null = null
        
        if (trustDevice) {
          sessionToken = await createSessionMutation.mutateAsync({ userId, durationHours: 24 }) || null
        }
        
        onVerificationSuccess(sessionToken || undefined)
      } else {
        toast.error('Geçersiz kod. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('TOTP verification error:', error)
      toast.error('Doğrulama başarısız')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBackupVerification = async () => {
    if (!backupCode || backupCode.length !== 8) {
      toast.error('Geçerli bir 8 haneli yedek kod girin')
      return
    }

    setIsVerifying(true)
    try {
      const isValid = await verifyBackupMutation.mutateAsync({ userId, code: backupCode })
      
      if (isValid) {
        let sessionToken: string | null = null
        
        if (trustDevice) {
          sessionToken = await createSessionMutation.mutateAsync({ userId, durationHours: 24 }) || null
        }
        
        onVerificationSuccess(sessionToken || undefined)
      } else {
        toast.error('Geçersiz yedek kod. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Backup code verification error:', error)
      toast.error('Doğrulama başarısız')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = () => {
    if (activeTab === 'totp') {
      handleTotpVerification()
    } else {
      handleBackupVerification()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>İki Faktörlü Doğrulama</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hesabınıza erişmek için doğrulama kodunuzu girin
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'totp' | 'backup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Yedek Kod
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Authenticator Kodunuz</Label>
              <Input
                id="totp-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Authenticator uygulamanızdan 6 haneli kodu girin
              </p>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Yedek kodlarınızı kaybettiyseniz, hesabınıza erişim için destek ekibiyle iletişime geçin.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="backup-code">Yedek Kodunuz</Label>
              <Input
                id="backup-code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="ABCD1234"
                maxLength={8}
                className="text-center text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                8 haneli yedek kodunuzu girin
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {showTrustDevice && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bu cihazı güvenilir olarak kaydet</Label>
            <p className="text-xs text-muted-foreground">
              Bu cihazı güvenilir olarak kaydederseniz, 24 saat boyunca 2FA kodu girmeniz gerekmeyecek.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trust-device"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="trust-device" className="text-sm">
                Bu cihazı güvenilir olarak kaydet
              </Label>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isVerifying}
              className="flex-1"
            >
              İptal
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              isVerifying || 
              (activeTab === 'totp' && totpCode.length !== 6) ||
              (activeTab === 'backup' && backupCode.length !== 8)
            }
            className="flex-1"
          >
            {isVerifying ? 'Doğrulanıyor...' : 'Doğrula'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
