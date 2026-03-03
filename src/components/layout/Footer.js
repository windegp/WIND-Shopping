"use client";
import Link from 'next/link';
import { Instagram, Facebook, Send } from 'lucide-react'; // تأكد إنك مسطب lucide-react

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-16 pb-8 text-white font-sans relative overflow-hidden" dir="rtl">
      
      {/* تأثيرات الإضاءة الخلفية (نفس روح صفحات السياسات) */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#f5c518] opacity-[0.02] blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#f5c518] opacity-[0.02] blur-[80px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* القسم العلوي: 4 أعمدة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-right md:text-center border-b border-white/5 pb-14">
          
          {/* 1. تسوق معنا */}
          <div className="flex flex-col md:items-center">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-wider">تسوق معنا</h4>
            <ul className="space-y-4 text-[#a3a3a3] text-[0.85rem] font-semibold">
              <li><Link href="/collections/new" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">وصل حديثاً</Link></li>
              <li><Link href="/collections/best-sellers" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">الأكثر مبيعاً</Link></li>
              <li><Link href="/collections/all" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">التشكيلة الكاملة</Link></li>
            </ul>
          </div>
          
          {/* 2. المساعدة */}
          <div className="flex flex-col md:items-center md:border-r border-white/5">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-wider">المساعدة</h4>
            <ul className="space-y-4 text-[#a3a3a3] text-[0.85rem] font-semibold">
              <li><Link href="/pages/track-order" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">تتبع طلبك</Link></li>
              <li><Link href="/pages/contact" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">تواصل معنا</Link></li>
              <li><Link href="/pages/faq" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">الأسئلة الشائعة</Link></li>
            </ul>
          </div>

          {/* 3. السياسات (مربوطة بالصفحات اللي عملناها) */}
          <div className="flex flex-col md:items-center md:border-r border-white/5">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-wider">السياسات القانونية</h4>
            <ul className="space-y-4 text-[#a3a3a3] text-[0.85rem] font-semibold">
              <li><Link href="/policies/shipping" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">سياسة الشحن والتوصيل</Link></li>
              <li><Link href="/policies/refund" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">الاستبدال والاسترجاع</Link></li>
              <li><Link href="/policies/terms" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">شروط الخدمة</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">سياسة الخصوصية</Link></li>
            </ul>
          </div>

          {/* 4. عن البراند */}
          <div className="flex flex-col md:items-center md:border-r border-white/5">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-wider">عن WIND</h4>
            <ul className="space-y-4 text-[#a3a3a3] text-[0.85rem] font-semibold">
              <li><Link href="/pages/about" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">من نحن</Link></li>
              <li><Link href="/pages/quality" className="hover:text-white hover:translate-x-[-4px] transition-all inline-block">معايير الجودة</Link></li>
              <li>
                {/* بادج "إحدى شركات S" */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
                  <span className="text-[0.65rem] text-[#a3a3a3] font-bold tracking-widest uppercase">إحدى شركات</span>
                  <strong className="text-white text-sm font-black">S</strong>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* القسم الأوسط: السوشيال ميديا والتأسيس */}
        <div className="py-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5">
          
          <div className="flex items-center gap-6">
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/10 text-[#a3a3a3] hover:text-[#F5C518] hover:border-[#F5C518]/50 hover:bg-[#F5C518]/10 transition-all duration-300 transform hover:-translate-y-1">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/10 text-[#a3a3a3] hover:text-[#F5C518] hover:border-[#F5C518]/50 hover:bg-[#F5C518]/10 transition-all duration-300 transform hover:-translate-y-1">
              <Facebook size={18} />
            </a>
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/10 text-[#a3a3a3] hover:text-[#F5C518] hover:border-[#F5C518]/50 hover:bg-[#F5C518]/10 transition-all duration-300 transform hover:-translate-y-1">
              <Send size={18} /> {/* أيقونة التليجرام أو تيك توك */}
            </a>
          </div>

          <div className="text-center md:text-left">
            <span className="text-[0.75rem] text-[#666] font-bold uppercase tracking-widest">
              Est. 2019 — Cairo, Egypt
            </span>
          </div>

        </div>

        {/* القسم السفلي: اللوجو والحقوق */}
        <div className="flex flex-col items-center pt-10">
          <h2 className="text-3xl font-black tracking-tighter text-white mb-4 opacity-90 hover:opacity-100 transition-opacity">
            WIND<span className="text-[#F5C518]">.</span>
          </h2>
          
          <div className="text-center space-y-3">
            <p className="text-[#666] text-[0.7rem] font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} WIND SHOPPING. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center justify-center gap-4 opacity-40">
               <span className="text-[0.65rem] font-bold text-gray-400 tracking-wider">PREMIUM FASHION</span>
               <div className="h-1 w-1 rounded-full bg-gray-600"></div>
               <span className="text-[0.65rem] font-bold text-gray-400 tracking-wider">WINDEG.COM</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
