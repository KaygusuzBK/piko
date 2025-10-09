'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, Shield } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect will happen
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Hoş Geldiniz! 👋
            </h2>
            <p className="text-muted-foreground">
              Supabase OAuth entegrasyonu ile başarıyla giriş yaptınız.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Kullanıcı Bilgileri
                </CardTitle>
                <CardDescription>
                  Hesap detaylarınız ve giriş bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kullanıcı ID</p>
                    <p className="text-foreground font-mono text-sm break-all">{user.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Son Giriş</p>
                    <p className="text-foreground">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('tr-TR') : 'Bilinmiyor'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hesap Oluşturulma</p>
                    <p className="text-foreground">
                      {new Date(user.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profil Bilgileri
                </CardTitle>
                <CardDescription>
                  OAuth provider&apos;dan gelen profil bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.user_metadata?.avatar_url && (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.user_metadata.avatar_url} alt="Profil Resmi" />
                      <AvatarFallback>
                        {user.user_metadata.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.user_metadata.full_name || user.user_metadata.name || 'İsim belirtilmemiş'}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {user.user_metadata.provider || 'Provider bilinmiyor'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {user.user_metadata?.provider_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Provider ID</p>
                    <p className="text-foreground font-mono text-sm break-all">{user.user_metadata.provider_id}</p>
                  </div>
                )}
                
                {user.user_metadata?.user_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Kullanıcı Adı</p>
                    <p className="text-foreground">@{user.user_metadata.user_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-accent border-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Başarıyla Giriş Yaptınız!
                  </h3>
                  <p className="text-muted-foreground">
                    Supabase OAuth entegrasyonu çalışıyor. GitHub veya Google hesabınızla giriş yapabilirsiniz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}