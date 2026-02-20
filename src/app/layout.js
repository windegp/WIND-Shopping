import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/layout/CartDrawer";
import GlobalLoader from "../components/layout/GlobalLoader"; // المسار ده هو اللي كان فيه المشكلة
import Script from 'next/script';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-cairo',
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
      <body className={`${cairo.className} bg-[#121212] text-white antialiased overflow-x-hidden`}>
        <GlobalLoader />
        
        <CartProvider>
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