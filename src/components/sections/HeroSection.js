"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function HeroSection() {
  const slides = [
    {
      image: "/images/banners/1.webp",
      tag: "وصل حديثاً",
      title: "مجموعة الشتاء",
      desc: "تصاميم كلاسيكية بلمسة عصرية",
      thumbnail: "/images/posters/1.webp",
      productLink: "#"
    },
    {
      image: "/images/banners/2.webp",
      tag: "الأكثر طلباً",
      title: "شيلان فاخرة",
      desc: "دفء وأناقة لكل المناسبات",
      thumbnail: "/images/posters/2.webp",
      productLink: "#"
    }
  ];

  const categories = [
    { title: "تشكيلة العيد", link: "#" },
    { title: "أفضل المبيعات", link: "#" },
    { title: "العروض الحصرية", link: "#" },
    { title: "الملابس الشتوية", link: "#" },
    { title: "أحدث الإصدارات", link: "#" }
  ];

  const [current, setCurrent] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#121212] font-sans" dir="rtl">
      <style jsx>{`
        @keyframes kenBurnsZoomOut {
          from { transform: scale(1.15); }
          to { transform: scale(1); }
        }
        .zoom-animation {
          animation: kenBurnsZoomOut 6s ease-out forwards;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* حاوية الهيرو الرئيسية (أعطيناها z-20 لتكون أعلى من الأقسام المجاورة) */}
      <div className="relative w-full aspect-[3/4] md:aspect-[21/9] z-20">
        
        {/* خلفية الصور والأنيميشن */}
        <div className="absolute inset-0 overflow-hidden">
            {slides.map((slide, index) => (
            <div 
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
                <img 
                src={slide.image} 
                alt={slide.title}
                className={`w-full h-full object-cover ${index === current ? 'zoom-animation' : ''}`} 
                />
                {/* تدرج لوني كثيف */}
                <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
            </div>
            ))}
        </div>

        {/* المحتوى النصي والبوستر:
          استخدمنا items-start لتكون بدايتهم من الأعلى متساوية مسطرة.
          واستخدمنا gap-4 للفصل بينهم، والبوستر موضوع أولاً ليظهر على اليمين.
        */}
        <div className="absolute bottom-4 left-0 right-0 px-5 flex items-start gap-5">
          
          {/* 1. البوستر المصغر (على اليمين) */}
          {/* بفضل محاذاة items-start سيكون رأسه مع رأس النص، وبما أنه أطول سيتجاوز للأسفل تلقائياً */}
          <div className="w-28 md:w-36 flex-shrink-0 rounded-md overflow-hidden border border-white/20 shadow-2xl relative z-40 transition-transform hover:scale-105">
            <a href={slides[current].productLink} className="block w-full h-full">
              <img 
                src={slides[current].thumbnail} 
                alt="Product Thumbnail" 
                className="w-full aspect-[2/3] object-cover"
              />
            </a>
            {/* أيقونة الزائد الوهمية أعلى البوستر */}
            <div className="absolute top-1 right-2 text-white text-2xl font-light leading-none drop-shadow-lg opacity-80">+</div>
          </div>

          {/* 2. النص (على اليسار) */}
          <div className="text-right flex-1 pt-0">
            <span className="bg-[#F5C518] text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm mb-2 inline-block">
              {slides[current].tag}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-md">
              {slides[current].title}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 max-w-[85%] drop-shadow-sm">
              {slides[current].desc}
            </p>
            
            <a href={slides[current].productLink} className="bg-[#2C2C2C] hover:bg-white hover:text-black text-white text-xs md:text-sm font-bold py-2.5 px-6 rounded border border-gray-600 transition-all inline-block">
              تصفح المنتج
            </a>
          </div>

        </div>

        {/* نقاط التنقل الخاصة بالهيرو */}
        <div className="absolute top-4 left-4 flex gap-1.5 z-30">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#F5C518]' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* قسم تصفح الأقسام المحاط بالخطوط الرمادية (z-10 ليكون أسفل البوستر المتداخل) */}
      <div className="w-full bg-[#121212] pt-8 pb-6 relative z-10 pl-0 pr-5">
        
        {/* عنوان القسم */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white text-lg md:text-xl font-bold">تصفح الأقسام</h2>
          <span className="text-white text-xl mb-1 font-bold">›</span>
        </div>
        
        {/* حاوية سحب الأقسام مع الخطوط الرمادية (فوق وتحت) */}
        <div className="relative w-full border-t border-b border-gray-700/80 py-4 flex items-center">
          
          {/* شريط السحب */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto hide-scrollbar w-full items-center"
          >
            {categories.map((category, idx) => (
              <a 
                key={idx} 
                href={category.link} 
                className="whitespace-nowrap flex items-center gap-1.5 bg-transparent border border-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/10 hover:border-gray-400 transition-colors"
              >
                {category.title}
                {/* السهم الصغير بجانب اسم القسم نفسه */}
                <span className="text-gray-400 text-lg leading-none font-bold mt-0.5">›</span>
              </a>
            ))}
            {/* مسافة فارغة في نهاية السحب */}
            <div className="w-16 flex-shrink-0"></div>
          </div>

          {/* التدرج الأسود والسهم فقط (بدون الخط الطولي المزعج) */}
          <div 
            className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-[#121212] via-[#121212]/90 to-transparent flex items-center justify-start pointer-events-none z-20"
          >
            <button 
                onClick={scrollLeft}
                className="pointer-events-auto ml-2 p-2 text-white hover:text-[#F5C518] transition-colors"
                aria-label="تمرير للمزيد"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}