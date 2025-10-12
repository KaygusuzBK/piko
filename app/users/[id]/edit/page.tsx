'use client'

import { useEffect, useRef, useState, use as usePromise } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldSeparator, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchUserById, updateUserById, uploadUserImage, type User } from '@/lib/users'

type PageProps = { params: Promise<{ id: string }> }

export default function EditProfilePage({ params }: PageProps) {
  const { id } = usePromise(params)
  const { user, loading } = useAuthStore()
  const router = useRouter()

  const [dbUser, setDbUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const avatarFileRef = useRef<File | null>(null)
  const bannerFileRef = useRef<File | null>(null)

  // Load current
  useEffect(() => {
    (async () => {
      if (!id) return
      const u = await fetchUserById(id)
      if (u) {
        setDbUser(u)
        setName(u.name || '')
        setUsername(u.username || '')
        setBio(u.bio || '')
        setWebsite(u.website || '')
        setLocation(u.location || '')
        setPhone(u.phone || '')
        setAvatarPreview(u.avatar_url || null)
        setBannerPreview((u as unknown as { banner_url?: string })?.banner_url || null)
      }
    })()
  }, [id])

  // Guard: only owner can edit
  useEffect(() => {
    if (!loading && user && id && user.id !== id) {
      router.replace(`/users/${id}`)
    }
  }, [loading, user, id, router])

  const onChooseAvatar = (file?: File) => {
    if (!file) return
    avatarFileRef.current = file
    setAvatarPreview(URL.createObjectURL(file))
  }
  const onChooseBanner = (file?: File) => {
    if (!file) return
    bannerFileRef.current = file
    setBannerPreview(URL.createObjectURL(file))
  }

  const onSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      let avatarUrl = dbUser?.avatar_url || null
      let bannerUrl = (dbUser as unknown as { banner_url?: string })?.banner_url || null

      if (avatarFileRef.current) {
        const url = await uploadUserImage(user.id, avatarFileRef.current, 'avatar')
        if (url) avatarUrl = url
      }
      if (bannerFileRef.current) {
        const url = await uploadUserImage(user.id, bannerFileRef.current, 'banner')
        if (url) bannerUrl = url
      }

      const updated = await updateUserById(user.id, {
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        location: location.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
      })

      if (updated) {
        router.replace(`/users/${user.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user || !id) return null

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto min-h-0">
        <Card className="border-border bg-soc-ai-navy-dark/80 text-white">
          <CardContent className="p-4 sm:p-6">
            <FieldSet className="gap-5 sm:gap-6">
              <FieldLegend className="text-white">Profili Düzenle</FieldLegend>
              <FieldGroup>
                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>İsim</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black/20 text-white placeholder:text-white/60" placeholder="Ad Soyad" />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Kullanıcı Adı</FieldTitle>
                    <FieldDescription>@kullanici</FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-black/20 text-white placeholder:text-white/60" placeholder="kullanici" />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>
                    <FieldTitle>Biyografi</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-black/20 text-white placeholder:text-white/60 p-2" placeholder="Kendiniz hakkında..." />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Website</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-black/20 text-white placeholder:text-white/60" placeholder="https://..." />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Konum</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-black/20 text-white placeholder:text-white/60" placeholder="İl / Ülke" />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Telefon</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-black/20 text-white placeholder:text-white/60" placeholder="05xx..." />
                  </FieldContent>
                </Field>

                <FieldSeparator>Görseller</FieldSeparator>

                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Avatar</FieldTitle>
                    <FieldDescription>PNG/JPG önerilir.</FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <div className="flex items-center gap-3">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="avatar" className="h-16 w-16 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="h-16 w-16 rounded-full border border-border bg-black/10" />
                      )}
                      <label className="px-3 py-2 rounded-md border border-border bg-background/60 hover:bg-background/80 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChooseAvatar(e.target.files?.[0] || undefined)} />
                        Dosya Seç
                      </label>
                    </div>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel>
                    <FieldTitle>Banner</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <div className="flex items-center gap-3">
                      {bannerPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bannerPreview} alt="banner" className="h-16 w-28 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="h-16 w-28 rounded-md border border-border bg-black/10" />
                      )}
                      <label className="px-3 py-2 rounded-md border border-border bg-background/60 hover:bg-background/80 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChooseBanner(e.target.files?.[0] || undefined)} />
                        Dosya Seç
                      </label>
                    </div>
                  </FieldContent>
                </Field>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    İptal
                  </Button>
                  <Button onClick={onSave} disabled={saving} className="bg-primary text-primary-foreground">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


