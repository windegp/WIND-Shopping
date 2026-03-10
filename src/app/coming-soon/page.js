export default function ComingSoon() {
  return (
    // استخدام fixed و z-[999999] لابتلاع الشاشة بالكامل وإخفاء الهيدر والفوتر
    <div className="fixed inset-0 z-[999999] bg-[#121212] flex flex-col items-center justify-center text-white text-center selection:bg-[#F5C518] selection:text-black">
      
      <div className="flex flex-col items-center transform -translate-y-10">
        {/* اسم WIND */}
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-[0.4em] text-white">
          WIND
        </h1>

        {/* الكلمة الأساسية بلون ذهبي فخم */}
        <h2 className="text-xl md:text-2xl font-black mb-3 text-[#F5C518] tracking-wider" style={{fontFamily: "Cairo, sans-serif"}}>
          قريباً
        </h2>

        {/* جملة واحدة فقط مختصرة واحترافية */}
        <p className="text-gray-400 text-sm md:text-base tracking-wide" style={{fontFamily: "Tajawal, sans-serif"}}>
          نستعد لإطلاق تجربة تسوق جديدة.
        </p>
      </div>

    </div>
  );
}