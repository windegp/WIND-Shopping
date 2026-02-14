"use client";
import React, { useState, useEffect } from 'react';

export default function HeroSection() {
  // مصفوفة الصور - يمكنك إضافة أو تغيير الصور هنا بسهولة
  const slides = [
    {
      image: "/images/banners/1.webp", // صورتك الأولى في مجلد public
      tag: "وصل حديثاً | شتاء 2026",
      title: "أناقة تعكس",
      highlight: "جوهر الدفء",
      desc: "اكتشف مجموعة Wind الجديدة، حيث تجتمع الجودة العالية مع التصميم العصري لتمنحك الراحة التي تستحقها."
    },
    {
      image: "/images/banners/2.webp", // صورتك الثانية
      tag: "مجموعة الشيلان الحصرية",
      title: "لمسات ناعمة لليالٍ",
      highlight: "أكثر برودة",
      desc: "شيلان صوفية فاخرة صُممت خصيصاً لتناسب إطلالتك الشتوية الراقية."
    }
  ];

  const [current, setCurrent] = useState(0);

  // تغيير الصور تلقائياً كل 5 ثوانٍ
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] flex items-center overflow-hidden bg-black">
      
      {/* عرض الصور مع حركة ناعمة */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src={slide.image} 
            alt="Wind Collection" 
            className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-[5000ms]"
            style={{ transform: index === current ? "scale(1)" : "scale(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/40"></div>
        </div>
      ))}

      {/* المحتوى النصي المتحرك بناءً على الصورة */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full text-right">
        <div className="max-w-2xl space-y-6">
          <span className="inline-block bg-[#F5C518] text-black text-xs font-black px-3 py-1 uppercase tracking-widest rounded-sm animate-bounce">
            {slides[current].tag}
          </span>
          
          <h1 className="text-4xl md:text-7xl font-bold leading-tight drop-shadow-2xl text-white">
            {slides[current].title} <br /> 
            <span className="text-[#F5C518]">{slides[current].highlight}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 max-w-lg leading-relaxed font-medium">
            {slides[current].desc}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button className="bg-white text-black hover:bg-[#F5C518] transition-all duration-300 px-8 py-4 rounded font-bold text-lg flex items-center gap-2">
              تصفح التشكيلة
            </button>
            <button className="border-2 border-white/30 backdrop-blur-md text-white hover:bg-white/10 transition px-8 py-4 rounded font-bold text-lg">
              تعرف علينا
            </button>
          </div>
        </div>
      </div>

      {/* نقاط التنقل أسفل السلايدر */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <div 
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 transition-all duration-500 cursor-pointer ${i === current ? "w-8 bg-[#F5C518]" : "w-4 bg-white/30"}`}
          />
        ))}
      </div>

    </section>
  );
}