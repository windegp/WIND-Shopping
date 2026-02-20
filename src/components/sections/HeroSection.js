"use client";
import React, { useState, useEffect } from 'react';

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
    { title: "Casting Directors Guild Awards", link: "#" },
    { title: "Anime Trends", link: "#" },
    { title: "Most Popular", link: "#" },
    { title: "Winter Collection", link: "#" }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full bg-[#121212] font-sans overflow-visible" dir="rtl">
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

      {/* حاوية الهيرو الرئيسية */}
      <div className="relative w-full aspect-[3/4] md:aspect-[21/9]">
        
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
                {/* تدرج لوني كثيف وطويل من الأسفل لعمل خلفية للبوستر المتداخل */}
                <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
            </div>
            ))}
        </div>

        {/* المحتوى النصي والبوستر - تم الترتيب: البوستر يمين، النص يسار */}
        <div className="absolute bottom-0 left-0 right-0 px-5 z-30 flex items-end">
          
          {/* 1. بوستر المنتج (على اليمين) متداخل للخارج */}
          <div className="w-28 md:w-40 flex-shrink-0 ml-4 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl relative z-40 transition-transform hover:scale-105 -mb-12 md:-mb-16">
            <a href={slides[current].productLink}>
              <img 
                src={slides[current].thumbnail} 
                alt="Product Thumbnail" 
                className="w-full aspect-[2/3] object-cover"
              />
            </a>
            {/* أيقونة الإضافة الوهمية للمطابقة مع الصورة */}
            <div className="absolute top-2 right-2 text-white text-3xl font-light leading-none drop-shadow-lg">+</div>
          </div>

          {/* 2. النص (على اليسار) */}
          <div className="text-right flex-1 pb-4 md:pb-8">
            <span className="bg-[#F5C518] text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm mb-2 inline-block">
              {slides[current].tag}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-md">
              {slides[current].title}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 max-w-[90%] drop-shadow-sm">
              {slides[current].desc}
            </p>
            
            <a href={slides[current].productLink} className="bg-[#2C2C2C] hover:bg-white hover:text-black text-white text-xs md:text-sm font-bold py-2.5 px-6 rounded border border-gray-600 transition-all inline-block">
              تصفح المنتج
            </a>
          </div>
        </div>
      </div>
      
      {/* نقاط التنقل */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-30">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#F5C518]' : 'w-2 bg-white/40'}`}
          />
        ))}
      </div>

      {/* قسم تصفح الأقسام (بتصميم مطابق للصورة السوداء) */}
      <div className="w-full bg-[#121212] px-5 pt-16 pb-8 relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-white text-lg md:text-xl font-bold">Browse trailers</h2>
          <span className="text-white text-xl mb-1 font-bold">›</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((category, idx) => (
            <a 
              key={idx} 
              href={category.link} 
              /* تنسيق الأزرار مطابق للمرجع: خلفية شفافة، حدود بيضاء رفيعة، نص أبيض، شكل بيضاوي */
              className="whitespace-nowrap bg-transparent border border-white/30 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {category.title}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}