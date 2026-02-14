"use client";

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-[#333] pt-16 pb-8 text-white">
      <div className="max-w-[1280px] mx-auto px-4">
        
        {/* الجزء العلوي: روابط السوشيال ميديا واللوجو */}
        <div className="flex flex-col items-center mb-12 space-y-8">
          <div className="flex gap-10">
            <a href="#" className="hover:text-[#F5C518] transition duration-300 transform hover:scale-110">
              <span className="text-xl md:text-2xl font-black">Instagram</span>
            </a>
            <a href="#" className="hover:text-[#F5C518] transition duration-300 transform hover:scale-110">
              <span className="text-xl md:text-2xl font-black">TikTok</span>
            </a>
            <a href="#" className="hover:text-[#F5C518] transition duration-300 transform hover:scale-110">
              <span className="text-xl md:text-2xl font-black">X</span>
            </a>
          </div>

          {/* لوجو WIND داخل إطار احترافي يتماشى مع الهيدر */}
          <div className="flex flex-col items-center">
            <div className="border border-[#F5C518]/30 p-2 rounded-lg bg-[#1a1a1a] shadow-2xl flex items-center justify-center">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-10 md:h-14 w-auto object-contain" 
              />
            </div>
          </div>
        </div>

        {/* الشبكة الرئيسية للروابط */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-right" dir="rtl">
          <div>
            <h4 className="font-black text-lg mb-4 text-[#F5C518]">تسوق معنا</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-bold">
              <li className="hover:text-[#F5C518] cursor-pointer transition">وصل حديثاً</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">الأكثر مبيعاً</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">مجموعة الشتاء</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-lg mb-4 text-[#F5C518]">المساعدة</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-bold">
              <li className="hover:text-[#F5C518] cursor-pointer transition">تتبع الطلب</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">الاسترجاع والاستبدال</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">الشحن والتوصيل</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-lg mb-4 text-[#F5C518]">عن WIND</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-bold">
              <li className="hover:text-[#F5C518] cursor-pointer transition">قصتنا</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">الجودة والاستدامة</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">تواصل معنا</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-lg mb-4 text-[#F5C518]">قانوني</h4>
            <ul className="space-y-2 text-gray-400 text-sm font-bold">
              <li className="hover:text-[#F5C518] cursor-pointer transition">سياسة الخصوصية</li>
              <li className="hover:text-[#F5C518] cursor-pointer transition">شروط الخدمة</li>
            </ul>
          </div>
        </div>

        {/* الجزء السفلي: الحقوق */}
        <div className="border-t border-[#333] pt-8 text-center">
          <p className="text-gray-500 text-xs font-bold tracking-widest">
            © 2026 WIND Shopping | جميع الحقوق محفوظة
          </p>
          <p className="text-[#F5C518] text-[10px] mt-2 font-black uppercase tracking-[0.3em]">
            powered by WIND Technology
          </p>
        </div>
      </div>
    </footer>
  );
}