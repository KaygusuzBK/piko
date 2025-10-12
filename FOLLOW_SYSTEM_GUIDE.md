# 👥 Takip Sistemi - Implementation Guide

Bu doküman, SOC-AI platformuna eklenen **Takip Sistemi** özelliğinin detaylı dokümantasyonudur.

## 📋 İçindekiler

1. [Özellik Özeti](#özellik-özeti)
2. [Veritabanı Şeması](#veritabanı-şeması)
3. [Backend Implementasyonu](#backend-implementasyonu)
4. [Frontend Implementasyonu](#frontend-implementasyonu)
5. [Kullanım Örnekleri](#kullanım-örnekleri)
6. [Test Senaryoları](#test-senaryoları)

## 🎯 Özellik Özeti

### Eklenen Özellikler

- ✅ **Takip Et/Takibi Bırak** - Kullanıcıları takip etme ve takipten çıkma
- ✅ **Takipçi/Takip Edilen Sayıları** - Profillerde görüntüleme
- ✅ **Takip Durumu** - İki kullanıcı arasındaki takip ilişkisini kontrol etme
- ✅ **Takipçi Listesi** - Bir kullanıcıyı takip edenleri listeleme
- ✅ **Takip Edilen Listesi** - Bir kullanıcının takip ettiklerini listeleme
- ✅ **Takip Önerileri** - Kullanıcıya önerilen profiller
- ✅ **Kişiselleştirilmiş Feed** - Takip edilen kullanıcıların gönderilerini gösterme

## 🗄️ Veritabanı Şeması

### Follows Tablosu

```sql
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

### Users Tablosu Güncellemeleri

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 CHECK (following_count >= 0);
```

### Indexler

```sql
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_follower_following ON follows(follower_id, following_id);
```

### RLS Politikaları

```sql
-- Herkes takip ilişkilerini görebilir
CREATE POLICY "Follows are viewable by everyone" ON follows 
  FOR SELECT USING (true);

-- Kullanıcılar sadece kendi takiplerini ekleyebilir
CREATE POLICY "Users can follow others" ON follows 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Kullanıcılar sadece kendi takiplerini kaldırabilir
CREATE POLICY "Users can unfollow others" ON follows 
  FOR DELETE USING (auth.uid() = follower_id);
```

### Otomatik Sayaç Güncellemeleri

```sql
-- Follow insert trigger
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();

-- Follow delete trigger
CREATE TRIGGER on_follow_delete
  AFTER DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_delete();
```

## 💻 Backend Implementasyonu

### 1. Type Definitions (`lib/types/follow.types.ts`)

```typescript
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface FollowStatus {
  isFollowing: boolean
  isFollowedBy: boolean
}

export interface FollowUser {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  followers_count: number
  following_count: number
  isFollowing?: boolean
}
```

### 2. Repository Layer (`lib/repositories/followRepository.ts`)

Ana fonksiyonlar:
- `followUser(followerId, followingId)` - Takip et
- `unfollowUser(followerId, followingId)` - Takipten çık
- `checkFollowStatus(currentUserId, targetUserId)` - Takip durumunu kontrol et
- `getFollowers(userId)` - Takipçileri getir
- `getFollowing(userId)` - Takip edilenleri getir
- `getFollowSuggestions(currentUserId)` - Takip önerileri
- `getFollowingIds(userId)` - Takip edilen ID'leri getir (feed için)

### 3. Service Layer (`lib/services/followService.ts`)

Business logic ve validation:
- `toggleFollow(currentUserId, targetUserId)` - Takip durumunu değiştir
- `checkFollowStatus(currentUserId, targetUserId)` - Validasyon ile kontrol
- `getFollowers(userId, currentUserId)` - Takipçileri takip durumlarıyla getir
- `getFollowing(userId, currentUserId)` - Takip edilenleri takip durumlarıyla getir

## 🎨 Frontend Implementasyonu

### 1. Custom Hooks (`hooks/useFollow.ts`)

```typescript
// Tek kullanıcı için takip durumu
const { followStatus, loading, toggleFollow, refresh } = useFollow(currentUserId, targetUserId)

// Takipçi listesi
const { followers, loading, refresh } = useFollowers(userId, currentUserId)

// Takip edilen listesi
const { following, loading, refresh } = useFollowing(userId, currentUserId)

// Takip önerileri
const { suggestions, loading, refresh } = useFollowSuggestions(currentUserId)
```

### 2. UI Components

#### FollowButton Component

```tsx
<FollowButton
  currentUserId={user?.id}
  targetUserId={profileUser.id}
  variant="default"
  size="sm"
  showIcon={true}
/>
```

Özellikler:
- Hover efekti ile "Takibi Bırak" yazısı
- Loading states
- "Seni takip ediyor" badge'i
- Optimistic updates

#### FollowSuggestions Component

```tsx
<FollowSuggestions
  currentUserId={user?.id}
  limit={5}
/>
```

Özellikler:
- Takip edilmeyen kullanıcı önerileri
- Hızlı takip butonu
- Profil önizleme

### 3. Profile Integration

ProfileHeader component'ine eklenenler:
- Follow/Unfollow butonu
- Followers count
- Following count
- Takip durumu göstergesi

## 📝 Kullanım Örnekleri

### Bir Kullanıcıyı Takip Etme

```typescript
import { useFollow } from '@/hooks/useFollow'

function ProfilePage({ profileUserId }) {
  const { user } = useAuthStore()
  const { followStatus, loading, toggleFollow } = useFollow(user?.id, profileUserId)

  return (
    <button onClick={toggleFollow} disabled={loading}>
      {followStatus.isFollowing ? 'Takibi Bırak' : 'Takip Et'}
    </button>
  )
}
```

### Takipçi Listesi Görüntüleme

```typescript
import { useFollowers } from '@/hooks/useFollow'

function FollowersPage({ userId }) {
  const { followers, loading } = useFollowers(userId)

  if (loading) return <Loader />

  return (
    <div>
      {followers.map(follower => (
        <UserCard key={follower.id} user={follower} />
      ))}
    </div>
  )
}
```

### Kişiselleştirilmiş Feed

```typescript
import { getPersonalizedFeedPosts } from '@/lib/services/postQueryService'

// Sadece takip edilen kullanıcıların gönderilerini getir
const posts = await postQueryService.getPersonalizedFeedPosts(
  userId,
  limit,
  offset,
  viewerUserId
)
```

## 🧪 Test Senaryoları

### 1. Takip Etme Testi

```
✓ Kullanıcı başka bir kullanıcıyı takip edebilmeli
✓ Takip sayısı otomatik artmalı
✓ Aynı kullanıcıyı iki kez takip etmemeli
✓ Kendini takip edememeli
```

### 2. Takipten Çıkma Testi

```
✓ Kullanıcı takip ettiği birini bırakabilmeli
✓ Takip sayısı otomatik azalmalı
✓ Takip etmediği birini unfollow edememeli
```

### 3. Takip Durumu Testi

```
✓ İki kullanıcı arasındaki takip durumunu doğru göstermeli
✓ "Karşılıklı takip" durumunu algılamalı
✓ Real-time güncellemeler çalışmalı
```

### 4. Takip Önerileri Testi

```
✓ Takip edilmeyen kullanıcıları önermeli
✓ Popüler kullanıcıları öncelikle göstermeli
✓ Kendini önermemeli
```

### 5. Performans Testi

```
✓ 1000+ takipçi ile hızlı çalışmalı
✓ Pagination doğru çalışmalı
✓ Index'ler etkin kullanılmalı
```

## 🚀 Deployment

### SQL Migration

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. `supabase/schema.sql` dosyasını çalıştırın
4. Migration'ın başarılı olduğunu doğrulayın

### Environment Variables

Değişiklik gerektiren environment variable yok.

### Build & Deploy

```bash
npm run build
npm run start
```

## 📊 Performance Optimizations

1. **Database Indexing**: Follower ve following sorguları için optimize edilmiş indexler
2. **Caching**: Follow status'lar client-side cache'leniyor
3. **Optimistic Updates**: UI anında güncellenip sonra doğrulanıyor
4. **Pagination**: Büyük takipçi listeleri için sayfalama
5. **RLS Policies**: Row-level security ile güvenli ve hızlı sorgular

## 🔒 Security

1. **RLS Policies**: Sadece yetkili işlemler
2. **Self-follow Prevention**: Kullanıcı kendini takip edemez
3. **Duplicate Prevention**: Aynı takip ilişkisi iki kez oluşamaz
4. **Cascade Delete**: Kullanıcı silindiğinde takip ilişkileri otomatik silinir

## 🎯 Next Steps

Gelecekte eklenebilecek özellikler:
- [ ] Takipçi/Takip edilen listelerinde sıralama seçenekleri
- [ ] Engelleme sistemi
- [ ] Özel/Gizli hesaplar
- [ ] Takip istekleri (private accounts için)
- [ ] Takipçi aktivite bildirimleri
- [ ] Takip analitikleri

## 📚 API Reference

### Follow Service Methods

```typescript
// Toggle follow status
toggleFollow(currentUserId: string, targetUserId: string): Promise<{ success: boolean; isFollowing: boolean }>

// Check follow status
checkFollowStatus(currentUserId: string, targetUserId: string): Promise<FollowStatus>

// Get followers
getFollowers(userId: string, currentUserId?: string, limit?: number): Promise<FollowUser[]>

// Get following
getFollowing(userId: string, currentUserId?: string, limit?: number): Promise<FollowUser[]>

// Get suggestions
getFollowSuggestions(currentUserId: string, limit?: number): Promise<FollowUser[]>
```

---

**Created**: 2025-01-12  
**Version**: 1.0.0  
**Author**: SOC-AI Development Team

