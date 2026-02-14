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
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full bg-[#121212]">
      {/* التغيير الجوهري:
        بدلاً من h-screen، نستخدم aspect-ratio محدد.
        aspect-[4/5] للموبايل يعطي شكل "بوستر" متزن، 
        أو aspect-video (16:9) لو أردت شكل يوتيوب/سينما.
        سأستخدم aspect-[3/4] لأنه الأفضل لعرض الأزياء على الموبايل دون أن يملأ الشاشة بالكامل.
      */}
      <div className="relative w-full aspect-[3/4] md:aspect-[21/9] overflow-hidden">
        
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover" 
            />
            {/* تدرج لوني من الأسفل فقط للكتابة، مثل IMDb */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent"></div>
          </div>
        ))}

        {/* المحتوى النصي - في الأسفل وبخطوط أصغر */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-right z-10">
          <span className="bg-[#F5C518] text-black text-[10px] font-bold px-2 py-1 rounded-sm mb-2 inline-block">
            {slides[current].tag}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 leading-tight">
            {slides[current].title}
          </h1>
          <p className="text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 max-w-[80%] ml-auto">
            {slides[current].desc}
          </p>
          
          {/* أزرار صغيرة ومحكومة */}
          <button className="bg-[#2C2C2C] hover:bg-[#333] text-white text-xs font-bold py-2 px-6 rounded border border-gray-600 transition">
            تصفح المجموعة
          </button>
        </div>
      </div>
      
      {/* نقاط التنقل - صغيرة جداً */}
      <div className="absolute top-4 left-4 flex gap-1.5 z-20">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-[#F5C518]' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}