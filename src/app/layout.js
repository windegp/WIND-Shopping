import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/layout/CartDrawer";
// تم حذف سطر الـ NotificationHandler من هنا
import { Cairo } from 'next/font/google';

// 1. إعداد الخط (محفوظ كما هو تماماً لضمان الشكل)
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-cairo', 
});

// استيراد المكون الجديد
import GlobalLoader from "./components/GlobalLoader"; 

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-cairo bg-[#121212]">
        {/* شاشة التحميل العامة */}
        <GlobalLoader />
        
        {/* باقي محتويات الموقع (الناف بار، الصفحات، الفوتر) */}
        {children}
      </body>
    </html>
  );
}

// البيانات الوصفية (محفوظة كما هي للـ SEO)
export const metadata = {
  title: 'WIND | الأناقة والدفء في مكان واحد',
  description: 'اكتشف مجموعات WIND الفريدة من الشيلان والملابس الراقية المصممة بعناية.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}> 
      <head>
        {/* تم حذف سكريبت OneSignal لإنهاء تعارضه مع الدومين اللايف */}
      </head>
      
      <body className={`${cairo.className} bg-[#121212] text-white antialiased`}>
        <CartProvider>
          {/* تم حذف NotificationHandler لتعطيل الإشعارات التي تسبب أخطاء */}
          <Navbar />
          <CartDrawer /> 

          <main className="min-h-screen">
            {children}
          </main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}