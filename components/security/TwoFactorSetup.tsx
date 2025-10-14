'use client'

import { useState, useEffect } from 'react'
import { useGenerateTwoFactorSetup, useEnableTwoFactor, useVerifyTwoFactorToken } from '@/hooks/useTwoFactor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  userId: string
  userEmail: string
  onSetupComplete?: () => void
}

export function TwoFactorSetup({ userId, userEmail, onSetupComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const generateSetupMutation = useGenerateTwoFactorSetup()
  const enableTwoFactorMutation = useEnableTwoFactor()
  const verifyTokenMutation = useVerifyTwoFactorToken()

  useEffect(() => {
    if (step === 'setup') {
      generateSetupMutation.mutate(
        { userId, userEmail },
        {
          onSuccess: (data) => {
            setSetupData(data)
            setBackupCodes(data.backupCodes)
          }
        }
      )
    }
  }, [step, userId, userEmail])

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Geçerli bir 6 haneli kod girin')
      return
    }

    try {
      const isValid = await verifyTokenMutation.mutateAsync({ userId, token: verificationCode })
      
      if (isValid) {
        // Enable 2FA
        await enableTwoFactorMutation.mutateAsync({ userId, secret: setupData.secret })
        setStep('complete')
        onSetupComplete?.()
      } else {
        toast.error('Geçersiz kod. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Verification error:', error)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      toast.success(`${type} kopyalandı`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Kopyalama başarısız')
    }
  }

  if (generateSetupMutation.isPending) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">2FA kurulumu hazırlanıyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'setup' && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2FA Kurulumu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Install App */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">1. Authenticator Uygulaması İndirin</h3>
            <p className="text-sm text-muted-foreground">
              Google Authenticator, Authy, Microsoft Authenticator veya benzeri bir uygulama indirin.
            </p>
          </div>

          <Separator />

          {/* Step 2: Scan QR Code */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">2. QR Kodu Tarayın</h3>
            <p className="text-sm text-muted-foreground">
              Authenticator uygulamanızla aşağıdaki QR kodu tarayın:
            </p>
            
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <img 
                src={setupData.qrCodeUrl} 
                alt="2FA QR Code" 
                className="w-48 h-48"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Manuel Anahtar (QR kod çalışmazsa):</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={setupData.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.secret, 'Anahtar')}
                >
                  {copiedCode === 'Anahtar' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 3: Verify */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">3. Kodu Doğrulayın</h3>
            <p className="text-sm text-muted-foreground">
              Authenticator uygulamanızdan 6 haneli kodu girin:
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Doğrulama Kodu</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || verifyTokenMutation.isPending}
              className="w-full"
            >
              {verifyTokenMutation.isPending ? 'Doğrulanıyor...' : 'Doğrula ve Etkinleştir'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            2FA Başarıyla Etkinleştirildi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Önemli:</strong> Aşağıdaki yedek kodları güvenli bir yerde saklayın. 
              Telefonunuzu kaybederseniz bu kodlarla hesabınıza erişebilirsiniz.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Yedek Kodlarınız</h3>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono text-sm">{code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code, `code-${index}`)}
                  >
                    {copiedCode === `code-${index}` ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bu kodları bir kez kullandıktan sonra tekrar kullanamazsınız. 
              Yeni kodlar oluşturmak için güvenlik ayarlarından yedek kodları yenileyebilirsiniz.
            </AlertDescription>
          </Alert>

          <Button onClick={() => onSetupComplete?.()} className="w-full">
            Tamam
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
