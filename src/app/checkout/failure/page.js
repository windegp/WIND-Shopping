"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function FailurePage() {
  const params = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-6" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'); * { font-family: 'Cairo', sans-serif; }`}</style>
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">لم تكتمل عملية الدفع</h1>
        <p className="text-gray-500 text-sm mb-6">يمكنك المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة.</p>
        {orderId && <p className="text-xs text-gray-400 mb-4">رقم الطلب: {orderId}</p>}
        <div className="flex flex-col gap-3">
          <Link href="/checkout" className="bg-[#1773B0] text-white py-3 px-8 rounded-xl font-bold hover:bg-[#125d8f] transition">
            حاول مرة أخرى
          </Link>
          <Link href="/" className="border border-gray-200 text-gray-600 py-3 px-8 rounded-xl font-medium hover:bg-gray-50 transition">
            العودة للمتجر
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## ملخص المسارات
```
your-project/
├── .env.local                              ← ملف ١ (حط Keys الجديدة هنا)
└── app/
    ├── api/
    │   ├── create-order/
    │   │   └── route.js                    ← ملف ٢
    │   └── kashier-webhook/
    │       └── route.js                    ← ملف ٣
    └── checkout/
        ├── success/
        │   └── page.js                     ← ملف ٤ (أول جزء)
        └── failure/
            └── page.js                     ← ملف ٤ (تاني جزء)