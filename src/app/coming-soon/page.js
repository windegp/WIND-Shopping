export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white px-4 text-center selection:bg-[#F5C518] selection:text-black">
      
      {/* اسم البراند */}
      <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-[0.3em] text-white">
        W I N D
      </h1>

      {/* فاصل ذهبي أنيق */}
      <div className="w-16 h-1 bg-[#F5C518] rounded-full mb-8 shadow-[0_0_15px_rgba(245,197,24,0.4)]"></div>

      {/* رسالة راقية باللغة العربية */}
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-200" style={{fontFamily: "Cairo, sans-serif"}}>
        نعمل على صياغة تجربة تسوق استثنائية
      </h2>
      <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed" style={{fontFamily: "Tajawal, sans-serif"}}>
        نضع اللمسات الأخيرة على متجرنا الجديد لنلبي تطلعاتكم.
        <br />
        انتظرونا قريباً جداً بإطلالة تليق بكم.
      </p>

      {/* مؤشر نبض خفيف وراقي بدلاً من الأنيميشن المزعج */}
      <div className="mt-12 flex items-center gap-2 text-[#F5C518] text-xs font-bold tracking-widest" style={{fontFamily: "Cairo, sans-serif"}}>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5C518] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F5C518]"></span>
        </span>
        قريباً
      </div>

    </div>
  );
}