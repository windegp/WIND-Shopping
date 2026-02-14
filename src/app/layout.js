import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/layout/CartDrawer";
import NotificationHandler from "../components/NotificationHandler"; 
import Script from 'next/script';
import { Cairo } from 'next/font/google'; // استيراد الخط من جوجل

// إعداد الخط (نختار الأوزان التي تناسب ستايل IMDb القوي)
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'], // العادي، العريض، والعريض جداً للعناوين
  display: 'swap',
});

export const metadata = {
  title: 'WIND Shopping | وينـد للتسوقـ الموقع الرسمي',
  description: ' تجربة تسوق فريدة مع WIND Shopping! ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
      </head>
      {/* دمج كلاس الخط هنا ليتم تطبيقه على كل نصوص الموقع */}
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