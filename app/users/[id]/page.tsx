'use client'

import { useAuthStore } from '@/stores/authStore'
import { fetchUserById, updateUserById, uploadUserImage } from '@/lib/users'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, use as usePromise } from 'react'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { User as DbUser } from '@/lib/users'
import { PostCard } from '@/components/PostCard'
import { PostWithAuthor, getUserPosts, togglePostBookmark, togglePostLike, togglePostRetweet, deletePost } from '@/lib/posts'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id: paramsId } = usePromise(params)
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const userLoadedRef = useRef<string | null>(null)
  const postsLoadedRef = useRef<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (userLoadedRef.current === paramsId) return

    const loadUser = async () => {
      setUserLoading(true)
      const foundUser = await fetchUserById(paramsId)
      setDbUser(foundUser)
      setUserLoading(false)
      userLoadedRef.current = paramsId
    }

    loadUser()
  }, [loading, user, user?.id, paramsId, router])

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (postsLoadedRef.current === paramsId) return

    const loadPosts = async () => {
      setPostsLoading(true)
      const data = await getUserPosts(paramsId)
      setPosts(data)
      setPostsLoading(false)
      postsLoadedRef.current = paramsId
    }

    loadPosts()
  }, [loading, user, user?.id, paramsId])

  // Scroll dinleyicisi: profil üst bölümü kompakt moda geçsin
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      const threshold = 40
      setIsCompact(el.scrollTop > threshold)
    }

    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="min-h-screen bg-transparent">
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
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-4 sm:py-6 px-3 sm:px-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 flex-1">
          {/* Sol Sidebar */}
          <LeftSidebar hideExtras />

          {/* Profil Orta Alan */}
          <div
            ref={scrollContainerRef}
            className="flex-grow min-h-screen border-x border-border lg:col-span-2 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-24"
            onScroll={(e) => {
              const target = e.currentTarget as HTMLDivElement
              const threshold = 40
              const next = target.scrollTop > threshold
              if (next !== isCompact) setIsCompact(next)
            }}
          >
            {/* Kompakt başlık */}
            {isCompact && (
              <div
                className="sticky top-0 z-20 h-14 md:h-16 border-b border-border px-4"
                style={{
                  backgroundImage: dbUser.avatar_url ? `url(${dbUser.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-piko-header" />
                <div className="relative h-full flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage 
                        src={dbUser.avatar_url} 
                        alt={dbUser.name || 'Kullanıcı'} 
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <div className="text-sm md:text-base font-semibold truncate text-foreground">{dbUser.name || 'Kullanıcı'}</div>
                      {dbUser.username && (
                        <div className="text-xs text-muted-foreground truncate">@{dbUser.username}</div>
                      )}
                    </div>
                  </div>
                  {user?.id === dbUser.id && (
                    <Button variant="outline" size="sm" className="h-8 md:h-9">Profili Düzenle</Button>
                  )}
                </div>
              </div>
            )}
            {isCompact && <div className="h-14 md:h-16" />}
            {/* Üst boşluk/başlık kaldırıldı: isim sadece profil bölümünde gösterilir */}

            {/* Profil Detayları */}
            <div>
              {/* Banner */}
              <div
                className={`bg-cover bg-center transition-all duration-300 ${isCompact ? 'h-40' : 'h-56 lg:h-72'}`}
                style={{ backgroundImage: dbUser.banner_url ? `url(${dbUser.banner_url})` : undefined }}
              >
                {!dbUser.banner_url && (
                  <div className="w-full h-full bg-piko-header" />
                )}
              </div>

              {/* Bilgiler */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <Avatar className={`border-4 border-background transition-all duration-300 ${isCompact ? 'w-24 h-24 -mt-12' : 'w-28 h-28 lg:w-32 lg:h-32 -mt-16 lg:-mt-20'}`}>
                    <AvatarImage 
                      src={dbUser.avatar_url} 
                      alt={dbUser.name || 'Kullanıcı'} 
                      className="object-cover"
                    />
                    <AvatarFallback className={`${isCompact ? 'text-lg' : 'text-2xl'}`}>
                      {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {user?.id === dbUser.id && !isCompact && (
                    <label className="mt-2 font-bold inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await uploadUserImage(user.id, file, 'banner')
                          if (url) {
                            const updated = await updateUserById(user.id, { banner_url: url })
                            if (updated) setDbUser(updated)
                          }
                        }}
                      />
                      <span className="px-3 py-1 rounded-md border border-border bg-background/60 hover:bg-background/80">Banner Değiştir</span>
                    </label>
                  )}
                  {user?.id === dbUser.id && !isCompact && (
                    <div className="flex gap-2 mt-2">
                      <label className="font-bold inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const url = await uploadUserImage(user.id, file, 'avatar')
                            if (url) {
                              const updated = await updateUserById(user.id, { avatar_url: url })
                              if (updated) setDbUser(updated)
                            }
                          }}
                        />
                        <span className="px-3 py-1 rounded-md border border-border bg-background/60 hover:bg-background/80">Avatar Değiştir</span>
                      </label>
                      <Button variant="outline" onClick={() => router.push(`/users/${dbUser.id}/edit`)}>Profili Düzenle</Button>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <h2 className={`font-bold text-foreground transition-all duration-300 ${isCompact ? 'text-xl' : 'text-2xl'}`}>{dbUser.name || 'Kullanıcı'}</h2>
                  {dbUser.username && <p className="text-muted-foreground">@{dbUser.username}</p>}
                </div>

                {dbUser.bio && (
                  <p className="mt-4 text-foreground/90">{dbUser.bio}</p>
                )}

                <div className="flex flex-wrap text-muted-foreground mt-4 space-x-4 text-sm">
                  {dbUser.location && <span>{dbUser.location}</span>}
                  {dbUser.website && (
                    <a href={dbUser.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{dbUser.website}</a>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {dbUser.created_at && (
                    <span>Katıldı: {new Date(dbUser.created_at).toLocaleDateString('tr-TR')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* İçerik Sekmesi ve Gönderiler */}
            <div className="border-b border-border">
              <nav className="flex">
                <button className="w-full py-4 font-bold text-foreground border-b-2 border-primary">Pikolar</button>
                <button className="w-full py-4 font-semibold text-muted-foreground hover:bg-accent transition">Yanıtlar</button>
                <button className="w-full py-4 font-semibold text-muted-foreground hover:bg-accent transition">Medya</button>
                <button className="w-full py-4 font-semibold text-muted-foreground hover:bg-accent transition">Beğeniler</button>
              </nav>
            </div>

            <div className="space-y-3 divide-y divide-border">
              {postsLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Gönderiler yükleniyor...</div>
              ) : posts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Henüz gönderi yok.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-0">
                    <PostCard
                      post={post}
                      canDelete={user?.id === post.author_id}
                      onDelete={async (postId: string) => {
                        if (!user) return
                        const ok = await deletePost(postId, user.id)
                        if (ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
                      }}
                      onLike={async (postId: string) => {
                        if (!user) return
                        await togglePostLike(postId, user.id)
                      }}
                      onRetweet={async (postId: string) => {
                        if (!user) return
                        await togglePostRetweet(postId, user.id)
                      }}
                      onBookmark={async (postId: string) => {
                        if (!user) return
                        await togglePostBookmark(postId, user.id)
                      }}
                      onComment={() => {}}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sağ Sidebar (profilde gizlendi) */}
          <div className="hidden lg:block" />
        </div>
      </main>
    </div>
  )
}
