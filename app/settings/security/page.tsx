'use client'

import { useState } from 'react'
import { useTwoFactorSettings, useDisableTwoFactor, useGenerateNewBackupCodes, useRevokeAllSessions } from '@/hooks/useTwoFactor'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TwoFactorSetup } from '@/components/security/TwoFactorSetup'
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function SecuritySettingsPage() {
  const { user } = useAuthStore()
  const [showSetup, setShowSetup] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const { data: settings, isLoading } = useTwoFactorSettings(user?.id)
  const disableTwoFactorMutation = useDisableTwoFactor()
  const generateBackupCodesMutation = useGenerateNewBackupCodes()
  const revokeSessionsMutation = useRevokeAllSessions()

  const handleDisableTwoFactor = async () => {
    if (!user?.id) return
    
    if (confirm('2FA\'yı devre dışı bırakmak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await disableTwoFactorMutation.mutateAsync(user.id)
        toast.success('2FA başarıyla devre dışı bırakıldı')
      } catch (error) {
        console.error('Error disabling 2FA:', error)
      }
    }
  }

  const handleGenerateNewBackupCodes = async () => {
    if (!user?.id) return
    
    if (confirm('Yeni yedek kodlar oluşturulacak. Eski kodlar geçersiz olacak. Devam etmek istiyor musunuz?')) {
      try {
        await generateBackupCodesMutation.mutateAsync({ userId: user.id, count: 10 })
        setShowBackupCodes(true)
      } catch (error) {
        console.error('Error generating backup codes:', error)
      }
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!user?.id) return
    
    if (confirm('Tüm güvenilir cihazların oturumları iptal edilecek. Devam etmek istiyor musunuz?')) {
      try {
        await revokeSessionsMutation.mutateAsync(user.id)
        toast.success('Tüm oturumlar iptal edildi')
      } catch (error) {
        console.error('Error revoking sessions:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <TwoFactorSetup
          userId={user?.id || ''}
          userEmail={user?.email || ''}
          onSetupComplete={() => setShowSetup(false)}
        />
      </div>
    )
  }

  if (showBackupCodes && generateBackupCodesMutation.data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Yeni Yedek Kodlar Oluşturuldu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Önemli:</strong> Bu kodları güvenli bir yerde saklayın. 
                Telefonunuzu kaybederseniz bu kodlarla hesabınıza erişebilirsiniz.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Yeni Yedek Kodlarınız</h3>
              <div className="grid grid-cols-2 gap-2">
                {generateBackupCodesMutation.data.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="font-mono text-sm">{code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(code)
                        toast.success('Kod kopyalandı')
                      }}
                    >
                      Kopyala
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowBackupCodes(false)} className="w-full">
              Tamam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Güvenlik Ayarları</h1>
        <p className="text-muted-foreground mt-2">
          Hesabınızın güvenliğini yönetin
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki Faktörlü Doğrulama (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">2FA Etkin</span>
                  <Badge variant="secondary">Güvenli</Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisableTwoFactor}
                  disabled={disableTwoFactorMutation.isPending}
                >
                  {disableTwoFactorMutation.isPending ? 'Devre Dışı Bırakılıyor...' : 'Devre Dışı Bırak'}
                </Button>
              </div>

              {settings.setup_at && (
                <p className="text-sm text-muted-foreground">
                  Kurulum tarihi: {formatDistanceToNow(new Date(settings.setup_at), { 
                    addSuffix: true, 
                    locale: tr 
                  })}
                </p>
              )}

              <Separator />

              {/* Backup Codes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">Yedek Kodlar</span>
                    <Badge variant="outline">
                      {settings.backupCodes.filter(code => !code.used).length} kullanılabilir
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateNewBackupCodes}
                    disabled={generateBackupCodesMutation.isPending}
                  >
                    {generateBackupCodesMutation.isPending ? 'Oluşturuluyor...' : 'Yeni Kodlar Oluştur'}
                  </Button>
                </div>

                {settings.backupCodes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Son kullanılan kodlar:
                    </p>
                    <div className="space-y-1">
                      {settings.backupCodes.slice(0, 3).map((code) => (
                        <div key={code.id} className="flex items-center justify-between text-sm">
                          <code className="font-mono">{code.code}</code>
                          <div className="flex items-center gap-2">
                            {code.used ? (
                              <>
                                <Badge variant="destructive" className="text-xs">Kullanıldı</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {code.used_at && formatDistanceToNow(new Date(code.used_at), { 
                                    addSuffix: true, 
                                    locale: tr 
                                  })}
                                </span>
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Kullanılabilir</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Recent Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">Güvenilir Cihazlar</span>
                    <Badge variant="outline">
                      {settings.recentSessions.length} aktif
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRevokeAllSessions}
                    disabled={revokeSessionsMutation.isPending}
                  >
                    {revokeSessionsMutation.isPending ? 'İptal Ediliyor...' : 'Tümünü İptal Et'}
                  </Button>
                </div>

                {settings.recentSessions.length > 0 && (
                  <div className="space-y-2">
                    {settings.recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(session.created_at), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {new Date(session.expires_at) > new Date() ? (
                            <Badge variant="secondary" className="text-xs">Aktif</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Süresi Dolmuş</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  2FA şu anda devre dışı. Hesabınızı daha güvenli hale getirmek için 2FA&apos;yı etkinleştirin.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                2FA&apos;yı Etkinleştir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Güvenlik İpuçları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Şifre Güvenliği</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Güçlü ve benzersiz bir şifre kullanın</li>
              <li>• Şifrenizi düzenli olarak değiştirin</li>
              <li>• Şifrenizi kimseyle paylaşmayın</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">2FA Güvenliği</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Yedek kodlarınızı güvenli bir yerde saklayın</li>
              <li>• Güvenilir olmayan cihazları kaydetmeyin</li>
              <li>• Şüpheli aktivite durumunda tüm oturumları iptal edin</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
