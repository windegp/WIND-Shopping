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
  
  // حالة جديدة للتحكم في المجموعات المفتوحة (يفتح واحدة فقط في كل مرة)
  const [expandedDeck, setExpandedDeck] = useState(null);

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

  // دالة الفتح والإغلاق
  const toggleDeck = (index, e) => {
    e.preventDefault(); // لمنع الانتقال للرابط عند الضغط على زر الفتح
    e.stopPropagation(); // إيقاف أي تداخل مع الروابط
    setExpandedDeck(expandedDeck === index ? null : index);
  };

  useEffect(() => {
    handleScroll();
  }, [data]);

  if (!data || !data.cards) return null;

  return (
    // تقليل المسافة العلوية (pt-2) والسفلية أكثر (pb-1)
    <section className="bg-[#181818] pt-2 pb-1 mt-0 border-t border-[#333]">
      <GlobalStyles />
      <div className="max-w-[1400px] mx-auto relative px-4 text-right">
        
        {/* العناوين المحدثة */}
        <div className="mb-3 mr-2 md:mr-4" dir="rtl">
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
          {/* تقليل المسافة بين المجموعات لـ gap-4 md:gap-6 */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-4 md:gap-6 scrollbar-hide snap-x relative z-10 py-4" 
            dir="rtl"
          >
            {data.cards.map((mainCard, mIndex) => {
              const isExpanded = expandedDeck === mIndex;
              const hasSubCards = mainCard.subCards && mainCard.subCards.length > 0;

              return (
                <div key={mIndex} className="flex items-stretch snap-start">
                  
                  {/* 1. الكارت الرئيسي */}
                  <div className="relative z-50 flex flex-col gap-2 pb-2">
                    <Link href={mainCard.linkUrl || "#"} className="min-w-[150px] md:min-w-[190px] block relative">
                      
                      {/* دوران كامل (rounded-2xl) في الوضع الطبيعي، وحواف حادة عند الفتح */}
                      <div className={`relative aspect-[2/3] overflow-hidden bg-[#222] shadow-[0_0_15px_rgba(0,0,0,0.4)] transition-all duration-500 ${isExpanded && hasSubCards ? 'rounded-none border-l border-[#333]' : 'rounded-2xl'}`}>
                        <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                        
                        {/* الشارات (قائمة / صور) */}
                        {mainCard.badgeType && mainCard.badgeType !== 'none' && (
                          <div className="absolute bottom-3 right-3 flex flex-row-reverse items-center gap-1 text-white font-bold text-[10px] md:text-xs drop-shadow-md z-10 bg-black/40 px-2 py-1 rounded backdrop-blur-[2px]">
                            {mainCard.badgeType === 'list' ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                قائمة
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                صور
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* النصوص السفلية وزر الفتح للكارت الرئيسي */}
                    <div className="px-1 text-right mt-1 flex justify-between items-start">
                      <div>
                        <h3 className="text-white text-[13px] md:text-sm font-bold line-clamp-2">{mainCard.mainTitle}</h3>
                        <span className="text-[#5799ef] text-[10px] md:text-xs font-semibold">{mainCard.linkText}</span>
                      </div>
                      
                      {/* زر الفتح يظهر هنا فقط إذا كان مغلقاً وهناك كروت فرعية */}
                      {hasSubCards && !isExpanded && (
                        <button 
                          onClick={(e) => toggleDeck(mIndex, e)}
                          className="bg-[#222] hover:bg-[#333] border border-[#444] text-white p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. الكروت الفرعية التابعة */}
                  {hasSubCards && mainCard.subCards.map((subCard, sIndex) => {
                    const isLastSubCard = sIndex === mainCard.subCards.length - 1;

                    return (
                      <Link 
                        key={`${mIndex}-${sIndex}`} 
                        href={subCard.linkUrl || "#"} 
                        // تم تغيير الإخفاء ليكون كامل (مطابق لعرض الكارت) وبشفافية 0 لمنع ظهوره
                        className={`min-w-[150px] md:min-w-[190px] flex flex-col gap-2 cursor-pointer pb-2 
                                   transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-right
                                   ${isExpanded ? 'mr-0 opacity-100 scale-100' : '-mr-[150px] md:-mr-[190px] opacity-0 scale-95 pointer-events-none'}`}
                        style={{ zIndex: 40 - sIndex }}
                      >
                        <div className="relative aspect-[2/3] rounded-none overflow-hidden bg-[#222] border-r border-[#181818]/60 shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
                          <img src={subCard.image} alt={subCard.mainTitle} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                        </div>
                        
                        <div className={`px-1 text-right mt-1 flex justify-between items-start transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                          <div>
                            <h3 className="text-white text-[13px] md:text-sm font-bold line-clamp-2">{subCard.mainTitle}</h3>
                            <span className="text-[#5799ef] text-[10px] md:text-xs font-semibold">{subCard.linkText}</span>
                          </div>
                          
                          {/* زر الإغلاق يظهر هنا فقط إذا كان مفتوحاً وفي آخر كارت فرعي */}
                          {isExpanded && isLastSubCard && (
                            <button 
                              onClick={(e) => toggleDeck(mIndex, e)}
                              className="bg-[#222] hover:bg-[#333] border border-[#444] text-[#F5C518] p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </Link>
                    );
                  })}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};