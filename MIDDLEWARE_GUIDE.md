# Middleware Kullanım Kılavuzu

Bu projede oluşturduğumuz middleware sistemi hakkında detaylı bilgiler.

## 📁 Dosya Yapısı

```
middleware.ts                    # Ana middleware dosyası
lib/middleware/
├── apiMiddleware.ts             # API rotaları için özel middleware
├── securityMiddleware.ts        # Güvenlik kontrolleri
├── analyticsMiddleware.ts       # Analytics ve monitoring
└── testMiddleware.ts           # Test fonksiyonları
```

## 🔧 Middleware Türleri

### 1. Ana Middleware (`middleware.ts`)
- **Amaç**: Tüm istekleri yakalar ve yönlendirir
- **Çalışma Sırası**:
  1. Güvenlik Kontrolü
  2. API Middleware (API rotaları için)
  3. Analytics ve Monitoring
  4. İstek Loglama
  5. Kimlik Doğrulama
  6. Rate Limiting
  7. Yönlendirme

### 2. Güvenlik Middleware (`securityMiddleware.ts`)
- **Özellikler**:
  - SQL Injection koruması
  - XSS koruması
  - Path Traversal koruması
  - Bot detection
  - Güvenlik başlıkları (CSP, X-Frame-Options, vb.)
  - Şüpheli parametre kontrolü

### 3. API Middleware (`apiMiddleware.ts`)
- **Özellikler**:
  - CORS ayarları
  - API Key kontrolü
  - Request boyut kontrolü
  - API-specific rate limiting
  - OPTIONS istekleri için özel yanıt

### 4. Analytics Middleware (`analyticsMiddleware.ts`)
- **Özellikler**:
  - Sayfa görüntüleme takibi
  - Performance monitoring
  - Custom event tracking
  - Error tracking
  - Response time ölçümü

## 🚀 Kullanım Örnekleri

### Middleware'i Test Etme

```typescript
import { runMiddlewareTests, testScenarios } from './lib/middleware/testMiddleware';

// Tüm testleri çalıştır
await runMiddlewareTests();

// Tek bir test senaryosu
const request = testScenarios.normalRequest();
logRequestDetails(request);
```

### Custom Event Tracking

```typescript
import { trackUserAction, trackPerformance } from './lib/middleware/analyticsMiddleware';

// Kullanıcı aksiyonu takibi
trackUserAction('post_liked', { postId: '123', userId: '456' });

// Performance metrik takibi
trackPerformance('page_load_time', 1500, 'ms');
```

## ⚙️ Konfigürasyon

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Middleware ayarları
MIDDLEWARE_RATE_LIMIT_MAX=100
MIDDLEWARE_RATE_LIMIT_WINDOW=60000
API_RATE_LIMIT_MAX=30
```

### Middleware Config

```typescript
export const config = {
  matcher: [
    // Hangi rotaların middleware'den geçeceğini belirler
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## 🔒 Güvenlik Özellikleri

### 1. SQL Injection Koruması
```typescript
// Bu tür istekler engellenir:
// /?id=1; DROP TABLE users;
// /?search=1' OR '1'='1
```

### 2. XSS Koruması
```typescript
// Bu tür istekler engellenir:
// /?search=<script>alert('xss')</script>
// /?onload=alert('xss')
```

### 3. Path Traversal Koruması
```typescript
// Bu tür istekler engellenir:
// /../../../etc/passwd
// /%2e%2e%2f%2e%2e%2f
```

## 📊 Analytics Özellikleri

### Otomatik Takip
- Sayfa görüntülemeleri
- Post görüntülemeleri
- Profil görüntülemeleri
- Login sayfası görüntülemeleri

### Performance Metrikleri
- Response time
- Page load time
- Middleware execution time

## 🧪 Test Senaryoları

### Mevcut Testler
1. **Normal İstek**: Standart sayfa istekleri
2. **Korumalı Sayfa**: Giriş yapmamış kullanıcılar için
3. **SQL Injection**: Güvenlik testi
4. **XSS**: Güvenlik testi
5. **Bot Detection**: Bot istekleri
6. **Rate Limiting**: Çok sayıda istek

### Test Çalıştırma
```bash
# Development ortamında
npm run dev

# Console'da middleware loglarını görebilirsiniz
```

## 🚨 Hata Ayıklama

### Log Seviyeleri
- `🔍` Middleware başlangıcı
- `📝` İstek logları
- `🔐` Kimlik doğrulama
- `🚫` Rate limiting
- `🔄` Yönlendirmeler
- `🚨` Güvenlik uyarıları
- `📊` Analytics events
- `❌` Hatalar

### Yaygın Sorunlar

1. **Middleware çalışmıyor**
   - `middleware.ts` dosyasının proje kökünde olduğundan emin olun
   - `config.matcher` ayarlarını kontrol edin

2. **Supabase auth hatası**
   - Environment variables'ları kontrol edin
   - Supabase client konfigürasyonunu kontrol edin

3. **Rate limiting çok sıkı**
   - Cookie ayarlarını kontrol edin
   - Rate limit değerlerini artırın

## 📈 Performans Optimizasyonu

### Öneriler
1. **Conditional Middleware**: Sadece gerekli middleware'leri çalıştırın
2. **Caching**: Rate limit bilgilerini cache'leyin
3. **Async Operations**: Ağır işlemleri async yapın
4. **Early Returns**: Erken return'ler kullanın

### Monitoring
- Response time'ları takip edin
- Error rate'leri izleyin
- Rate limit tetiklenmelerini kontrol edin

## 🔄 Güncelleme ve Bakım

### Düzenli Kontroller
1. **Security Headers**: Güncel güvenlik başlıklarını kontrol edin
2. **Rate Limits**: Kullanım istatistiklerine göre ayarlayın
3. **Analytics**: Event tracking'i optimize edin
4. **Error Logs**: Hata loglarını düzenli kontrol edin

### Yeni Middleware Ekleme
1. Yeni middleware dosyası oluşturun
2. Ana middleware'e import edin
3. Uygun sırada çağırın
4. Test edin
5. Dokümantasyonu güncelleyin
