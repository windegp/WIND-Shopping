import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/layout/CartDrawer";
import NotificationHandler from "../components/NotificationHandler"; 
import Script from 'next/script';
import { Cairo } from 'next/font/google';

// 1. إعداد الخط مع إضافة خاصية variable لربطه بـ Tailwind
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-cairo', // تعريف المتغير هنا
});

export const metadata = {
  title: 'WIND | الأناقة والدفء في مكان واحد',
  description: 'اكتشف مجموعات WIND الفريدة من الشيلان والملابس الراقية المصممة بعناية.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}> 
      <head>
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
      </head>
      {/* 2. دمج المتغير والكلاس في الـ body لضمان سيطرة الخط على الموقع بالكامل */}
      <body className={`${cairo.className} bg-[#121212] text-white antialiased`}>
        <CartProvider>
          <NotificationHandler />
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