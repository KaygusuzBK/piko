# Firebase FCM Push Notifications Setup

## 1. Firebase Proje Oluşturma

1. [Firebase Console](https://console.firebase.google.com) adresine gidin
2. "Create a project" veya "Add project" seçin
3. Proje adı: "SOC AI" (veya istediğiniz isim)
4. Google Analytics'i etkinleştirin (önerilen)
5. Proje oluşturulduktan sonra "Continue" tıklayın

## 2. Web App Ekleme

1. Firebase Console'da "Add app" → Web (</>) seçin
2. App nickname: "SOC AI Web"
3. Firebase Hosting'i etkinleştirin (opsiyonel)
4. "Register app" tıklayın

## 3. Firebase Konfigürasyonu

Firebase Console'da "Project settings" → "General" → "Your apps" bölümünden:

### Web App Config:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

Bu değerleri kopyalayın.

## 4. Cloud Messaging Kurulumu

1. Firebase Console'da "Build" → "Cloud Messaging" seçin
2. "Get started" tıklayın
3. Web push sertifikası oluşturun:
   - "Generate key pair" tıklayın
   - VAPID key pair oluşturulacak
   - Bu key'i kopyalayın

## 5. Environment Variables

`.env.local` dosyanıza ekleyin:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Server Key (for API calls)
FIREBASE_SERVER_KEY=your_server_key_here
```

### Server Key Alma:
1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key" tıklayın
3. JSON dosyasını indirin
4. `private_key` değerini `FIREBASE_SERVER_KEY` olarak kullanın

**VEYA** daha kolay yöntem:
1. Firebase Console → Project Settings → Cloud Messaging
2. "Server key" bölümünden key'i kopyalayın

## 6. Test Etme

1. Uygulamayı çalıştırın: `npm run dev`
2. Bir kullanıcı olarak giriş yapın
3. Push notification banner'ı göreceksiniz
4. "Etkinleştir" butonuna tıklayın
5. Tarayıcı izin isteyecek - "Allow" seçin
6. Test notification gönderin

## 7. Production Deployment

### Vercel Environment Variables:
1. Vercel dashboard > Project > Settings > Environment Variables
2. Tüm Firebase environment variable'ları ekleyin
3. HTTPS gereklidir (production için)

### Firebase Production Settings:
1. Firebase Console → Project Settings → General
2. "Authorized domains" bölümüne production domain'inizi ekleyin
3. `https://yourdomain.com` formatında

## 8. Push Notification Gönderme

API endpoint: `POST /api/notifications/push`

```javascript
const response = await fetch('/api/notifications/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    title: 'Yeni Beğeni!',
    message: 'Gönderiniz beğenildi',
    url: '/posts/123',
    icon: '/soc-ai_logo.png'
  })
})
```

## 9. Troubleshooting

### Firebase SDK Yüklenmiyor:
- Network sekmesinde Firebase script'lerinin yüklenip yüklenmediğini kontrol edin
- Console'da hata var mı bakın
- HTTPS gereklidir (production)

### Permission Denied:
- Tarayıcı ayarlarından site için notification izni verin
- `chrome://settings/content/notifications` adresinden kontrol edin

### Notification Gönderilmiyor:
- Firebase Console'da Cloud Messaging bölümünde test gönderin
- API key'ler doğru mu kontrol edin
- Console'da hata mesajları var mı bakın
- Service worker dosyası (`firebase-messaging-sw.js`) doğru konumda mı kontrol edin

### Service Worker Hatası:
- `public/firebase-messaging-sw.js` dosyasının var olduğunu kontrol edin
- Firebase script'lerinin doğru versiyonunu kullandığınızı kontrol edin
- Console'da service worker registration hatalarını kontrol edin

## 10. Firebase Console Dashboard

Dashboard'da görebileceğiniz:
- **Cloud Messaging**: Gönderilen notification'lar
- **Analytics**: Açılma oranları, click rates
- **Project Settings**: Konfigürasyon ayarları
- **Service Accounts**: API key'ler

## 11. Avantajlar

✅ **Google'ın resmi servisi** - Maksimum güvenilirlik
✅ **Tamamen ücretsiz** - Limit yok
✅ **Kolay kurulum** - SDK + API key yeterli
✅ **Güçlü analytics** - Detaylı istatistikler
✅ **Multi-platform** - Web, iOS, Android desteği
✅ **Real-time** - Anında bildirimler
✅ **Scalable** - Google'ın altyapısı
✅ **No VAPID complexity** - Firebase handles everything

## 12. Firebase vs Diğer Servisler

| Özellik | Firebase FCM | OneSignal | VAPID |
|---------|--------------|-----------|-------|
| **Maliyet** | Ücretsiz | 30K/ay | Ücretsiz |
| **Kurulum** | Kolay | Kolay | Karmaşık |
| **Güvenilirlik** | Google | İyi | Manuel |
| **Analytics** | Güçlü | İyi | Yok |
| **Multi-platform** | ✅ | ✅ | Sadece Web |

Bu setup ile Firebase FCM push notification sistemi çalışacak!
