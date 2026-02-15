import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // 1. استثناء الملفات التقنية والملفات ذات الامتدادات (صور، ملفات)
  // واستثناء صفحة الأقسام الأصلية لمنع التكرار اللانهائي (Infinite Loop)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/collections/') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. المسارات الثابتة التي يجب ألا تُحول (الصفحة الرئيسية وغيرها)
  const staticRoutes = ['/', '/cart', '/checkout', '/login', '/products'];
  if (staticRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. التحويل الذكي (Internal Rewrite)
  // هنا نقوم بإضافة /collections قبل المسار داخلياً فقط
  url.pathname = `/collections${pathname}`;
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * استثناء المسارات التي تبدأ بـ:
     * api, _next/static, _next/image, favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};