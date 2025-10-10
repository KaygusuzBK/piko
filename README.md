# 🌟 Piko - Modern Social App

Piko, Supabase ve Next.js ile geliştirilmiş modern bir sosyal uygulama. Kullanıcıların GitHub ve Google hesaplarıyla giriş yapabileceği, kullanıcı arama ve profil görüntüleme özelliklerine sahip bir platform.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- **GitHub OAuth** ile giriş
- **Google OAuth** ile giriş
- **Supabase Auth** entegrasyonu
- **Güvenli oturum yönetimi**

### 🔍 Kullanıcı Arama
- **Real-time arama** - Yazarken anlık filtreleme
- **Debounced search** - Performans optimizasyonu
- **İsim ve email** ile arama
- **Kullanıcı detay sayfaları**

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
git clone https://github.com/KaygusuzBK/piko.git
cd piko
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

Supabase Dashboard'da **SQL Editor**'a gidin ve aşağıdaki SQL'i çalıştırın:

```sql
-- Users tablosu oluşturma (opsiyonel - auth.users otomatik oluşur)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar kendi verilerini görebilir
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar kendi verilerini güncelleyebilir
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
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

### Kullanıcı Arama
1. Header'daki arama kutusuna tıklayın
2. Kullanıcı adı veya email yazın
3. Sonuçlardan birini seçin
4. Kullanıcı detay sayfasına yönlendirileceksiniz

### Tema Değiştirme
1. Header'daki tema butonuna tıklayın
2. **Açık**, **Koyu** veya **Sistem** temasını seçin

## 🏗️ Proje Yapısı

```
piko/
├── app/                    # Next.js App Router
│   ├── login/             # Giriş sayfası
│   ├── users/[id]/       # Kullanıcı detay sayfası
│   └── page.tsx          # Ana sayfa
├── components/            # React bileşenleri
│   ├── ui/               # Shadcn/ui bileşenleri
│   ├── Header.tsx        # Ana header
│   └── theme-toggle.tsx  # Tema değiştirici
├── contexts/             # React Context'leri
│   └── AuthContext.tsx   # Kimlik doğrulama context'i
├── lib/                  # Yardımcı fonksiyonlar
│   ├── supabase.ts       # Supabase client
│   └── users.ts          # Kullanıcı API'leri
├── stores/               # Zustand store'ları
│   └── authStore.ts      # Kimlik doğrulama store'u
└── public/              # Statik dosyalar
    └── piko_logo.png     # Logo
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

Hata bulduysanız lütfen [Issues](https://github.com/KaygusuzBK/piko/issues) bölümünden bildirin.

## 📞 İletişim

- **GitHub**: [@KaygusuzBK](https://github.com/KaygusuzBK)
- **Proje Linki**: [https://github.com/KaygusuzBK/piko](https://github.com/KaygusuzBK/piko)

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com) - UI bileşenleri
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Zustand](https://zustand-demo.pmnd.rs) - State management

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!