import { NextRequest, NextResponse } from 'next/server';

// Analytics ve monitoring middleware'i
export async function analyticsMiddleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const startTime = Date.now();
  
  // 1. Sayfa görüntüleme analizi
  const pageView = {
    path: pathname,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    method: request.method,
    query: searchParams.toString()
  };
  
  console.log(`📊 Page View:`, pageView);
  
  // 2. Performance monitoring
  const response = NextResponse.next();
  
  // Response time'ı hesapla ve header'a ekle
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // 3. Custom analytics events
  const analyticsEvents = [];
  
  // Özel sayfa kategorileri
  if (pathname.startsWith('/posts/')) {
    analyticsEvents.push({
      event: 'post_view',
      postId: pathname.split('/')[2],
      timestamp: new Date().toISOString()
    });
  }
  
  if (pathname.startsWith('/users/')) {
    analyticsEvents.push({
      event: 'profile_view',
      userId: pathname.split('/')[2],
      timestamp: new Date().toISOString()
    });
  }
  
  if (pathname === '/login') {
    analyticsEvents.push({
      event: 'login_page_view',
      timestamp: new Date().toISOString()
    });
  }
  
  // Analytics events'leri logla
  analyticsEvents.forEach(event => {
    console.log(`📈 Analytics Event:`, event);
  });
  
  // 4. Error tracking için try-catch wrapper
  try {
    // Middleware işlemleri burada yapılır
    return response;
  } catch (error) {
    console.error(`❌ Middleware Error:`, {
      error: error instanceof Error ? error.message : String(error),
      path: pathname,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Error'u analytics'e gönder
    const errorEvent = {
      event: 'middleware_error',
      error: error instanceof Error ? error.message : String(error),
      path: pathname,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Error Event:`, errorEvent);
    
    // Hata durumunda bile response döndür
    return response;
  }
}

// Utility fonksiyonlar
export function trackUserAction(action: string, data: Record<string, unknown> = {}) {
  const event = {
    event: 'user_action',
    action,
    data,
    timestamp: new Date().toISOString()
  };
  
  console.log(`👤 User Action:`, event);
  
  // Burada gerçek analytics servisine gönderebilirsiniz
  // Örnek: Google Analytics, Mixpanel, Amplitude vb.
}

export function trackPerformance(metric: string, value: number, unit: string = 'ms') {
  const event = {
    event: 'performance_metric',
    metric,
    value,
    unit,
    timestamp: new Date().toISOString()
  };
  
  console.log(`⚡ Performance:`, event);
}
