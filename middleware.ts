import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { securityMiddleware } from './lib/middleware/securityMiddleware';
import { analyticsMiddleware } from './lib/middleware/analyticsMiddleware';
import { apiMiddleware } from './lib/middleware/apiMiddleware';

// Middleware'in çalışacağı rotaları tanımla
export const config = {
  matcher: [
    /*
     * Aşağıdaki rotalar hariç tüm rotaları dahil et:
     * - api routes (API rotaları)
     * - _next/static (static dosyalar)
     * - _next/image (image optimization dosyaları)
     * - favicon.ico (favicon dosyası)
     * - public klasöründeki dosyalar
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔍 Middleware çalışıyor: ${pathname}`);
  
  // 1. Güvenlik Kontrolü (en önce çalışmalı)
  const securityResponse = await securityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }
  
  // 2. API Middleware (API rotaları için)
  if (pathname.startsWith('/api/')) {
    const apiResponse = await apiMiddleware(request);
    if (apiResponse) {
      return apiResponse;
    }
  }
  
  // 3. Analytics ve Monitoring
  const analyticsResponse = await analyticsMiddleware(request);
  if (analyticsResponse) {
    return analyticsResponse;
  }
  
  // 4. İstek Loglama
  await logRequest(request);
  
  // 5. Kimlik Doğrulama Kontrolü
  const authResponse = await checkAuthentication(request);
  if (authResponse) {
    return authResponse;
  }
  
  // 6. Rate Limiting Kontrolü
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // 7. Yönlendirme Kontrolü
  const redirectResponse = await checkRedirects(request);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  // Tüm kontrollerden geçtiyse devam et
  return NextResponse.next();
}

// İstek loglama fonksiyonu
async function logRequest(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
  
  console.log(`📝 ${method} ${pathname} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // Query parametrelerini logla
  if (searchParams.toString()) {
    console.log(`🔍 Query params: ${searchParams.toString()}`);
  }
}

// Kimlik doğrulama kontrolü
async function checkAuthentication(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Korumalı rotalar (giriş yapmış kullanıcılar için)
  const protectedRoutes = ['/favorites', '/notifications', '/users/edit'];
  
  // Giriş yapmış kullanıcılar için yasak rotalar
  const authRoutes = ['/login'];
  
  // Supabase client oluştur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );
  
  try {
    // Kullanıcı oturumunu kontrol et
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Korumalı rotalar için kimlik doğrulama kontrolü
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!user || error) {
        console.log(`🚫 Yetkisiz erişim: ${pathname}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // Giriş yapmış kullanıcılar için auth rotalarını yasakla
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (user && !error) {
        console.log(`🔄 Giriş yapmış kullanıcı yönlendiriliyor: ${pathname}`);
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
  } catch (error) {
    console.error('❌ Auth kontrolü hatası:', error);
  }
  
  return null;
}

// Rate limiting kontrolü
async function checkRateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const pathname = request.nextUrl.pathname;
  
  // Basit rate limiting için cookie kullan
  const rateLimitKey = `rate_limit_${ip}`;
  const rateLimitCookie = request.cookies.get(rateLimitKey);
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika
  const maxRequests = 100; // Dakikada maksimum 100 istek
  
  if (rateLimitCookie) {
    const { count, resetTime } = JSON.parse(rateLimitCookie.value);
    
    if (now < resetTime) {
      if (count >= maxRequests) {
        console.log(`🚫 Rate limit aşıldı: ${ip} - ${pathname}`);
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }
  
  // Rate limit bilgisini response'a ekle
  const response = NextResponse.next();
  const newCount = rateLimitCookie ? JSON.parse(rateLimitCookie.value).count + 1 : 1;
  
  response.cookies.set(rateLimitKey, JSON.stringify({
    count: newCount,
    resetTime: now + windowMs
  }), {
    maxAge: windowMs / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
  return null;
}

// Yönlendirme kontrolü
async function checkRedirects(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Eski URL'leri yeni URL'lere yönlendir
  const redirects: Record<string, string> = {
    '/home': '/',
    '/dashboard': '/',
    '/profile': '/users',
  };
  
  if (redirects[pathname]) {
    console.log(`🔄 Yönlendirme: ${pathname} -> ${redirects[pathname]}`);
    return NextResponse.redirect(new URL(redirects[pathname], request.url));
  }
  
  // Trailing slash kontrolü
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const newPathname = pathname.slice(0, -1);
    console.log(`🔄 Trailing slash kaldırılıyor: ${pathname} -> ${newPathname}`);
    return NextResponse.redirect(new URL(newPathname, request.url));
  }
  
  return null;
}
