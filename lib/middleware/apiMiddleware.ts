import { NextRequest, NextResponse } from 'next/server';

// API rotaları için özel middleware
export async function apiMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Sadece API rotaları için çalışır
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  console.log(`🔌 API Middleware: ${request.method} ${pathname}`);
  
  // 1. CORS Headers
  const response = NextResponse.next();
  
  // CORS ayarları
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 2. OPTIONS istekleri için özel yanıt
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 });
  }
  
  // 3. API Key kontrolü (opsiyonel)
  const apiKey = request.headers.get('x-api-key');
  if (pathname.startsWith('/api/protected/') && !apiKey) {
    return new NextResponse('API Key Required', { status: 401 });
  }
  
  // 4. Request body boyut kontrolü
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return new NextResponse('Request too large', { status: 413 });
  }
  
  // 5. API Rate Limiting (daha sıkı)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitKey = `api_rate_limit_${ip}`;
  const rateLimitCookie = request.cookies.get(rateLimitKey);
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika
  const maxRequests = 30; // API için daha düşük limit
  
  if (rateLimitCookie) {
    const { count, resetTime } = JSON.parse(rateLimitCookie.value);
    
    if (now < resetTime && count >= maxRequests) {
      console.log(`🚫 API Rate limit aşıldı: ${ip}`);
      return new NextResponse('API Rate Limit Exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }
  }
  
  // Rate limit cookie'sini güncelle
  const newCount = rateLimitCookie ? JSON.parse(rateLimitCookie.value).count + 1 : 1;
  response.cookies.set(rateLimitKey, JSON.stringify({
    count: newCount,
    resetTime: now + windowMs
  }), {
    maxAge: windowMs / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
  return response;
}
