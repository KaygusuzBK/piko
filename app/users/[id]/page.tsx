'use client'

import { useAuthStore } from '@/stores/authStore'
import { fetchUsers } from '@/lib/users'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Shield, ArrowLeft } from 'lucide-react'
import { User as DbUser } from '@/lib/users'

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadUser = async () => {
      setUserLoading(true)
      const users = await fetchUsers()
      const foundUser = users.find(u => u.id === params.id)
      setDbUser(foundUser || null)
      setUserLoading(false)
    }

    if (user) {
      loadUser()
    }
  }, [user, params.id])

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect will happen
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Kullanıcı Bulunamadı</h2>
              <p className="text-muted-foreground mb-6">Aradığınız kullanıcı mevcut değil.</p>
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Button onClick={() => router.push('/')} variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Kullanıcı Detayları
            </h2>
            <p className="text-muted-foreground">
              {dbUser.name || 'İsim belirtilmemiş'} kullanıcısının detaylı bilgileri
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
                <CardDescription>
                  Kullanıcının temel bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {dbUser.name || 'İsim belirtilmemiş'}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      ID: {dbUser.id}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{dbUser.email || 'Email belirtilmemiş'}</p>
                  </div>
                </div>

                {dbUser.created_at && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hesap Oluşturulma</p>
                      <p className="text-foreground">
                        {new Date(dbUser.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )}

                {dbUser.updated_at && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Son Güncelleme</p>
                      <p className="text-foreground">
                        {new Date(dbUser.updated_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Sistem Bilgileri
                </CardTitle>
                <CardDescription>
                  Kullanıcı ile ilgili sistem bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kullanıcı ID</p>
                    <p className="text-foreground font-mono text-sm break-all">{dbUser.id}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">JSON Verisi</h4>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {JSON.stringify(dbUser, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
