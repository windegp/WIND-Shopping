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

// --- 3. قسم Featured Today (المميز اليوم) المطور بنظام المجموعات ---
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
        
        {/* العناوين المحدثة */}
        <div className="mb-8">
          <h2 className="text-[#F5C518] text-lg md:text-xl font-black uppercase tracking-wider">
            {data.title || "Featured today"}
          </h2>
          {data.subTitle && (
            <p className="text-gray-400 text-sm md:text-base mt-1 font-medium">
              {data.subTitle}
            </p>
          )}
        </div>

        <div className="relative group/slider">
          
          {/* سهم الرجوع (يمين) */}
          <button 
            onClick={() => scroll('right')}
            className={`absolute top-1/2 -translate-y-1/2 right-2 z-20 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* سهم التقدم (يسار) */}
          <button 
            onClick={() => scroll('left')}
            className={`absolute top-1/2 -translate-y-1/2 left-2 z-20 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* شريط التمرير (المجموعات والكروت) */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-1 scrollbar-hide snap-x relative z-10" 
            dir="rtl"
          >
            {data.cards.map((mainCard, mIndex) => (
              <React.Fragment key={mIndex}>
                
                {/* 1. الكارت الرئيسي (بداية المجموعة - حواف دائرية يمين) */}
                <Link href={mainCard.linkUrl || "#"} className="min-w-[220px] md:min-w-[280px] flex flex-col gap-2 snap-start group cursor-pointer pb-2">
                  <div className="relative aspect-[2/3] rounded-r-2xl overflow-hidden bg-[#222]">
                    <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                    
                    {mainCard.badgeType && mainCard.badgeType !== 'none' && (
                      <div className="absolute bottom-3 right-3 flex flex-row-reverse items-center gap-1.5 text-white font-bold text-xs drop-shadow-md z-10 bg-black/20 px-2 py-1 rounded backdrop-blur-[2px]">
                        {mainCard.badgeType === 'list' ? 'قائمة' : 'صور'}
                      </div>
                    )}
                  </div>
                  <div className="px-2 text-right mt-1">
                    <h3 className="text-white text-sm md:text-base font-bold line-clamp-2">{mainCard.mainTitle}</h3>
                    <span className="text-[#5799ef] text-xs md:text-sm font-semibold">{mainCard.linkText}</span>
                  </div>
                </Link>

                {/* 2. الكروت الفرعية التابعة (حواف حادة - ملتصقة) */}
                {mainCard.subCards?.map((subCard, sIndex) => (
                  <Link key={`${mIndex}-${sIndex}`} href={subCard.linkUrl || "#"} className="min-w-[220px] md:min-w-[280px] flex flex-col gap-2 snap-start group cursor-pointer pb-2">
                    <div className="relative aspect-[2/3] rounded-none overflow-hidden bg-[#222] border-r border-[#181818]">
                      <img src={subCard.image} alt={subCard.mainTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="px-2 text-right mt-1">
                      <h3 className="text-white text-sm md:text-base font-bold line-clamp-2">{subCard.mainTitle}</h3>
                      <span className="text-[#5799ef] text-xs md:text-sm font-semibold">{subCard.linkText}</span>
                    </div>
                  </Link>
                ))}

              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};