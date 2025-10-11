# Supabase Kurulum Rehberi

Bu rehber, Piko sosyal medya uygulaması için Supabase'i yapılandırmak için gerekli adımları içerir.

## 📋 Gereksinimler

- Supabase hesabı ([supabase.com](https://supabase.com))
- Yeni bir Supabase projesi oluşturulmuş olmalı

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Giriş

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. Projenizi seçin veya yeni bir proje oluşturun

### 2. Email Authentication Aktifleştirme

1. Dashboard'da **Authentication** > **Providers** bölümüne gidin
2. **Email** provider'ını aktif edin
3. Ayarları yapılandırın:
   - ✅ **Enable Email provider**
   - ⚙️ **Confirm email**: İsteğe bağlı (email onayı gerektirmek için aktif edin)
   - ⚙️ **Secure email change**: Aktif önerilir

### 3. Database Schema Kurulumu

1. Dashboard'da **SQL Editor** bölümüne gidin
2. **New Query** butonuna tıklayın
3. `supabase/schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın

Schema aşağıdaki işlemleri gerçekleştirecektir:
- ✅ `users` tablosuna gerekli kolonları ekler
- ✅ `posts` ve `post_interactions` tablolarını oluşturur
- ✅ Storage bucket'ları oluşturur (avatars, banners)
- ✅ RLS (Row Level Security) politikalarını ayarlar
- ✅ Trigger'ları oluşturur:
  - Yeni kullanıcı kaydında otomatik `users` kaydı
  - `updated_at` otomatik güncellemesi
  - Post etkileşim sayaçları

### 4. Environment Variables (.env.local)

Projenizin kök dizininde `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Bu değerleri Supabase Dashboard'dan alabilirsiniz:
- **Settings** > **API** > **Project URL**
- **Settings** > **API** > **Project API keys** > **anon/public**

### 5. OAuth Providers (Opsiyonel)

GitHub ve Google ile giriş yapmak için:

#### GitHub OAuth:
1. [GitHub Developer Settings](https://github.com/settings/developers) > **OAuth Apps** > **New OAuth App**
2. Callback URL: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
3. Client ID ve Secret'ı Supabase Dashboard'a ekleyin:
   - **Authentication** > **Providers** > **GitHub**

#### Google OAuth:
1. [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**
2. **Create OAuth 2.0 Client ID**
3. Authorized redirect URI: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
4. Client ID ve Secret'ı Supabase Dashboard'a ekleyin:
   - **Authentication** > **Providers** > **Google**

## 🔧 Önemli Trigger Açıklaması

### `handle_new_user()` Trigger

Bu trigger, yeni bir kullanıcı kayıt olduğunda otomatik olarak çalışır:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Ne yapar?**
- Kullanıcı email/şifre, GitHub veya Google ile kayıt olduğunda
- Otomatik olarak `public.users` tablosuna bir kayıt oluşturur
- Email, isim ve ID bilgilerini `auth.users`'dan alır
- Username başlangıçta NULL olarak ayarlanır (kullanıcı daha sonra seçebilir)

**Neden önemli?**
- Kullanıcının uygulama içinde profil bilgilerine sahip olmasını sağlar
- Post atabilmesi ve etkileşimde bulunabilmesi için gereklidir
- Kullanıcı profilinin anında kullanılabilir olmasını garantiler

## 🧪 Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. `/login` sayfasına gidin
3. Yeni bir hesap oluşturun
4. Supabase Dashboard > **Authentication** > **Users** bölümünden kullanıcının oluşturulduğunu kontrol edin
5. **Table Editor** > **users** tablosunda profilin oluşturulduğunu görün

## 🔒 Güvenlik Notları

- ✅ RLS (Row Level Security) tüm tablolar için aktiftir
- ✅ Kullanıcılar sadece kendi verilerini düzenleyebilir
- ✅ Herkes postları ve profilleri görüntüleyebilir
- ✅ Storage'da kullanıcılar sadece kendi klasörlerine yazabilir
- ✅ Tüm politikalar `auth.uid()` kontrolü yapar

## 📚 Faydalı Linkler

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Storage](https://supabase.com/docs/guides/storage)

## 🆘 Sorun Giderme

### Kullanıcı kaydı oluşturulmuyor
- SQL Editor'de `handle_new_user()` fonksiyonunun hatasız çalıştığını kontrol edin
- Trigger'ın oluşturulduğunu doğrulayın: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Storage yükleme hatası
- Storage bucket'larının (`avatars`, `banners`) oluşturulduğunu kontrol edin
- RLS politikalarının doğru ayarlandığını doğrulayın

### RLS hatası
- Politikaların doğru tablolara atandığını kontrol edin
- `auth.uid()` fonksiyonunun erişilebilir olduğundan emin olun

