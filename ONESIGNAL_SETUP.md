# OneSignal Push Notifications Setup

## 1. OneSignal Hesap Oluşturma

1. [OneSignal.com](https://onesignal.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. "New App/Website" seçin
4. App adı: "SOC AI"
5. Platform: "Web Push"

## 2. OneSignal App ID ve REST API Key Alma

### App ID:
1. OneSignal dashboard'da Settings > Keys & IDs
2. **App ID**'yi kopyalayın

### REST API Key:
1. Settings > Keys & IDs
2. **REST API Key**'i kopyalayın

## 3. Environment Variables

`.env.local` dosyanıza ekleyin:

```bash
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

## 4. OneSignal Web Push Configuration

OneSignal dashboard'da:

1. **Settings > Web Push**
2. **Site URL**: `http://localhost:3000` (development)
3. **Site URL**: `https://yourdomain.com` (production)
4. **Default Notification Icon**: `/soc-ai_logo.png`
5. **Default Notification Badge**: `/soc-ai_logo.png`

## 5. Test Etme

1. Uygulamayı çalıştırın: `npm run dev`
2. Bir kullanıcı olarak giriş yapın
3. Push notification banner'ı göreceksiniz
4. "Etkinleştir" butonuna tıklayın
5. Tarayıcı izin isteyecek - "Allow" seçin
6. Test notification gönderin

## 6. Production Deployment

### Vercel Environment Variables:
1. Vercel dashboard > Project > Settings > Environment Variables
2. Ekleyin:
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID`
   - `ONESIGNAL_APP_ID` 
   - `ONESIGNAL_REST_API_KEY`

### OneSignal Production Settings:
1. Site URL'yi production domain'inizle güncelleyin
2. HTTPS gereklidir (production için)

## 7. Push Notification Gönderme

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

## 8. Troubleshooting

### OneSignal SDK Yüklenmiyor:
- Network sekmesinde `OneSignalSDK.js` yüklenip yüklenmediğini kontrol edin
- Console'da hata var mı bakın

### Permission Denied:
- Tarayıcı ayarlarından site için notification izni verin
- HTTPS gereklidir (production)

### Notification Gönderilmiyor:
- OneSignal dashboard'da subscribers var mı kontrol edin
- API key'ler doğru mu kontrol edin
- Console'da hata mesajları var mı bakın

## 9. OneSignal Dashboard

Dashboard'da görebileceğiniz:
- **Audience**: Subscriber sayısı
- **Messages**: Gönderilen notification'lar
- **Analytics**: Açılma oranları, click rates
- **Settings**: App konfigürasyonu

## 10. Avantajlar

✅ **VAPID gerektirmez** - OneSignal kendi altyapısını kullanır
✅ **Ücretsiz** - 30,000 push/ay
✅ **Kolay kurulum** - SDK + API key yeterli
✅ **Dashboard** - Görsel yönetim
✅ **Analytics** - Detaylı istatistikler
✅ **Multi-platform** - Web, iOS, Android desteği
✅ **Segmentation** - Kullanıcı grupları
✅ **Scheduling** - Zamanlanmış gönderimler

Bu setup ile VAPID karmaşıklığı olmadan push notification sistemi çalışacak!
