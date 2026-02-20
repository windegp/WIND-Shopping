"use client";
import React, { useState, useEffect } from 'react';

export default function HeroSection() {
  const slides = [
    {
      image: "/images/banners/1.webp",
      tag: "وصل حديثاً",
      title: "مجموعة الشتاء",
      desc: "تصاميم كلاسيكية بلمسة عصرية",
      thumbnail: "/images/posters/1.webp", // إضافة الصورة المصغرة
      productLink: "#" // إضافة رابط المنتج
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

  // الأقسام الجديدة التي ستظهر أسفل الهيرو
  const categories = [
    { title: "تشكيلة العيد", link: "#" },
    { title: "أفضل المبيعات", link: "#" },
    { title: "العروض الحصرية", link: "#" },
    { title: "الملابس الشتوية", link: "#" }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full bg-[#121212] font-sans" dir="rtl">
      {/* حقن ستايل الـ Zoom Out وإخفاء شريط التمرير للأقسام */}
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

      <div className="relative w-full aspect-[3/4] md:aspect-[21/9] overflow-hidden">
        
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
            {/* تدرج لوني من الأسفل فقط للكتابة، مثل IMDb */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent"></div>
          </div>
        ))}

        {/* المحتوى النصي والصورة المصغرة */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex justify-between items-end">
          {/* النص على اليمين */}
          <div className="text-right flex-1 pr-2">
            <span className="bg-[#F5C518] text-black text-[10px] font-bold px-2 py-1 rounded-sm mb-2 inline-block">
              {slides[current].tag}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 leading-tight">
              {slides[current].title}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 max-w-[90%]">
              {slides[current].desc}
            </p>
            
            <a href={slides[current].productLink} className="bg-[#2C2C2C] hover:bg-[#333] text-white text-xs font-bold py-2 px-6 rounded border border-gray-600 transition inline-block">
              تصفح المنتج
            </a>
          </div>

          {/* الصورة المصغرة (البوستر) على اليسار */}
          <div className="w-24 md:w-32 flex-shrink-0 ml-2 rounded-lg overflow-hidden border-2 border-white/20 shadow-xl relative z-30 transition-transform hover:scale-105">
            <a href={slides[current].productLink}>
              <img 
                src={slides[current].thumbnail} 
                alt="Product Thumbnail" 
                className="w-full aspect-[2/3] object-cover"
              />
            </a>
          </div>
        </div>
      </div>
      
      {/* نقاط التنقل */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-30">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-[#F5C518]' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>

      {/* قسم تصفح الأقسام (أسفل الهيرو مباشرة) */}
      <div className="w-full bg-[#121212] px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-white text-xl md:text-2xl font-bold">تصفح الأقسام</h2>
          <span className="text-white text-2xl mb-1 font-bold">›</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((category, idx) => (
            <a 
              key={idx} 
              href={category.link} 
              className="whitespace-nowrap bg-transparent border border-gray-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/10 hover:border-gray-400 transition-colors"
            >
              {category.title}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}