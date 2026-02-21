"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

// --- 1. الأنماط والحركات ---
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes kenburns {
      0% { transform: scale(1); }
      100% { transform: scale(1.15); }
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(50%); }
    }
    @keyframes marquee-infinite {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
    .animate-marquee-infinite { display: flex; width: max-content; animation: marquee-infinite 35s linear infinite; }
    .pause-on-hover:hover { animation-play-state: paused; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .kenburns-bg { animation: kenburns 20s infinite alternate; }
  `}</style>
);

// --- 2. مكون الهيدر (مهم كقالب جاهز لأي قسم جديد مستقبلاً) ---
export const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
      عرض الكل <span className="text-xl leading-none">›</span>
    </Link>
  </div>
);

// --- 3. قسم Featured Today (المميز اليوم) المطور بنظام المجموعات والكوتشينة ---
export const FeaturedToday = ({ data }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(true);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const currentScroll = Math.abs(scrollLeft);
      setShowRightArrow(currentScroll > 5);
      setShowLeftArrow(currentScroll < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleScroll();
  }, [data]);

  if (!data || !data.cards) return null;

  return (
    <section className="bg-[#181818] pt-6 pb-10 mt-0 border-t border-[#333]">
      <GlobalStyles />
      <div className="max-w-[1400px] mx-auto relative px-4 text-right">
        
        {/* العناوين المحدثة - مع إزاحة ضئيلة لليسار (mr-2 md:mr-4) لتتطابق مع أول كارت */}
        <div className="mb-6 mr-2 md:mr-4" dir="rtl">
          <h2 className="text-[#F5C518] text-lg md:text-xl font-black uppercase tracking-wider">
            {data.title || "Featured today"}
          </h2>
          {data.subTitle && (
            <p className="text-gray-400 text-[11px] md:text-sm mt-1 font-medium">
              {data.subTitle}
            </p>
          )}
        </div>

        <div className="relative group/slider">
          
          {/* سهم الرجوع (يمين) */}
          <button 
            onClick={() => scroll('right')}
            className={`absolute top-1/2 -translate-y-1/2 right-2 z-30 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* سهم التقدم (يسار) */}
          <button 
            onClick={() => scroll('left')}
            className={`absolute top-1/2 -translate-y-1/2 left-2 z-30 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* شريط التمرير (المجموعات والكروت) */}
          {/* تم إضافة gap-6 md:gap-10 كمسافة فاصلة واضحة بين كل مجموعة والمجموعة التي تليها */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-6 md:gap-10 scrollbar-hide snap-x relative z-10 py-4" 
            dir="rtl"
          >
            {data.cards.map((mainCard, mIndex) => (
              // تم إضافة حاوية للمجموعة (Group) لتفعيل حركة الكوتشينة عند التمرير
              <div key={mIndex} className="flex group/deck items-stretch snap-start">
                
                {/* 1. الكارت الرئيسي (بداية المجموعة - حواف دائرية يمين) */}
                <Link href={mainCard.linkUrl || "#"} className="min-w-[150px] md:min-w-[190px] flex flex-col gap-2 cursor-pointer pb-2 relative z-50">
                  <div className="relative aspect-[2/3] rounded-r-2xl overflow-hidden bg-[#222] shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover group-hover/deck:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                    
                    {/* استرجاع الشارات بالأيقونات حسب طلبك */}
                    {mainCard.badgeType && mainCard.badgeType !== 'none' && (
                      <div className="absolute bottom-3 right-3 flex flex-row-reverse items-center gap-1 text-white font-bold text-[10px] md:text-xs drop-shadow-md z-10 bg-black/40 px-2 py-1 rounded backdrop-blur-[2px]">
                        {mainCard.badgeType === 'list' ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            قائمة
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            صور
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="px-1 text-right mt-1">
                    <h3 className="text-white text-[13px] md:text-sm font-bold line-clamp-2">{mainCard.mainTitle}</h3>
                    <span className="text-[#5799ef] text-[10px] md:text-xs font-semibold">{mainCard.linkText}</span>
                  </div>
                </Link>

                {/* 2. الكروت الفرعية التابعة (تأثير الكوتشينة المنسدلة) */}
                {mainCard.subCards?.map((subCard, sIndex) => (
                  <Link 
                    key={`${mIndex}-${sIndex}`} 
                    href={subCard.linkUrl || "#"} 
                    // سحر الحركة هنا: اختفاء بنسبة 95% تحت الكارت الرئيسي، مع ظهور جزء بسيط (بسبب المارجن السالب). وعند الهوفر يتفرد بالكامل للـ mr-0
                    className="min-w-[150px] md:min-w-[190px] flex flex-col gap-2 cursor-pointer pb-2 
                               transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-right
                               -mr-[115px] md:-mr-[145px] opacity-60 scale-[0.93]
                               group-hover/deck:mr-0 group-hover/deck:opacity-100 group-hover/deck:scale-100"
                    style={{ zIndex: 40 - sIndex }}
                  >
                    {/* الحواف الحادة لتبدو ملتصقة عند الفرد */}
                    <div className="relative aspect-[2/3] rounded-none overflow-hidden bg-[#222] border-r border-[#181818]/60 shadow-[-5px_0_15px_rgba(0,0,0,0.5)] group-hover/deck:shadow-none transition-shadow duration-700">
                      <img src={subCard.image} alt={subCard.mainTitle} className="w-full h-full object-cover group-hover/deck:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                    </div>
                    {/* إخفاء النص عند الطي وظهوره بانسيابية عند الفرد */}
                    <div className="px-1 text-right mt-1 transition-opacity duration-500 opacity-0 group-hover/deck:opacity-100">
                      <h3 className="text-white text-[13px] md:text-sm font-bold line-clamp-2">{subCard.mainTitle}</h3>
                      <span className="text-[#5799ef] text-[10px] md:text-xs font-semibold">{subCard.linkText}</span>
                    </div>
                  </Link>
                ))}

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};