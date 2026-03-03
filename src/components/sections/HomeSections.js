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

  const toggleDeck = (index, e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setExpandedDeck(expandedDeck === index ? null : index);
  };

  useEffect(() => {
    handleScroll();
  }, [data]);

  if (!data || !data.cards) return null;

  return (
    <section className="bg-[#181818] pt-2 pb-1 mt-0 border-t border-[#333]">
      <GlobalStyles />
      <div className="max-w-[1400px] mx-auto relative px-4 text-right">
        
        <div className="mb-3" dir="rtl">
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
          
          <button 
            onClick={() => scroll('right')}
            className={`absolute top-1/2 -translate-y-1/2 right-2 z-30 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>

          <button 
            onClick={() => scroll('left')}
            className={`absolute top-1/2 -translate-y-1/2 left-2 z-30 bg-black/40 hover:bg-black/60 border border-white/20 text-white w-10 h-14 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>

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
                  
                  <div className="relative z-50 flex flex-col gap-2 pb-2">
                    <Link href={mainCard.linkUrl || "#"} className="min-w-[150px] md:min-w-[190px] block relative">
                      <div className={`relative aspect-[2/3] overflow-hidden bg-[#222] shadow-[0_0_15px_rgba(0,0,0,0.4)] transition-all duration-500 ${isExpanded && hasSubCards ? 'rounded-none border-l border-[#333]' : 'rounded-2xl'}`}>
                        <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
                        
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

                    <div className="px-1 text-right mt-1 flex justify-between items-start">
                      <div>
                        <h3 className="text-white text-[13px] md:text-sm font-bold line-clamp-2">{mainCard.mainTitle}</h3>
                        <span className="text-[#5799ef] text-[10px] md:text-xs font-semibold">{mainCard.linkText}</span>
                      </div>
                      
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

                  {hasSubCards && mainCard.subCards.map((subCard, sIndex) => {
                    const isLastSubCard = sIndex === mainCard.subCards.length - 1;

                    return (
                      <Link 
                        key={`${mIndex}-${sIndex}`} 
                        href={subCard.linkUrl || "#"} 
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


// --- 4. قسم أفضل 10 منتجات لدي وينـد (IMDb Style) ---
export const TopTenProducts = ({ data }) => {
  // التحقق من وجود بيانات لتجنب أخطاء الرندرة
  if (!data || !data.cards || data.cards.length === 0) return null;

  return (
    <section className="bg-[#000000] pt-6 pb-10 mt-0 border-t border-[#333]">
      <div className="max-w-[800px] mx-auto relative px-4 text-right" dir="rtl">
        
        {/* عنوان القسم مطابق لصورة IMDb */}
        <div className="flex items-center gap-2 mb-6 cursor-pointer group w-max">
          <div className="w-1.5 h-6 bg-[#F5C518] rounded-sm"></div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-1 transition-colors group-hover:text-[#F5C518]">
            {data.title || "أفضل 10 منتجات لدي وينـد"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 mt-1 text-white group-hover:text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </h2>
        </div>

        {/* قائمة المنتجات الطولية */}
        <div className="flex flex-col gap-4">
          {data.cards.slice(0, 10).map((card, index) => (
            <div key={index} className="flex bg-[#1a1a1a] rounded-xl overflow-hidden shadow-lg border border-[#222] transition-all hover:border-[#444]">
              
              {/* صورة المنتج مع الـ Bookmark */}
              <div className="relative w-[110px] md:w-[130px] shrink-0 bg-[#222]">
                <img src={card.image} alt={card.mainTitle} className="w-full h-full object-cover aspect-[2/3]" />
                
                {/* علامة + الشفافة أعلى الصورة */}
                <div className="absolute top-0 right-0 w-8 h-10 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-1" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>

              {/* تفاصيل المنتج */}
              <div className="flex-1 p-3 md:p-4 flex flex-col justify-start">
                
                {/* شارة الترتيب الزرقاء (Ranking Badge) */}
                <div className="mb-2">
                  <span className="inline-block bg-[#1f75d9] text-white text-xs md:text-sm font-black px-2.5 py-0.5" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)', borderTopLeftRadius: '0.25rem', borderBottomLeftRadius: '0.25rem' }}>
                    #{index + 1}
                  </span>
                </div>

                {/* عنوان المنتج */}
                <h3 className="text-white font-bold text-base md:text-lg mb-1 line-clamp-2 leading-tight">{card.mainTitle}</h3>
                
                {/* السعر والتصنيف */}
                <div className="flex items-center gap-3 text-gray-400 text-[11px] md:text-sm mb-2">
                  <span className="text-white font-semibold">{card.price || "متوفر الآن"}</span>
                  {card.category && <span>{card.category}</span>}
                </div>

                {/* التقييم وزر المراجعة */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F5C518]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white text-[13px] md:text-sm font-bold">{card.rating || "5.0"}</span>
                    <span className="text-gray-400 text-[11px] md:text-xs">({card.reviewsCount || "التقييمات"})</span>
                  </div>
                  <button className="flex items-center gap-1 text-[#5799ef] hover:bg-[#2a3f5f] px-2 py-0.5 rounded transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-[13px] md:text-sm font-bold">قيّم</span>
                  </button>
                </div>

                {/* زر عرض التفاصيل (مربوط بـ linkUrl الكارت) */}
                <div className="mt-auto">
                   <Link href={card.linkUrl || "/"} className="inline-flex items-center gap-2 text-[#5799ef] hover:text-white transition-colors text-[13px] md:text-sm font-bold">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                     </svg>
                     عرض التفاصيل
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* زر عرض الكل السفلي (مربوط بـ linkUrl القسم) */}
        <div className="mt-6 flex justify-center pb-2">
           <Link href={data.linkUrl || "/"} className="w-full text-center bg-[#242424] hover:bg-[#333] text-[#5799ef] font-bold py-3 px-8 rounded-full transition-colors text-sm md:text-base border border-[#333]">
             عرض الكل
           </Link>
        </div>
      </div>
    </section>
  );
};
// --- 5. قسم شريط المنتجات المتحرك (Marquee Products Slider) ---
export const MarqueeProducts = ({ data }) => {
  if (!data || !data.products || data.products.length === 0) return null;

  const duplicatedProducts = [...data.products, ...data.products, ...data.products];

  return (
    <section className="py-2 bg-[#161616] border-y border-[#222] overflow-hidden">
      
      {/* 1. استخدام مكون SectionHeader لتوحيد الشكل وإظهار زر عرض الكل */}
      <div className="max-w-[1400px] mx-auto">
        <SectionHeader 
          title={data.title || "تسوق التشكيلة الجديدة"} 
          subTitle={data.subTitle} 
          link={data.linkUrl || data.viewAllLink || "#"} 
        />
      </div>

      {/* شريط المنتجات المتحرك */}
      <div className="relative flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-10 pt-2" dir="ltr">
        <div className="flex gap-4 md:gap-6 animate-marquee-infinite pause-on-hover px-4">
          {duplicatedProducts.map((product, index) => (
            <Link key={index} href={product.linkUrl || "#"} className="min-w-[180px] md:min-w-[240px] opacity-80 hover:opacity-100 transition-opacity block group">
              
              <div className="relative aspect-[3/4] bg-[#222] rounded-lg overflow-hidden mb-3 border border-[#333] group-hover:border-[#F5C518]/50 transition-colors">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                {product.badge && (
                  <span className="absolute top-2 right-2 bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 rounded-sm uppercase shadow-md">
                    {product.badge}
                  </span>
                )}

                {/* بادج خصم يظهر أوتوماتيك لو فيه سعر قديم */}
                {product.compareAtPrice && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase shadow-md">
                    تخفيض
                  </span>
                )}
              </div>
              
              <div className="text-right px-1" dir="rtl">
                <h3 className="text-white font-bold text-sm line-clamp-1">{product.name}</h3>
                
                {/* 2. تنسيق السعر الجديد والقديم وإضافة LE */}
                <div className="flex items-center justify-end gap-2 mt-1.5">
                  {product.compareAtPrice && (
                    <span className="text-gray-500 line-through text-[11px] md:text-xs font-semibold">
                      {product.compareAtPrice} LE
                    </span>
                  )}
                  <span className="text-[#5799ef] font-black text-sm md:text-base">
                    {product.price} LE
                  </span>
                </div>
              </div>

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};