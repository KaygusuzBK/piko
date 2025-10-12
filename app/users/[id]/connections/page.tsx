'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, use as usePromise } from 'react'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { UserListCard } from '@/components/UserListCard'
import { useFollowers, useFollowing } from '@/hooks/useFollow'
import { useUserProfile } from '@/hooks/useUserProfile'

interface ConnectionsPageProps {
  params: Promise<{ id: string }>
}

type TabType = 'followers' | 'following'

export default function ConnectionsPage({ params }: ConnectionsPageProps) {
  const { id: userId } = usePromise(params)
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const { user: profileUser, loading: profileLoading } = useUserProfile(userId)
  
  // Get initial tab from URL param, default to 'followers'
  const initialTab = (searchParams.get('tab') as TabType) || 'followers'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const { followers, loading: followersLoading } = useFollowers(userId, user?.id, 100)
  const { following, loading: followingLoading } = useFollowing(userId, user?.id, 100)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Update URL when tab changes (without page reload)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Update URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url)
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user || !profileUser) {
    return null
  }

  const currentList = activeTab === 'followers' ? followers : following
  const currentLoading = activeTab === 'followers' ? followersLoading : followingLoading
  const emptyMessage = activeTab === 'followers'
    ? (user.id === userId ? 'Henüz takipçin yok' : 'Bu kullanıcının henüz takipçisi yok')
    : (user.id === userId ? 'Henüz kimseyi takip etmiyorsun' : 'Bu kullanıcı henüz kimseyi takip etmiyor')

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar hideExtras />

          <div className="lg:col-span-3 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
              <div className="px-4 py-3 flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/users/${userId}`)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">
                    {profileUser.name || 'Kullanıcı'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    @{profileUser.username || 'kullanici'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => handleTabChange('followers')}
                  className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-200 ${
                    activeTab === 'followers'
                      ? 'border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <span>Takipçiler</span>
                  {!followersLoading && (
                    <span className="ml-1 text-xs opacity-70">
                      ({followers.length})
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('following')}
                  className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-200 ${
                    activeTab === 'following'
                      ? 'border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <span>Takip Edilenler</span>
                  {!followingLoading && (
                    <span className="ml-1 text-xs opacity-70">
                      ({following.length})
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="pb-20">
              {currentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">
                  {currentList.map((listUser) => (
                    <UserListCard
                      key={listUser.id}
                      user={listUser}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

