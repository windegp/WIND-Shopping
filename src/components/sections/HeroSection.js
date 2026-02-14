"use client";
import React, { useState, useEffect } from 'react';

export default function HeroSection() {
  const slides = [
    {
      image: "/images/banners/1.webp",
      tag: "وصل حديثاً",
      title: "مجموعة الشتاء",
      desc: "تصاميم كلاسيكية بلمسة عصرية"
    },
    {
      image: "/images/banners/2.webp",
      tag: "الأكثر طلباً",
      title: "شيلان فاخرة",
      desc: "دفء وأناقة لكل المناسبات"
    }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // إضافة كود CSS للأنيميشن ديناميكياً لضمان تأثير الـ Zoom Out السينمائي
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes kenBurnsOut {
        0% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      .animate-zoom-out {
        animation: kenBurnsOut 6s ease-out forwards;
      }
    `;
    document.head.appendChild(styleSheet);
    
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      clearInterval(timer);
      document.head.removeChild(styleSheet);
    };
  }, [slides.length]);

  return (
    <div className="relative w-full bg-[#121212]">
      {/* Container بتناسب أبعاد احترافي */}
      <div className="relative w-full aspect-[3/4] md:aspect-[21/9] overflow-hidden">
        
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {/* الصورة مع كلاس الأنيميشن الذي يعمل فقط عندما تكون الشريحة نشطة */}
            <img 
              src={slide.image} 
              alt={slide.title}
              className={`w-full h-full object-cover ${index === current ? 'animate-zoom-out' : ''}`} 
            />
            
            {/* التدرج اللوني المستوحى من IMDb */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent z-10"></div>
          </div>
        ))}

        {/* المحتوى النصي - ثابت فوق الصور */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-right z-20 animate-[fadeInUp_0.8s_ease-out]">
          <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 rounded-sm mb-2 inline-block uppercase tracking-wider">
            {slides[current].tag}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tighter">
            {slides[current].title}
          </h1>
          <p className="text-gray-300 text-sm md:text-base mb-5 line-clamp-2 max-w-[85%] ml-auto font-light italic">
            {slides[current].desc}
          </p>
          
          <button className="bg-[#2C2C2C] hover:bg-[#F5C518] hover:text-black text-white text-xs font-black py-3 px-8 rounded-sm border border-gray-600 transition-all duration-300 uppercase tracking-widest shadow-lg">
            تصفح المجموعة
          </button>
        </div>
      </div>
      
      {/* نقاط التنقل (Indicators) */}
      <div className="absolute top-6 left-6 flex gap-2 z-30">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 transition-all duration-500 rounded-full ${i === current ? 'w-8 bg-[#F5C518]' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}