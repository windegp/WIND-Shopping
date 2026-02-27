"use client";
import Link from 'next/link';

export default function Footer() {
  return (
    /* bg-[#121212] → bg-white ، border-[#222] → border-gray-200 ، text-white → text-gray-900 */
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 text-gray-900" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* القسم العلوي: 4 أعمدة — border-[#222] → border-gray-200 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center border-b border-gray-200 pb-12">
          
          {/* 1. تسوق معنا — لم يتغير المحتوى */}
          <div className="flex flex-col items-center">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">تسوق معنا</h4>
            {/* text-gray-400 → text-gray-500 ، hover:text-white → hover:text-gray-900 */}
            <ul className="space-y-4 text-gray-500 text-[13px] font-bold">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">وصل حديثاً</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">الأكثر مبيعاً</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">التشكيلة الكاملة</li>
            </ul>
          </div>
          
          {/* 2. المساعدة — border-[#222] → border-gray-200 */}
          <div className="flex flex-col items-center border-r-0 md:border-r border-gray-200">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">المساعدة</h4>
            <ul className="space-y-4 text-gray-500 text-[13px] font-bold">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">تتبع الطلب</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">تواصل معنا</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">الأسئلة الشائعة</li>
            </ul>
          </div>

          {/* 3. السياسات — border-[#222] → border-gray-200 */}
          <div className="flex flex-col items-center border-r-0 md:border-r border-gray-200">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">السياسات</h4>
            <ul className="space-y-4 text-gray-500 text-[13px] font-bold">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">الشحن والتوصيل</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">الاسترجاع والاستبدال</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">شروط الخدمة</li>
            </ul>
          </div>

          {/* 4. عن البراند — border-[#222] → border-gray-200 */}
          <div className="flex flex-col items-center border-r-0 md:border-r border-gray-200">
            <h4 className="font-black text-sm mb-6 text-[#F5C518] uppercase tracking-tighter">عن البراند</h4>
            <ul className="space-y-4 text-gray-500 text-[13px] font-bold">
              <li className="hover:text-gray-900 cursor-pointer transition-colors">قصتنا</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">سياسة الخصوصية</li>
              <li className="hover:text-gray-900 cursor-pointer transition-colors">الجودة</li>
            </ul>
          </div>
        </div>

        {/* السوشيال ميديا — text-gray-500 يفضل ، hover:text-[#F5C518] يفضل */}
        <div className="py-10 flex justify-center items-center gap-8 md:gap-16">
          {['Instagram', 'TikTok', 'Facebook'].map((social) => (
            <a 
              key={social} 
              href="#" 
              className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-400 hover:text-[#F5C518] transition-all duration-300 transform hover:-translate-y-1"
            >
              {social}
            </a>
          ))}
        </div>

        {/* اللوجو والحقوق — لم يتغير شيء هنا */}
        <div className="flex flex-col items-center pt-6 border-t border-gray-100">
          <img 
            src="/logo.jpg" 
            alt="WIND" 
            className="h-20 md:h-24 w-auto object-contain mb-6 opacity-90 hover:opacity-100 transition-opacity duration-500" 
          />
          
          <div className="text-center space-y-2">
            {/* text-gray-600 → text-gray-400 */}
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
              ALL RIGHTS RESERVED 2026 © WIND SHOPPING
            </p>
            {/* opacity-20 يفضل ، text-gray-500 → text-gray-400 ، bg-gray-700 → bg-gray-300 */}
            <div className="flex items-center justify-center gap-4 opacity-40">
               <span className="text-[9px] font-bold text-gray-400">PREMIUM CLOTHING</span>
               <div className="h-2 w-px bg-gray-300"></div>
               <span className="text-[9px] font-bold text-gray-400">CAIRO, EGYPT</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}