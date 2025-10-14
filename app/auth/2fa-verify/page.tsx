'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { TwoFactorVerification } from '@/components/security/TwoFactorVerification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function TwoFactorVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [isVerified, setIsVerified] = useState(false)

  const redirectPath = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has 2FA enabled
    // This would typically be done via an API call
    // For now, we'll assume 2FA is enabled if user reaches this page
  }, [user, router])

  const handleVerificationSuccess = (sessionToken?: string) => {
    setIsVerified(true)
    
    // Store session token in cookie if provided
    if (sessionToken) {
      document.cookie = `2fa_session=${sessionToken}; path=/; max-age=${24 * 60 * 60}; secure; samesite=strict`
    }

    // Redirect to intended page
    setTimeout(() => {
      router.push(redirectPath)
    }, 1000)
  }

  const handleCancel = () => {
    router.push('/')
  }

  if (!user) {
    return null
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Doğrulama Başarılı</h2>
            <p className="text-muted-foreground">
              Yönlendiriliyorsunuz...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Güvenlik Doğrulaması</h1>
          <p className="text-muted-foreground">
            Hesabınıza erişmek için 2FA doğrulaması gerekiyor
          </p>
        </div>

        {/* User Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.email?.split('@')[0] || 'Kullanıcı'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2FA Verification */}
        <TwoFactorVerification
          userId={user.id}
          onVerificationSuccess={handleVerificationSuccess}
          onCancel={handleCancel}
          showTrustDevice={true}
        />

        {/* Help */}
        <Card>
          <CardContent className="p-4">
            <Alert>
              <AlertDescription>
                <strong>Yardım:</strong> Authenticator uygulamanızı bulamıyor musunuz? 
                Yedek kodlarınızı kullanabilir veya{' '}
                <Button variant="link" className="p-0 h-auto">
                  destek ekibiyle iletişime geçebilirsiniz
                </Button>
                .
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TwoFactorVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Yükleniyor...</h2>
            <p className="text-muted-foreground">
              Güvenlik doğrulaması hazırlanıyor...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <TwoFactorVerificationContent />
    </Suspense>
  )
}
