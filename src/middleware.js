import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();

  // 1. السماح بمرور ملفات النظام والصور لضمان عمل شاشة "قريباً" بشكل سليم وسريع
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.includes('/api/') || 
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // 2. الباب السري: التحقق من الرابط الخاص بك (مفتاح الدخول)
  if (url.searchParams.get('vip') === 'wind2026') {
    // بمجرد استخدام الرابط، نقوم بتوجيهك للرئيسية وإعطائك تصريح (كوكيز) الدخول
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('wind_admin_access', 'granted', { path: '/', httpOnly: true });
    return response;
  }

  // 3. التحقق مما إذا كان المتصفح الحالي يمتلك تصريح الدخول (أنت)
  const hasAccess = request.cookies.get('wind_admin_access')?.value === 'granted';

  // 4. إذا لم يكن يمتلك تصريح (زائر عادي)، وهو ليس في صفحة "قريباً"، قم بتحويله إليها بصمت
  // استخدام Rewrite يجعل الرابط بالأعلى windeg.com كما هو بدون تغيير شكله للزائر
  if (!hasAccess && url.pathname !== '/coming-soon') {
    url.pathname = '/coming-soon';
    return NextResponse.rewrite(url);
  }

  // 5. السماح بالمرور وعرض الموقع بالكامل (إذا كان يمتلك التصريح)
  return NextResponse.next();
}

// تحديد المسارات التي يراقبها الميدل وير
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};