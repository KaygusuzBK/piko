import { NextRequest, NextResponse } from 'next/server';

// Güvenlik middleware'i
export async function securityMiddleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // 1. Bot Detection
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  if (isBot) {
    console.log(`🤖 Bot detected: ${userAgent}`);
    // Bot'lar için özel yanıt verebilirsiniz
  }
  
  // 2. SQL Injection Koruması
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /or\s+1=1/i,
    /and\s+1=1/i
  ];
  
  const fullUrl = request.url;
  const hasSqlInjection = sqlPatterns.some(pattern => pattern.test(fullUrl));
  
  if (hasSqlInjection) {
    console.log(`🚨 SQL Injection attempt detected: ${fullUrl}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 3. XSS Koruması
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i
  ];
  
  const hasXSS = xssPatterns.some(pattern => pattern.test(fullUrl));
  
  if (hasXSS) {
    console.log(`🚨 XSS attempt detected: ${fullUrl}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 4. Path Traversal Koruması
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i
  ];
  
  const hasPathTraversal = pathTraversalPatterns.some(pattern => pattern.test(pathname));
  
  if (hasPathTraversal) {
    console.log(`🚨 Path Traversal attempt detected: ${pathname}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 5. Suspicious Query Parameters
  const suspiciousParams = ['cmd', 'exec', 'eval', 'system', 'shell'];
  const hasSuspiciousParams = suspiciousParams.some(param => 
    searchParams.has(param) || searchParams.toString().toLowerCase().includes(param)
  );
  
  if (hasSuspiciousParams) {
    console.log(`🚨 Suspicious parameters detected: ${searchParams.toString()}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 6. Security Headers
  const response = NextResponse.next();
  
  // Güvenlik başlıkları ekle
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP (Content Security Policy) - geliştirme ortamında daha esnek
  const csp = process.env.NODE_ENV === 'production' 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}
