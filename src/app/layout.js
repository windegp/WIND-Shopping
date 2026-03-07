import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import { GlobalLoaderProvider } from "../context/GlobalLoaderContext";
import CartDrawer from "../components/layout/CartDrawer";
import GlobalLoader from "../components/GlobalLoader";
import Script from 'next/script';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata = {
  title: 'WIND Shopping | الأناقة والدفء في مكان واحد',
  description: 'اكتشف مجموعات WIND Shopping الفريدة من الشيلان والملابس الراقية المصممة بعناية.',
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
      <body className={`${cairo.className} bg-[#121212] text-white antialiased overflow-x-hidden`}>
        {/* [تعديل جراحي] حاجز SSR الأسود الصلب: يغطي الشاشة في اللحظة صفر لمنع ظهور النافبار */}
        <div id="ssr-preloader" className="fixed inset-0 z-[10000] bg-[#121212]"></div>
        
        <GlobalLoaderProvider>
          {/* شاشة التحميل (اللوجو) */}
          <GlobalLoader />
          
          <CartProvider>
            <Navbar />
            <CartDrawer /> 

            <main className="min-h-screen">
              {children}
            </main>

            <Footer />
          </CartProvider>
        </GlobalLoaderProvider>
      </body>
    </html>
  );
}