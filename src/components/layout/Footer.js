"use client";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-[#222] pt-20 pb-10 text-white" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* الجزء العلوي: اللوجو والوصف */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16 items-start">
          
          {/* البراند - يأخذ مساحة أكبر */}
          <div className="lg:col-span-2 flex flex-col items-start text-right">
            <img 
              src="/logo.jpg" 
              alt="WIND" 
              className="h-12 w-auto object-contain mb-6 grayscale hover:grayscale-0 transition-all duration-500" 
            />
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm">
              أزياء تعكس شخصيتك وتمنحك الثقة. نحن في WIND نهتم بأدق التفاصيل لنقدم لك تجربة تسوق فريدة تجمع بين الدفء والأناقة العصرية.
            </p>
            
            {/* روابط التواصل الاجتماعي - أيقونات نصية بسيطة */}
            <div className="flex gap-6 mt-8">
              {['Instagram', 'TikTok', 'Facebook'].map((social) => (
                <a 
                  key={social} 
                  href="#" 
                  className="text-xs font-black tracking-widest uppercase text-gray-500 hover:text-[#F5C518] transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* الأقسام - موزعة بشكل احترافي */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:col-span-3 gap-8 w-full">
            <div>
              <h4 className="font-black text-sm mb-6 text-white uppercase tracking-tighter">تسوق معنا</h4>
              <ul className="space-y-4 text-gray-500 text-sm font-bold">
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">وصل حديثاً</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">الأكثر مبيعاً</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">التشكيلة الكاملة</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-sm mb-6 text-white uppercase tracking-tighter">المساعدة</h4>
              <ul className="space-y-4 text-gray-500 text-sm font-bold">
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">تتبع الطلب</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">سياسة الاستبدال</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">الشحن والتوصيل</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm mb-6 text-white uppercase tracking-tighter">عن WIND</h4>
              <ul className="space-y-4 text-gray-500 text-sm font-bold">
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">قصتنا</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">تواصل معنا</li>
                <li className="hover:text-[#F5C518] cursor-pointer transition-colors">سياسة الخصوصية</li>
              </ul>
            </div>
          </div>
        </div>

        {/* الجزء السفلي: الحقوق وطرق الدفع */}
        <div className="border-t border-[#222] pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-right">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
              © 2026 WIND COLLECTION. ALL RIGHTS RESERVED.
            </p>
          </div>
          
          {/* أيقونة بسيطة للبراند في الأسفل */}
          <div className="flex items-center gap-4 opacity-30 grayscale hover:opacity-100 transition-opacity">
             <span className="text-[10px] font-bold text-gray-500">SECURE PAYMENT</span>
             <div className="h-4 w-px bg-gray-700"></div>
             <span className="text-[10px] font-bold text-gray-500">FAST DELIVERY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}