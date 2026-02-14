"use client";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-[#222] pt-16 pb-8 text-white" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* القسم العلوي: الأقسام الثلاثة جنبًا إلى جنب */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center border-b border-[#222] pb-12">
          
          {/* تسوق معنا */}
          <div className="flex flex-col items-center">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">تسوق معنا</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-bold">
              <li className="hover:text-white cursor-pointer transition-colors">وصل حديثاً</li>
              <li className="hover:text-white cursor-pointer transition-colors">الأكثر مبيعاً</li>
              <li className="hover:text-white cursor-pointer transition-colors">التشكيلة الكاملة</li>
            </ul>
          </div>
          
          {/* المساعدة */}
          <div className="flex flex-col items-center border-x-0 md:border-x border-[#222] px-4">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">المساعدة</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-bold">
              <li className="hover:text-white cursor-pointer transition-colors">تتبع الطلب</li>
              <li className="hover:text-white cursor-pointer transition-colors">سياسة الاستبدال</li>
              <li className="hover:text-white cursor-pointer transition-colors">الشحن والتوصيل</li>
            </ul>
          </div>

          {/* عن WIND */}
          <div className="flex flex-col items-center">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">عن WIND</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-bold">
              <li className="hover:text-white cursor-pointer transition-colors">قصتنا</li>
              <li className="hover:text-white cursor-pointer transition-colors">تواصل معنا</li>
              <li className="hover:text-white cursor-pointer transition-colors">سياسة الخصوصية</li>
            </ul>
          </div>
        </div>

        {/* القسم الأوسط: السوشيال ميديا بتنسيق متناسق */}
        <div className="py-10 flex justify-center items-center gap-12">
          {['Instagram', 'TikTok', 'Facebook'].map((social) => (
            <a 
              key={social} 
              href="#" 
              className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-500 hover:text-[#F5C518] transition-all duration-300 transform hover:-translate-y-1"
            >
              {social}
            </a>
          ))}
        </div>

        {/* القسم السفلي: اللوجو والحقوق */}
        <div className="flex flex-col items-center pt-6">
          {/* اللوجو بحجم أكبر وبدون إطار فوق الحقوق مباشرة */}
          <img 
            src="/logo.jpg" 
            alt="WIND" 
            className="h-16 md:h-20 w-auto object-contain mb-6 opacity-80 hover:opacity-100 transition-opacity duration-500" 
          />
          
          <div className="text-center space-y-2">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
              ALL RIGHTS RESERVED 2026 © WIND Shopping
            </p>
            <div className="flex items-center justify-center gap-4 opacity-20">
               <span className="text-[9px] font-bold text-gray-500 italic">PREMIUM QUALITY</span>
               <div className="h-2 w-px bg-gray-700"></div>
               <span className="text-[9px] font-bold text-gray-500 italic">EST. 2019</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}