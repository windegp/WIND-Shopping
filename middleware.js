import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. استثناء الملفات الثابتة والصور وروابط لوحة التحكم
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') // استثناء الصور والملفات مثل favicon.ico
  ) {
    return NextResponse.next();
  }

  // 2. قائمة بالمسارات الرئيسية التي لا نريد تحويلها (صفحة اتصل بنا، السلة، إلخ)
  const mainRoutes = ['/', '/cart', '/checkout', '/login', '/products'];
  if (mainRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. التحويل الذكي: 
  // أي رابط آخر، سنفترض أنه "قسم" وسنوجهه داخلياً لملف الـ slug 
  // الرابط في المتصفح سيبقى /women/winter-wear 
  // لكن الكود سيعالجه في ملف collections/[...slug]
  const url = request.nextUrl.clone();
  url.pathname = `/collections${pathname}`;
  
  return NextResponse.rewrite(url);
}

// تحديد المسارات التي يعمل عليها الميدل وير
export const config = {
  matcher: [
    /*
     * مطابقة كل المسارات ما عدا:
     * 1. api (API routes)
     * 2. _next/static (static files)
     * 3. _next/image (image optimization files)
     * 4. favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};