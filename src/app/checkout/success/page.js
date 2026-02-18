"use client";

import { useEffect, Suspense } from 'react';
import { useCart } from "../../context/CartContext";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId'); // كاشير بيرجع برقم الطلب في الرابط

  useEffect(() => {
    // 1. استرجاع بيانات الطلب المخزنة مؤقتاً
    const pendingOrder = localStorage.getItem('pendingOrder');
    
    if (pendingOrder) {
      const orderData = JSON.parse(pendingOrder);

      // 2. إرسال طلب للـ API لإرسال الإيميل وتنبيه OneSignal
      fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          paymentMethod: 'card_success', // علامة عشان الـ API يعرف إن الدفع نجح
        }),
      })
      .then(() => {
        // 3. تنظيف البيانات بعد نجاح الإرسال
        clearCart();
        localStorage.removeItem('pendingOrder');
      })
      .catch(err => console.error("Error sending notification:", err));
    }
  }, []);

  return (
    <div className="bg-[#1A1A1A] rounded-3xl border border-[#333] p-12 max-w-md w-full shadow-2xl text-center">
      <div className="w-20 h-20 bg-[#F5C518]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={44} className="text-[#F5C518]" />
      </div>
      
      <h1 className="text-3xl font-black text-white mb-3">شكراً لشرائك!</h1>
      <p className="text-gray-400 mb-2 leading-relaxed">تم استلام طلبك بنجاح وجاري تجهيز قطع الملابس الخاصة بك.</p>
      {orderId && (
        <p className="text-[#F5C518] text-xs font-mono mt-2 mb-8 uppercase tracking-widest">
          رقم العملية: {orderId}
        </p>
      )}

      <div className="space-y-4 mt-8">
        <Link href="/" className="flex items-center justify-center gap-2 bg-[#F5C518] text-black px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg">
          <ShoppingBag size={18} /> العودة للتسوق
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap'); * { font-family: 'Cairo', sans-serif; }`}</style>
      
      <Suspense fallback={<div className="text-[#F5C518] animate-pulse font-black">جاري تأكيد الطلب...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}