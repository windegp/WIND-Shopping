import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // 1. استثناء شامل لكل ما هو تقني أو ملفات ثابتة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/collections') || // تم حذف السلاش الأخير للشمولية
    pathname.includes('.') || 
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png')
  ) {
    return NextResponse.next();
  }

  // 2. المسارات الثابتة
  const staticRoutes = ['/', '/cart', '/checkout', '/login', '/products'];
  if (staticRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. التحويل الذكي (Internal Rewrite)
  // تأكد من عدم وجود __dirname في أي مكان هنا
  url.pathname = `/collections${pathname}`;
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * استثناء كل الملفات الثابتة والـ API بشكل أكثر صرامة
     */
    '/((?!api|_next/static|_next/image|favicon.ico|favicon.png|logo.png|.*\\..*).*)',
  ],
};