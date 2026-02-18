"use client";
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const { clearCart } = useCart();

  const orderId = params.get('orderId');
  const status = params.get('paymentStatus');
  const transactionId = params.get('transactionId');

  useEffect(() => {
    if (status === 'SUCCESS') clearCart();
  }, [status]);

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">تم الدفع بنجاح!</h1>
      <p className="text-gray-500 text-sm mb-4">شكراً لثقتك بنا 🎉</p>
      {orderId && <p className="text-xs text-gray-400 mb-1">رقم الطلب: <span className="font-mono font-bold">{orderId}</span></p>}
      {transactionId && <p className="text-xs text-gray-400 mb-6">رقم العملية: <span className="font-mono font-bold">{transactionId}</span></p>}
      <Link href="/" className="block bg-[#1773B0] text-white py-3 px-8 rounded-xl font-bold hover:bg-[#125d8f] transition">
        العودة للمتجر
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-6" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'); * { font-family: 'Cairo', sans-serif; }`}</style>
      <Suspense fallback={<div className="text-gray-400 animate-pulse">جارٍ التحميل...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}