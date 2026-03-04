"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

// ==========================================================================
// LUXURY REDESIGN — كل الـ props والـ data structure محفوظة بالكامل
// التعديل فقط على: الألوان، الـ spacing، الـ typography، والـ visual hierarchy
// ==========================================================================

// --- DESIGN TOKENS (luxury palette) ---
// bg-[#0A0A0A]   → أسود فاخر (base)
// bg-[#111111]   → رمادي داكن جداً (section bg)
// bg-[#1C1C1C]   → رمادي داكن (card bg)
// text-[#E8E0D0] → أوف وايت (primary text) — مش أبيض صارخ
// text-[#8A8070] → بيج داكن (secondary text) — بدل gray-400
// border-[#2A2A2A] → حدود خفيفة جداً
// #C9A84C        → ذهبي مطفي (بدل الأصفر الفج)
// #FFFFFF        → أبيض فقط للـ CTA المهمة

// --- 1. الأنماط والحركات ---
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
    
    @keyframes kenburns {
      0% { transform: scale(1); }
      100% { transform: scale(1.08); }
    }
    @keyframes marquee-infinite {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .animate-marquee-infinite { 
      display: flex; 
      width: max-content; 
      animation: marquee-infinite 40s linear infinite; 
    }
    .pause-on-hover:hover { animation-play-state: paused; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .kenburns-bg { animation: kenburns 20s infinite alternate ease-in-out; }
    .font-serif { font-family: 'Cormorant Garamond', serif; }
    .font-sans-luxury { font-family: 'Inter', sans-serif; }
    
    /* الـ Gold gradient للعناوين المميزة */
    .gold-text {
      background: linear-gradient(135deg, #C9A84C 0%, #E8D5A3 50%, #C9A84C 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gold-shimmer {
      background: linear-gradient(135deg, #C9A84C 0%, #E8D5A3 50%, #C9A84C 100%);
      background-size: 200% auto;
      animation: shimmer 3s linear infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    /* Luxury thin divider */
    .luxury-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #C9A84C40, transparent);
    }
    /* Card hover lift */
    .card-lift {
      transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                  box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .card-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.2);
    }
  `}</style>
);

// --- 2. مكون الهيدر المحسوب (props محفوظة بالكامل) ---
export const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-8 px-4 pt-12" dir="rtl">
    <div className="flex items-start gap-4">
      {/* خط ذهبي رفيع أنيق بدل الشريط السميك */}
      <div className="w-px h-10 bg-gradient-to-b from-[#C9A84C] to-transparent mt-1 shrink-0"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-[#E8E0D0] tracking-wide font-sans-luxury">
          {title}
        </h2>
        {subTitle && (
          <p className="text-[#6B6358] text-[10px] md:text-xs mt-1.5 font-normal tracking-widest uppercase">
            {subTitle}
          </p>
        )}
      </div>
    </div>
    <Link 
      href={link} 
      className="text-[#8A8070] hover:text-[#C9A84C] text-xs font-medium tracking-widest uppercase flex items-center gap-2 transition-colors duration-300 pb-1 border-b border-transparent hover:border-[#C9A84C]/30"
    >
      عرض الكل
      <span className="text-base leading-none opacity-60">›</span>
    </Link>
  </div>
);

// --- 3. قسم Featured Today (props محفوظة بالكامل) ---
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

  useEffect(() => { handleScroll(); }, [data]);

  if (!data || !data.cards) return null;

  return (
    <section className="bg-[#0D0D0D] pt-4 pb-2 border-t border-[#1E1E1E]">
      <GlobalStyles />
      <div className="max-w-[1400px] mx-auto relative px-4 text-right">

        {/* العنوان — أبسط وأفخم */}
        <div className="mb-5 pt-8" dir="rtl">
          <p className="text-[#6B6358] text-[10px] tracking-[0.3em] uppercase mb-1.5 font-sans-luxury">
            مختارات اليوم
          </p>
          <h2 className="text-[#E8E0D0] text-xl md:text-2xl font-black tracking-wide font-sans-luxury">
            {data.title || "Featured Today"}
          </h2>
          {data.subTitle && (
            <p className="text-[#6B6358] text-[11px] mt-1.5">{data.subTitle}</p>
          )}
        </div>

        <div className="luxury-divider mb-5"></div>

        <div className="relative group/slider">
          {/* أسهم التنقل — أنيقة وخفيفة */}
          {[
            { dir: 'right', show: showRightArrow, pos: 'right-0' },
            { dir: 'left', show: showLeftArrow, pos: 'left-0' }
          ].map(({ dir, show, pos }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              className={`absolute top-1/2 -translate-y-1/2 ${pos} z-30 
                         w-9 h-9 flex items-center justify-center
                         bg-[#0D0D0D]/80 backdrop-blur-md
                         border border-[#2A2A2A] hover:border-[#C9A84C]/40
                         text-[#8A8070] hover:text-[#C9A84C]
                         rounded-full transition-all duration-300
                         ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d={dir === 'right' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          ))}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-4 md:gap-5 scrollbar-hide snap-x relative z-10 py-4"
            dir="rtl"
          >
            {data.cards.map((mainCard, mIndex) => {
              const isExpanded = expandedDeck === mIndex;
              const hasSubCards = mainCard.subCards && mainCard.subCards.length > 0;

              return (
                <div key={mIndex} className="flex items-stretch snap-start">
                  <div className="relative z-50 flex flex-col gap-2 pb-2">
                    <Link href={mainCard.linkUrl || "#"} className="min-w-[150px] md:min-w-[185px] block relative card-lift">
                      <div className={`relative aspect-[2/3] overflow-hidden bg-[#1C1C1C] 
                                      transition-all duration-500
                                      ${isExpanded && hasSubCards ? 'rounded-none' : 'rounded-xl'}
                                      ring-1 ring-white/5`}>
                        <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover" />
                        {/* gradient أغمق وأفخم */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent pointer-events-none"></div>

                        {mainCard.badgeType && mainCard.badgeType !== 'none' && (
                          <div className="absolute bottom-3 right-3 flex flex-row-reverse items-center gap-1 
                                         text-[#E8E0D0] font-medium text-[9px] z-10 
                                         bg-black/60 backdrop-blur-md px-2.5 py-1 
                                         border border-white/10 rounded-sm tracking-wider uppercase">
                            {mainCard.badgeType === 'list' ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                قائمة
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                صور
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="px-1 text-right mt-1.5 flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-[#D4CCC0] text-[12px] md:text-[13px] font-medium line-clamp-2 leading-snug tracking-wide">
                          {mainCard.mainTitle}
                        </h3>
                        <span className="text-[#C9A84C] text-[10px] font-medium tracking-wider mt-0.5 block opacity-80">
                          {mainCard.linkText}
                        </span>
                      </div>

                      {hasSubCards && !isExpanded && (
                        <button
                          onClick={(e) => toggleDeck(mIndex, e)}
                          className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2A2A2A] hover:border-[#C9A84C]/30
                                     text-[#8A8070] hover:text-[#C9A84C] 
                                     p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
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
                        className={`min-w-[150px] md:min-w-[185px] flex flex-col gap-2 cursor-pointer pb-2
                                   transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-right
                                   ${isExpanded ? 'mr-0 opacity-100 scale-100' : '-mr-[150px] md:-mr-[185px] opacity-0 scale-95 pointer-events-none'}`}
                        style={{ zIndex: 40 - sIndex }}
                      >
                        <div className="relative aspect-[2/3] rounded-none overflow-hidden bg-[#1C1C1C] 
                                       shadow-[-8px_0_30px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                          <img src={subCard.image} alt={subCard.mainTitle} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none"></div>
                        </div>

                        <div className={`px-1 text-right mt-1.5 flex justify-between items-start gap-2 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                          <div>
                            <h3 className="text-[#D4CCC0] text-[12px] font-medium line-clamp-2 leading-snug">{subCard.mainTitle}</h3>
                            <span className="text-[#C9A84C] text-[10px] font-medium tracking-wider mt-0.5 block opacity-80">{subCard.linkText}</span>
                          </div>

                          {isExpanded && isLastSubCard && (
                            <button
                              onClick={(e) => toggleDeck(mIndex, e)}
                              className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2A2A2A] hover:border-[#C9A84C]/30
                                         text-[#C9A84C] p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
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

// --- 4. قسم أفضل 10 منتجات (props محفوظة بالكامل) ---
export const TopTenProducts = ({ data }) => {
  if (!data || !data.cards || data.cards.length === 0) return null;

  return (
    <section className="bg-[#080808] pt-12 pb-16 border-t border-[#1A1A1A]">
      <div className="max-w-[720px] mx-auto relative px-4 text-right" dir="rtl">

        {/* العنوان — أنيق ومختلف */}
        <div className="mb-10">
          <p className="text-[#6B6358] text-[10px] tracking-[0.35em] uppercase mb-2 font-sans-luxury">
            الأكثر طلباً
          </p>
          <div className="flex items-center gap-3 group cursor-pointer w-max">
            <div className="w-px h-8 bg-gradient-to-b from-[#C9A84C] to-transparent"></div>
            <h2 className="text-2xl md:text-3xl font-black text-[#E8E0D0] tracking-tight font-sans-luxury 
                          group-hover:text-[#C9A84C] transition-colors duration-500">
              {data.title || "أفضل 10 منتجات"}
            </h2>
          </div>
          <div className="luxury-divider mt-6"></div>
        </div>

        {/* قائمة المنتجات */}
        <div className="flex flex-col gap-px">
          {data.cards.slice(0, 10).map((card, index) => (
            <div
              key={index}
              className="flex bg-[#0F0F0F] hover:bg-[#141414] 
                        transition-all duration-300 group
                        border-b border-[#1A1A1A] last:border-b-0"
            >
              {/* رقم الترتيب — ضخم وشفاف (luxury style) */}
              <div className="w-[70px] md:w-[90px] shrink-0 flex items-center justify-center 
                             relative overflow-hidden">
                <span className="text-[48px] md:text-[56px] font-black text-[#1A1A1A] leading-none select-none
                               group-hover:text-[#C9A84C]/10 transition-colors duration-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="absolute text-[#C9A84C] text-[10px] font-black tracking-wider">
                  #{index + 1}
                </span>
              </div>

              {/* صورة المنتج */}
              <div className="relative w-[80px] md:w-[95px] shrink-0 my-3 overflow-hidden rounded-lg bg-[#1C1C1C]">
                <img
                  src={card.image}
                  alt={card.mainTitle}
                  className="w-full h-full object-cover aspect-[2/3] group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* تفاصيل المنتج */}
              <div className="flex-1 p-4 flex flex-col justify-center">
                <h3 className="text-[#D4CCC0] font-semibold text-[13px] md:text-sm line-clamp-2 leading-snug mb-2 tracking-wide">
                  {card.mainTitle}
                </h3>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#C9A84C]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[#E8E0D0] text-[11px] font-semibold">{card.rating || "5.0"}</span>
                    <span className="text-[#4A4540] text-[10px]">({card.reviewsCount || "—"})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E8E0D0] font-medium text-[12px]">{card.price || "متوفر"}</span>
                  <Link
                    href={card.linkUrl || "/"}
                    className="text-[#8A8070] hover:text-[#C9A84C] text-[11px] font-medium 
                              tracking-wider uppercase transition-colors duration-300 
                              flex items-center gap-1"
                  >
                    تفاصيل
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* زر عرض الكل */}
        {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
          <div className="mt-10 flex justify-center">
            <Link
              href={data.linkUrl || data.viewAllLink}
              className="text-[#8A8070] hover:text-[#C9A84C] text-xs font-medium tracking-[0.2em] uppercase
                        py-3 px-10 border border-[#2A2A2A] hover:border-[#C9A84C]/30
                        transition-all duration-400 rounded-none"
            >
              عرض الكل
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

// --- 5. قسم شريط المنتجات المتحرك (props محفوظة بالكامل) ---
export const MarqueeProducts = ({ data }) => {
  if (!data || !data.products || data.products.length === 0) return null;
  const duplicatedProducts = [...data.products, ...data.products, ...data.products];

  return (
    <section className="bg-[#0A0A0A] pt-12 pb-14 border-y border-[#1A1A1A] overflow-hidden">
      <div className="max-w-[1400px] mx-auto relative px-4 text-right" dir="rtl">

        {/* الهيدر */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[#6B6358] text-[10px] tracking-[0.35em] uppercase mb-2">التشكيلة</p>
            <div className="flex items-center gap-3">
              <div className="w-px h-7 bg-gradient-to-b from-[#C9A84C] to-transparent"></div>
              <h2 className="text-xl md:text-2xl font-black text-[#E8E0D0] tracking-wide">
                {data.title || "تسوق التشكيلة الجديدة"}
              </h2>
            </div>
            {data.subTitle && (
              <p className="text-[#6B6358] text-[11px] mt-2 pr-4">{data.subTitle}</p>
            )}
          </div>

          {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
            <Link
              href={data.linkUrl || data.viewAllLink}
              className="text-[#8A8070] hover:text-[#C9A84C] text-xs font-medium 
                        tracking-[0.2em] uppercase flex items-center gap-1.5 
                        transition-colors duration-300 pb-1 border-b border-transparent hover:border-[#C9A84C]/30"
            >
              عرض الكل
            </Link>
          )}
        </div>

        <div className="luxury-divider mb-8"></div>

        {/* الشريط المتحرك */}
        <div className="relative overflow-hidden" dir="ltr">
          <div className="flex animate-marquee-infinite pause-on-hover items-start"
               style={{ animationDuration: '40s', width: 'max-content', gap: '20px' }}>
            {duplicatedProducts.map((product, index) => (
              <Link
                key={index}
                href={product.linkUrl || "#"}
                className="w-[155px] md:w-[200px] flex-none group block"
              >
                <div className="relative aspect-[3/4] w-full bg-[#1C1C1C] 
                               overflow-hidden mb-3 ring-1 ring-white/5
                               group-hover:ring-[#C9A84C]/20 transition-all duration-500">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {product.badge && (
                    <span className="absolute top-2.5 right-2.5 bg-[#C9A84C] text-black 
                                    text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                      {product.badge}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="absolute top-2.5 left-2.5 bg-[#1A1A1A] text-[#E8E0D0] 
                                    text-[9px] font-medium px-2 py-0.5 border border-[#333] uppercase tracking-wider">
                      تخفيض
                    </span>
                  )}
                </div>

                <div className="text-right px-0.5" dir="rtl">
                  <h3 className="text-[#D4CCC0] font-medium text-[12px] md:text-sm line-clamp-1 tracking-wide">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#C9A84C] font-semibold text-[12px] md:text-[13px]">
                      {product.price} LE
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-[#4A4540] line-through text-[10px]">
                        {product.compareAtPrice} LE
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 6. قسم الأكثر مبيعاً (props محفوظة بالكامل) ---
export const BestSellersSection = ({ data }) => {
  if (!data || !data.products || data.products.length === 0) return null;

  const heroProduct = data.products[0];
  const gridProducts = data.products.slice(1, 5);

  return (
    <section className="bg-[#0D0D0D] py-14 border-y border-[#1A1A1A]">
      {/* الهيدر */}
      <div className="flex items-end justify-between px-4 mb-10 max-w-[1400px] mx-auto" dir="rtl">
        <div>
          <p className="text-[#6B6358] text-[10px] tracking-[0.35em] uppercase mb-2">الأكثر مبيعاً</p>
          <div className="flex items-center gap-3">
            <div className="w-px h-7 bg-gradient-to-b from-[#C9A84C] to-transparent"></div>
            <h2 className="text-xl md:text-2xl font-black text-[#E8E0D0] tracking-wide">
              {data.title || "الأكثر مبيعاً"}
            </h2>
          </div>
          {data.subTitle && (
            <p className="text-[#6B6358] text-[11px] mt-2 pr-4">{data.subTitle}</p>
          )}
        </div>

        {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
          <Link
            href={data.linkUrl || data.viewAllLink}
            className="text-[#8A8070] hover:text-[#C9A84C] text-xs font-medium 
                      tracking-[0.2em] uppercase flex items-center gap-1.5 
                      transition-colors duration-300 pb-1 border-b border-transparent hover:border-[#C9A84C]/30"
          >
            عرض الكل
          </Link>
        )}
      </div>

      <div className="luxury-divider mb-10 mx-4"></div>

      {/* شبكة المنتجات */}
      <div className="flex flex-col md:flex-row gap-5 px-4 max-w-[1400px] mx-auto" dir="rtl">

        {/* المنتج البطل */}
        {heroProduct && (
          <div className="md:w-1/3 w-full relative group card-lift">
            {/* شارة #1 */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
              <span className="text-[#C9A84C] text-[9px] font-black tracking-[0.3em] uppercase">الأكثر طلباً</span>
              <span className="text-[#C9A84C] font-black text-2xl leading-none">#1</span>
            </div>

            <Link href={heroProduct.linkUrl || "#"} className="block h-full">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1C1C1C] ring-1 ring-white/5 group-hover:ring-[#C9A84C]/20 transition-all duration-500">
                <img src={heroProduct.image} alt={heroProduct.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-70"></div>
                <div className="absolute bottom-5 right-5 left-5">
                  <h3 className="text-[#E8E0D0] font-bold text-lg line-clamp-2 leading-snug mb-2">{heroProduct.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[#C9A84C] font-black text-xl">{heroProduct.price} LE</span>
                    {heroProduct.compareAtPrice && (
                      <span className="text-[#4A4540] line-through text-sm">{heroProduct.compareAtPrice} LE</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* باقي المنتجات */}
        <div className="md:w-2/3 w-full grid grid-cols-2 gap-3 md:gap-4">
          {gridProducts.map((p, index) => (
            <div key={index} className="group card-lift">
              <Link href={p.linkUrl || "#"} className="block">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1C1C1C] 
                               ring-1 ring-white/5 group-hover:ring-[#C9A84C]/20 transition-all duration-500">
                  <img src={p.image} alt={p.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 to-transparent"></div>
                  <div className="absolute bottom-3 right-3 left-3">
                    <h3 className="text-[#D4CCC0] font-semibold text-[12px] line-clamp-2 leading-snug">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#C9A84C] font-semibold text-[13px]">{p.price} LE</span>
                      {p.compareAtPrice && (
                        <span className="text-[#4A4540] line-through text-[10px]">{p.compareAtPrice} LE</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. قسم العروض الحصرية (props محفوظة بالكامل) ---
export const ExclusiveOffers = ({ data }) => {
  if (!data || !data.products || data.products.length === 0) return null;
  const premiumProducts = data.products.slice(0, 4);

  return (
    <section className="bg-[#060606] py-20 border-y border-[#1A1A1A] relative overflow-hidden">
      {/* إضاءة خلفية ذهبية خفيفة جداً */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] 
                     bg-[#C9A84C] opacity-[0.025] blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-4 relative z-10" dir="rtl">

        {/* الهيدر — متمركز وفاخر */}
        <div className="text-center mb-14 flex flex-col items-center">
          <p className="text-[#6B6358] text-[10px] tracking-[0.4em] uppercase mb-4">مجموعة مختارة</p>
          <h2 className="text-2xl md:text-4xl font-black text-[#E8E0D0] tracking-tight uppercase font-sans-luxury">
            {data.title || "عروض حصرية"}
          </h2>
          <div className="luxury-divider w-24 mt-5"></div>
          {data.subTitle && (
            <p className="text-[#6B6358] text-sm mt-5 max-w-md mx-auto leading-relaxed">{data.subTitle}</p>
          )}
        </div>

        {/* شبكة الكروت */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumProducts.map((p, index) => (
            <Link
              key={index}
              href={p.linkUrl || "#"}
              className="group relative block aspect-[4/5] overflow-hidden bg-[#111] ring-1 ring-white/5 
                        hover:ring-[#C9A84C]/25 transition-all duration-700 card-lift"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
              {/* gradient أعمق وأكثر تحكماً */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/30 to-transparent 
                             opacity-75 group-hover:opacity-90 transition-opacity duration-500"></div>

              {/* Badge */}
              {p.compareAtPrice && (
                <div className="absolute top-4 left-4 bg-[#0D0D0D]/80 backdrop-blur-md 
                               text-[#C9A84C] text-[9px] font-medium px-3 py-1.5 
                               border border-[#C9A84C]/20 uppercase tracking-[0.2em]">
                  عرض خاص
                </div>
              )}

              {/* تفاصيل المنتج */}
              <div className="absolute bottom-0 inset-x-0 p-5 
                             translate-y-3 group-hover:translate-y-0 
                             transition-transform duration-500">
                <h3 className="text-[#E8E0D0] font-semibold text-base leading-snug line-clamp-2 mb-3">
                  {p.name}
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[#C9A84C] font-black text-lg">{p.price} LE</span>
                  {p.compareAtPrice && (
                    <span className="text-[#4A4540] line-through text-sm">{p.compareAtPrice} LE</span>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-[#C9A84C]/40 to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-500 mb-3"></div>

                <span className="text-[#8A8070] group-hover:text-[#C9A84C] text-[11px] font-medium 
                               tracking-[0.25em] uppercase opacity-0 group-hover:opacity-100 
                               transition-all duration-500 delay-100">
                  تسوق الآن →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* زر عرض الكل */}
        {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
          <div className="mt-12 flex justify-center">
            <Link
              href={data.linkUrl || data.viewAllLink}
              className="text-[#8A8070] hover:text-[#C9A84C] text-xs font-medium 
                        tracking-[0.25em] uppercase py-4 px-12
                        border border-[#2A2A2A] hover:border-[#C9A84C]/30
                        transition-all duration-400"
            >
              عرض الكل
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

// --- 8. قسم أبرز المجموعات (props محفوظة بالكامل) ---
export const MasterpieceCollections = ({ data }) => {
  const collections = data?.linkedCollections || [];
  if (!collections || collections.length === 0) return null;

  return (
    <section className="bg-[#040404] py-20" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">

        {/* الهيدر */}
        <div className="flex flex-col mb-14">
          <p className="text-[#6B6358] text-[10px] tracking-[0.4em] uppercase mb-4">استكشف</p>
          <div className="flex items-center gap-4">
            <div className="w-px h-12 bg-gradient-to-b from-[#C9A84C] via-[#C9A84C]/50 to-transparent"></div>
            <h2 className="text-3xl md:text-5xl font-black text-[#E8E0D0] uppercase tracking-tighter font-sans-luxury">
              {data.title || "استكشف المجموعات"}
            </h2>
          </div>
          {data.subTitle && (
            <p className="text-[#6B6358] text-sm mt-4 max-w-xl leading-relaxed pr-5">
              {data.subTitle}
            </p>
          )}
          <div className="luxury-divider mt-8"></div>
        </div>

        {/* شبكة المجموعات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((col, index) => (
            <Link
              key={index}
              href={`/collections/${col.slug || col.id}`}
              className="group relative overflow-hidden ring-1 ring-white/5 
                        hover:ring-[#C9A84C]/20 transition-all duration-700"
              style={{ height: index === 0 ? '520px' : '460px' }}
            >
              {/* رقم شفاف */}
              <span className="absolute top-4 left-5 text-[80px] md:text-[100px] font-black 
                             text-white/[0.04] leading-none select-none 
                             group-hover:text-[#C9A84C]/[0.06] transition-colors duration-700 z-10">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* الصورة */}
              <img
                src={col.image || "/placeholder.jpg"}
                alt={col.customName || col.name}
                className="w-full h-full object-cover 
                          grayscale-[20%] group-hover:grayscale-0 
                          group-hover:scale-105 transition-all duration-1000"
              />

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/30 to-transparent"></div>

              {/* النصوص */}
              <div className="absolute bottom-8 right-8 left-8 text-right z-20">
                <h3 className="text-[#E8E0D0] text-xl md:text-2xl font-black mb-3 
                              transform group-hover:-translate-y-2 transition-transform duration-500 tracking-wide">
                  {col.customName || col.name}
                </h3>

                {/* خط ذهبي متحرك */}
                <div className="h-px w-0 bg-gradient-to-r from-[#C9A84C] to-transparent 
                               group-hover:w-full transition-all duration-700"></div>

                <p className="text-[#6B6358] text-xs mt-3 
                             opacity-0 group-hover:opacity-100 
                             transition-opacity duration-700 delay-100 
                             line-clamp-2 tracking-wider">
                  {col.description || "تصفح المجموعة كاملة"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};