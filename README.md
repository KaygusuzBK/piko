# 🤖 SOC-AI - Modern Social AI Platform

SOC-AI, Supabase ve Next.js ile geliştirilmiş modern bir sosyal AI platformu. Twitter benzeri özellikler sunan, kullanıcıların gönderi paylaşabileceği, beğenebileceği ve AI destekli etkileşim kurabileceği bir platform.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- **GitHub OAuth** ile giriş
- **Google OAuth** ile giriş
- **Email/Password** ile giriş ve kayıt
- **Supabase Auth** entegrasyonu
- **Güvenli oturum yönetimi**

### 📝 Gönderi Paylaşma
- **280 karakter** gönderi limiti
- **Real-time** gönderi oluşturma
- **Emoji ve resim** desteği
- **Hashtag** desteği

### 🔍 Kullanıcı Arama
- **Real-time arama** - Yazarken anlık filtreleme
- **Debounced search** - Performans optimizasyonu
- **İsim ve email** ile arama
- **Kullanıcı detay sayfaları**

### 💬 Sosyal Etkileşim
- **Beğeni** sistemi
- **Retweet** özelliği
- **Yorum** yapma
- **Kaydetme** (bookmark/favorites)
- **Takip** sistemi

### 🎨 Modern UI/UX
- **Shadcn/ui** bileşenleri
- **Dark/Light tema** desteği
- **Responsive tasarım**
- **Modern animasyonlar**

### 🏗️ State Management
- **Zustand** ile global state yönetimi
- **Persist middleware** ile veri saklama
- **TypeScript** desteği

## 🚀 Teknolojiler

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Theme**: next-themes
- **Analytics**: Vercel Analytics & Speed Insights

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase hesabı

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/KaygusuzBK/soc-ai.git
cd soc-ai
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 3. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. **Authentication** → **Providers** bölümünden:
   - GitHub OAuth'u etkinleştirin
   - Google OAuth'u etkinleştirin
   - Email/Password authentication'ı etkinleştirin
4. **Settings** → **API** bölümünden:
   - Project URL'i kopyalayın
   - Anon public key'i kopyalayın

### 4. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Veritabanı Kurulumu

Supabase Dashboard'da **SQL Editor**'a gidin ve `supabase/schema.sql` dosyasındaki SQL kodunu çalıştırın. Bu dosya şunları içerir:

- **Users** tablosu genişletme (username, avatar_url, bio, website, location)
- **Posts** tablosu (gönderiler)
- **Post interactions** tablosu (beğeni, retweet, bookmark)
- **RLS politikaları** (güvenlik)
- **Trigger'lar** (otomatik sayaç güncellemeleri)
- **Profiles tablosu otomatik birleştirme** (eğer varsa)

Alternatif olarak, SQL Editor'da aşağıdaki komutu çalıştırabilirsiniz:

```sql
-- Temel tabloları oluştur
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  retweets_count INTEGER DEFAULT 0 CHECK (retweets_count >= 0)
);

CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'retweet', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

-- RLS politikalarını etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Temel politikalar
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Post interactions are viewable by everyone" ON post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own interactions" ON post_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON post_interactions FOR DELETE USING (auth.uid() = user_id);
```

### 6. Projeyi Çalıştırın

```bash
npm run dev
# veya
yarn dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacak.

## 📱 Kullanım

### Giriş Yapma
1. Ana sayfaya gidin
2. **GitHub**, **Google** veya **Email/Password** ile giriş yapın
3. OAuth izinlerini onaylayın

### Gönderi Paylaşma
1. Ana sayfadaki gönderi oluşturma kutusuna tıklayın
2. Gönderinizi yazın (maksimum 280 karakter)
3. **Ctrl+Enter** veya **Gönder** butonuna tıklayın
4. Gönderiniz feed'de görünecek

### Sosyal Etkileşim
1. Gönderileri **beğenebilir** (kalp ikonu)
2. Gönderileri **retweet** edebilirsiniz
3. Gönderileri **kaydedebilir**siniz (bookmark)
4. Gönderilere **yorum** yapabilirsiniz

### Tema Değiştirme
1. Header'daki tema butonuna tıklayın
2. **Açık**, **Koyu** veya **Sistem** temasını seçin

## 🏗️ Proje Yapısı

```
soc-ai/
├── app/                    # Next.js App Router
│   ├── login/             # Giriş sayfası
│   ├── users/[id]/       # Kullanıcı detay sayfası
│   ├── favorites/         # Favoriler sayfası
│   └── page.tsx          # Ana sayfa
├── components/            # React bileşenleri
│   ├── ui/               # Shadcn/ui bileşenleri
│   ├── post/             # Post bileşenleri
│   ├── profile/          # Profile bileşenleri
│   ├── header/           # Header bileşenleri
│   ├── Header.tsx        # Ana header
│   ├── CreatePost.tsx    # Gönderi oluşturma
│   ├── PostCard.tsx      # Gönderi kartı
│   └── theme-toggle.tsx  # Tema değiştirici
├── contexts/             # React Context'leri
│   └── AuthContext.tsx   # Kimlik doğrulama context'i
├── hooks/                # Custom React hooks
│   ├── usePosts.ts       # Post hooks
│   ├── useUserProfile.ts # User profile hooks
│   └── usePostInteractions.ts # Interaction hooks
├── lib/                  # Yardımcı fonksiyonlar
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── supabase.ts      # Supabase client
│   ├── users.ts         # Kullanıcı API'leri
│   └── posts.ts         # Gönderi API'leri
├── supabase/             # Veritabanı şemaları
│   └── schema.sql       # Ana veritabanı şeması
├── stores/               # Zustand store'ları
│   └── authStore.ts     # Kimlik doğrulama store'u
└── public/              # Statik dosyalar
    └── soc-ai_logo.png  # Logo
```

## 🔧 Geliştirme

### Build Alma

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## 🌐 Deployment

### Vercel (Önerilen)

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

### Diğer Platformlar

- **Netlify**: Static site olarak deploy
- **Railway**: Full-stack app olarak deploy
- **DigitalOcean**: VPS üzerinde deploy

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🐛 Hata Bildirimi

Hata bulduysanız lütfen [Issues](https://github.com/KaygusuzBK/soc-ai/issues) bölümünden bildirin.

## 📞 İletişim

- **GitHub**: [@KaygusuzBK](https://github.com/KaygusuzBK)
- **Proje Linki**: [https://github.com/KaygusuzBK/soc-ai](https://github.com/KaygusuzBK/soc-ai)

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com) - UI bileşenleri
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Zustand](https://zustand-demo.pmnd.rs) - State management

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- **GitHub OAuth** ile giriş
- **Google OAuth** ile giriş
- **Supabase Auth** entegrasyonu
- **Güvenli oturum yönetimi**

### 📝 Gönderi Paylaşma
- **280 karakter** gönderi limiti
- **Real-time** gönderi oluşturma
- **Emoji ve resim** desteği
- **Hashtag** desteği

### 🔍 Kullanıcı Arama
- **Real-time arama** - Yazarken anlık filtreleme
- **Debounced search** - Performans optimizasyonu
- **İsim ve email** ile arama
- **Kullanıcı detay sayfaları**

### 💬 Sosyal Etkileşim
- **Beğeni** sistemi
- **Retweet** özelliği
- **Yorum** yapma
- **Kaydetme** (bookmark)
- **Takip** sistemi

### 🎨 Modern UI/UX
- **Shadcn/ui** bileşenleri
- **Dark/Light tema** desteği
- **Responsive tasarım**
- **Modern animasyonlar**

### 🏗️ State Management
- **Zustand** ile global state yönetimi
- **Persist middleware** ile veri saklama
- **TypeScript** desteği

## 🚀 Teknolojiler

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Theme**: next-themes

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase hesabı

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/KaygusuzBK/soc-ai.git
cd soc-ai
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 3. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. **Authentication** → **Providers** bölümünden:
   - GitHub OAuth'u etkinleştirin
   - Google OAuth'u etkinleştirin
4. **Settings** → **API** bölümünden:
   - Project URL'i kopyalayın
   - Anon public key'i kopyalayın

### 4. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Veritabanı Kurulumu

Supabase Dashboard'da **SQL Editor**'a gidin ve `supabase/schema.sql` dosyasındaki SQL kodunu çalıştırın. Bu dosya şunları içerir:

- **Users** tablosu genişletme (username, avatar_url, bio, website, location)
- **Posts** tablosu (gönderiler)
- **Post interactions** tablosu (beğeni, retweet, bookmark)
- **RLS politikaları** (güvenlik)
- **Trigger'lar** (otomatik sayaç güncellemeleri)
- **Profiles tablosu otomatik birleştirme** (eğer varsa)

Alternatif olarak, SQL Editor'da aşağıdaki komutu çalıştırabilirsiniz:

```sql
-- Temel tabloları oluştur
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  retweets_count INTEGER DEFAULT 0 CHECK (retweets_count >= 0)
);

CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'retweet', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

-- RLS politikalarını etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Temel politikalar
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Post interactions are viewable by everyone" ON post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own interactions" ON post_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON post_interactions FOR DELETE USING (auth.uid() = user_id);
```

### 6. Projeyi Çalıştırın

```bash
npm run dev
# veya
yarn dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacak.

## 📱 Kullanım

### Giriş Yapma
1. Ana sayfaya gidin
2. **GitHub** veya **Google** ile giriş yapın
3. OAuth izinlerini onaylayın

### Gönderi Paylaşma
1. Ana sayfadaki gönderi oluşturma kutusuna tıklayın
2. Gönderinizi yazın (maksimum 280 karakter)
3. **Ctrl+Enter** veya **Gönder** butonuna tıklayın
4. Gönderiniz feed'de görünecek

### Sosyal Etkileşim
1. Gönderileri **beğenebilir** (kalp ikonu)
2. Gönderileri **retweet** edebilirsiniz
3. Gönderileri **kaydedebilir**siniz (bookmark)
4. Gönderilere **yorum** yapabilirsiniz

### Tema Değiştirme
1. Header'daki tema butonuna tıklayın
2. **Açık**, **Koyu** veya **Sistem** temasını seçin

## 🏗️ Proje Yapısı

```
soc-ai/
├── app/                    # Next.js App Router
│   ├── login/             # Giriş sayfası
│   ├── users/[id]/       # Kullanıcı detay sayfası
│   └── page.tsx          # Ana sayfa
├── components/            # React bileşenleri
│   ├── ui/               # Shadcn/ui bileşenleri
│   ├── Header.tsx        # Ana header
│   ├── CreatePost.tsx    # Gönderi oluşturma
│   ├── PostCard.tsx      # Gönderi kartı
│   └── theme-toggle.tsx  # Tema değiştirici
├── contexts/             # React Context'leri
│   └── AuthContext.tsx   # Kimlik doğrulama context'i
├── lib/                  # Yardımcı fonksiyonlar
│   ├── supabase.ts       # Supabase client
│   ├── users.ts          # Kullanıcı API'leri
│   └── posts.ts          # Gönderi API'leri
├── supabase/             # Veritabanı şemaları
│   └── schema.sql        # Ana veritabanı şeması
├── stores/               # Zustand store'ları
│   └── authStore.ts      # Kimlik doğrulama store'u
└── public/              # Statik dosyalar
    └── soc-ai_logo.png  # Logo
```

## 🔧 Geliştirme

### Build Alma

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## 🌐 Deployment

### Vercel (Önerilen)

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub repository'nizi bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

### Diğer Platformlar

- **Netlify**: Static site olarak deploy
- **Railway**: Full-stack app olarak deploy
- **DigitalOcean**: VPS üzerinde deploy

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🐛 Hata Bildirimi

Hata bulduysanız lütfen [Issues](https://github.com/KaygusuzBK/soc-ai/issues) bölümünden bildirin.

## 📞 İletişim

- **GitHub**: [@KaygusuzBK](https://github.com/KaygusuzBK)
- **Proje Linki**: [https://github.com/KaygusuzBK/soc-ai](https://github.com/KaygusuzBK/soc-ai)

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com) - UI bileşenleri
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Zustand](https://zustand-demo.pmnd.rs) - State management

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!