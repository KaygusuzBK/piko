// Middleware test dosyası
// Bu dosya middleware'lerinizi test etmek için kullanılabilir

import { NextRequest } from 'next/server';

// Test fonksiyonları
export function createTestRequest(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {}
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });
  
  // Cookie'leri ekle
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });
  
  return request;
}

// Test senaryoları
export const testScenarios = {
  // Normal istek
  normalRequest: () => createTestRequest('https://example.com/'),
  
  // Korumalı sayfa isteği
  protectedRequest: () => createTestRequest('https://example.com/favorites'),
  
  // Login sayfası isteği
  loginRequest: () => createTestRequest('https://example.com/login'),
  
  // API isteği
  apiRequest: () => createTestRequest('https://example.com/api/posts'),
  
  // SQL Injection denemesi
  sqlInjectionRequest: () => createTestRequest('https://example.com/?id=1; DROP TABLE users;'),
  
  // XSS denemesi
  xssRequest: () => createTestRequest('https://example.com/?search=<script>alert("xss")</script>'),
  
  // Bot isteği
  botRequest: () => createTestRequest('https://example.com/', 'GET', {
    'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'
  }),
  
  // Rate limit testi için çok sayıda istek
  rateLimitRequests: () => Array.from({ length: 10 }, () => 
    createTestRequest('https://example.com/')
  ),
  
  // Giriş yapmış kullanıcı isteği
  authenticatedRequest: () => createTestRequest('https://example.com/', 'GET', {}, {
    'sb-access-token': 'fake-token',
    'sb-refresh-token': 'fake-refresh-token'
  })
};

// Test runner
export async function runMiddlewareTests() {
  console.log('🧪 Middleware testleri başlatılıyor...\n');
  
  const tests = [
    {
      name: 'Normal İstek',
      request: testScenarios.normalRequest(),
      expected: 'success'
    },
    {
      name: 'Korumalı Sayfa (Giriş Yapmamış)',
      request: testScenarios.protectedRequest(),
      expected: 'redirect_to_login'
    },
    {
      name: 'SQL Injection Denemesi',
      request: testScenarios.sqlInjectionRequest(),
      expected: 'blocked'
    },
    {
      name: 'XSS Denemesi',
      request: testScenarios.xssRequest(),
      expected: 'blocked'
    },
    {
      name: 'Bot İsteği',
      request: testScenarios.botRequest(),
      expected: 'detected'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`🔗 URL: ${test.request.url}`);
    console.log(`📝 Method: ${test.request.method}`);
    console.log(`🎯 Beklenen: ${test.expected}`);
    
    // Burada gerçek middleware fonksiyonunuzu çağırabilirsiniz
    // const result = await middleware(test.request);
    // console.log(`✅ Sonuç: ${result.status}`);
  }
  
  console.log('\n✅ Tüm testler tamamlandı!');
}

// Manuel test için yardımcı fonksiyonlar
export function logRequestDetails(request: NextRequest) {
  console.log('📊 İstek Detayları:');
  console.log(`  URL: ${request.url}`);
  console.log(`  Method: ${request.method}`);
  console.log(`  Pathname: ${request.nextUrl.pathname}`);
  console.log(`  Search Params: ${request.nextUrl.searchParams.toString()}`);
  console.log(`  User Agent: ${request.headers.get('user-agent')}`);
  console.log(`  IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`);
  console.log(`  Cookies: ${JSON.stringify(Object.fromEntries(request.cookies))}`);
}

// Development ortamında test çalıştırma
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development ortamında middleware testleri hazır!');
  console.log('Test çalıştırmak için: runMiddlewareTests()');
}
