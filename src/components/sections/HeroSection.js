"use client";
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // تأكد أن هذا المسار يتطابق مع ملفك

export default function HeroSection() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const scrollContainerRef = useRef(null);

  // جلب البيانات من Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "homepage", "main-hero");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSlides(docSnap.data().slides || []);
          setCategories(docSnap.data().categories || []);
        } else {
          console.log("لا توجد بيانات محفوظة بعد.");
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // مؤقت تقليب الصور
  useEffect(() => {
    if (slides.length === 0) return;
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

  // شاشة تحميل بسيطة أثناء جلب البيانات
  if (loading) {
    return <div className="w-full aspect-[21/9] bg-[#121212] flex items-center justify-center text-gray-400 font-sans">جاري تجهيز أحدث التشكيلات...</div>;
  }

  // رسالة في حال عدم وجود عروض
  if (slides.length === 0) {
    return <div className="w-full aspect-[21/9] bg-[#121212] flex items-center justify-center text-gray-500 font-sans">لم يتم إضافة عروض بعد. يرجى إضافتها من لوحة التحكم.</div>;
  }

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

      {/* حاوية الهيرو الرئيسية 
        (z-20 لضمان أن أي شيء يخرج منها يغطي الأقسام السفلية)
      */}
      <div className="relative w-full aspect-[3/4] md:aspect-[21/9] z-20">
        
        {/* خلفية الصور والأنيميشن والتدرج */}
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
                {/* التدرج اللوني: تم التأكيد على درجة #121212 وزيادة مساحة اللون الصلب (from-30%) ليغطي أسفل الزر بقوة */}
                <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-[#121212] from-30% via-[#121212]/90 to-transparent pointer-events-none"></div>
            </div>
            ))}
        </div>

        {/* المحتوى النصي والبوستر */}
        {slides.map((slide, index) => (
          <div 
            key={`content-${index}`}
            className={`absolute -bottom-8 md:-bottom-12 right-2 md:right-4 left-4 flex items-start gap-4 md:gap-5 transition-opacity duration-700 ease-in-out ${index === current ? 'opacity-100 z-40' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            {/* 1. البوستر المصغر (أقصى اليمين) */}
            <div className="w-28 md:w-36 flex-shrink-0 rounded-md overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative transition-transform hover:scale-105 bg-[#121212]">
              <a href={slide.productLink} className="block w-full h-full">
                <img 
                  src={slide.thumbnail} 
                  alt={slide.title} 
                  className="w-full aspect-[2/3] object-cover"
                />
              </a>
              <div className="absolute top-1 right-2 text-white text-2xl font-light leading-none drop-shadow-lg opacity-80">+</div>
            </div>

            {/* 2. النص (على اليسار وموازٍ للبوستر من الأعلى) */}
            <div className="text-right flex-1 pt-1 md:pt-2">
              <span className="bg-[#F5C518] text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm mb-2 inline-block">
                {slide.tag}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                {slide.title}
              </h1>
              <p className="text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 max-w-[85%] drop-shadow-sm">
                {slide.desc}
              </p>
              
              <a href={slide.productLink} className="bg-[#2C2C2C] hover:bg-white hover:text-black text-white text-xs md:text-sm font-bold py-2.5 px-6 rounded border border-[#333] transition-all inline-block shadow-lg">
                {slide.buttonText || "تصفح المنتج"}
              </a>
            </div>
          </div>
        ))}

        {/* نقاط التنقل الخاصة بالهيرو */}
        <div className="absolute top-4 left-4 flex gap-1.5 z-50">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#F5C518]' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* قسم تصفح الأقسام 
          استخدام نفس درجة الناف بار #121212 كخلفية صلبة
      */}
      <div className="w-full bg-[#121212] pt-14 md:pt-16 pb-6 relative z-10 pl-0 pr-5">
        
        {/* عنوان القسم */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white text-lg md:text-xl font-bold">تصفح الأقسام</h2>
          <span className="text-white text-xl mb-1 font-bold">›</span>
        </div>
        
        {/* حاوية سحب الأقسام مع الخط الرمادي العلوي فقط */}
        <div className="relative w-full border-t border-[#333] py-4 flex items-center">
          
          {/* شريط السحب */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto hide-scrollbar w-full items-center"
          >
            {categories.map((category, idx) => (
              <a 
                key={idx} 
                href={category.link} 
                className="whitespace-nowrap flex items-center gap-1.5 bg-[#121212] border border-[#333] text-gray-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-[#2C2C2C] hover:text-white hover:border-gray-400 transition-colors shadow-sm"
              >
                {category.title}
                <span className="text-gray-500 text-lg leading-none font-bold mt-0.5">›</span>
              </a>
            ))}
            {/* مسافة فارغة في النهاية */}
            <div className="w-16 flex-shrink-0"></div>
          </div>

          {/* تأثير التدرج الأسود والسهم الأيسر (مطابق للناف بار #121212) */}
          <div 
            className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-[#121212] via-[#121212]/90 to-transparent flex items-center justify-start pointer-events-none z-20"
          >
            <button 
                onClick={scrollLeft}
                className="pointer-events-auto ml-2 p-2 text-gray-300 hover:text-[#F5C518] transition-colors"
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