import "./globals.css"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/layout/CartDrawer";
import NotificationHandler from "../components/NotificationHandler"; 
import Script from 'next/script'; // استيراد Script للتعامل مع المكتبات الخارجية

export const metadata = {
  title: 'Wind | متجر ويند الرسمي',
  description: 'أناقة تعكس جوهر الدفء',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* تحميل مكتبة OneSignal الرسمية */}
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
      </head>
      <body className="bg-[#121212] text-white antialiased">
        <CartProvider>
          {/* هذا المكون سيهتم بتفعيل المكتبة وطلب الإذن من العميل */}
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