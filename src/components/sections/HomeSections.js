"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

// ==========================================================================
// LUXURY REDESIGN v2
// ✅ ألوان الموقع الأصلية محفوظة (#F5C518, #5799ef)
// ✅ بدون عناوين صغيرة مضافة — الـ subTitle بتاعت الأدمن فقط
// ✅ خط Cairo للعناوين + Tajawal للفرعي
// ✅ الخط الذهبي متوسط مع العنوان والفرعي
// ✅ TopTen كارت معاد تصميمه بالكامل مع كل العناصر الأصلية
// ✅ كل الـ props والـ data structure محفوظة بالكامل
// ==========================================================================

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');

    @keyframes kenburns {
      0% { transform: scale(1); }
      100% { transform: scale(1.08); }
    }
    @keyframes marquee-infinite {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
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

    /* ===== Typography ===== */
    .section-title {
      font-family: 'Cairo', sans-serif;
      font-weight: 800;
    }
    .section-subtitle {
      font-family: 'Tajawal', sans-serif;
      font-weight: 400;
    }

    /* ===== Luxury divider ===== */
    .luxury-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #F5C51830, transparent);
    }

    /* ===== Card hover lift ===== */
    .card-lift {
      transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94),
                  box-shadow  0.4s cubic-bezier(0.25,0.46,0.45,0.94);
    }
    .card-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(245,197,24,0.15);
    }
  `}</style>
);

// ==========================================================================
// SECTION HEADER HELPER
// الخط الذهبي الرأسي يتمركز تماماً مع العنوان (+ الفرعي لو موجود)
// ==========================================================================
const SectionHeading = ({ title, subTitle, link, linkLabel = "عرض الكل" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">

    {/* اليسار: الخط + العناوين */}
    <div className="flex items-center gap-3">
      {/* الخط الذهبي — ارتفاعه يتكيف مع العنوان ± الفرعي */}
      <div
        className="w-[3px] rounded-sm bg-[#F5C518] shrink-0 self-stretch"
        style={{ minHeight: subTitle ? '48px' : '32px' }}
      />
      <div>
        <h2 className="section-title text-lg md:text-2xl text-white tracking-wide leading-tight">
          {title}
        </h2>
        {subTitle && (
          <p className="section-subtitle text-gray-400 text-[11px] md:text-xs mt-1 leading-relaxed">
            {subTitle}
          </p>
        )}
      </div>
    </div>

    {/* اليمين: زر عرض الكل */}
    {link && (
      <Link
        href={link}
        className="section-subtitle text-[#F5C518] text-xs md:text-sm font-medium
                   flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity shrink-0"
      >
        {linkLabel}
        <span className="text-base leading-none">›</span>
      </Link>
    )}
  </div>
);

// ==========================================================================
// 3. FEATURED TODAY
// ==========================================================================
export const FeaturedToday = ({ data }) => {
  const scrollRef   = useRef(null);
  const [showLeft,  setShowLeft]   = useState(true);
  const [showRight, setShowRight]  = useState(false);
  const [expandedDeck, setExpandedDeck] = useState(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const s = Math.abs(scrollLeft);
    setShowRight(s > 5);
    setShowLeft(s < scrollWidth - clientWidth - 5);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  const toggleDeck = (i, e) => {
    e.preventDefault(); e.stopPropagation();
    setExpandedDeck(expandedDeck === i ? null : i);
  };

  useEffect(() => { handleScroll(); }, [data]);

  if (!data?.cards) return null;

  return (
    <section className="bg-[#181818] pt-2 pb-1 border-t border-[#2a2a2a]">
      <GlobalStyles />
      <div className="max-w-[1400px] mx-auto relative px-4 text-right">

        {/* ---- العنوان ---- */}
        <div className="flex items-center gap-3 pt-8 pb-1 mb-1" dir="rtl">
          <div
            className="w-[3px] rounded-sm bg-[#F5C518] shrink-0"
            style={{ height: data.subTitle ? '48px' : '32px' }}
          />
          <div>
            <h2 className="section-title text-lg md:text-xl text-[#F5C518] tracking-wide uppercase">
              {data.title || "Featured Today"}
            </h2>
            {data.subTitle && (
              <p className="section-subtitle text-gray-400 text-[11px] mt-0.5">{data.subTitle}</p>
            )}
          </div>
        </div>

        <div className="luxury-divider my-4" />

        {/* ---- السلايدر ---- */}
        <div className="relative group/slider">

          {/* أسهم */}
          {[
            { d: 'right', show: showRight, pos: 'right-1', path: "M9 5l7 7-7 7" },
            { d: 'left',  show: showLeft,  pos: 'left-1',  path: "M15 19l-7-7 7-7" },
          ].map(({ d, show, pos, path }) => (
            <button
              key={d}
              onClick={() => scroll(d)}
              className={`absolute top-1/2 -translate-y-1/2 ${pos} z-30
                         w-9 h-12 flex items-center justify-center
                         bg-black/50 backdrop-blur-sm
                         border border-white/10 hover:border-[#F5C518]/40
                         text-white/70 hover:text-[#F5C518]
                         rounded transition-all duration-300
                         ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
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
              const isExpanded  = expandedDeck === mIndex;
              const hasSubCards = mainCard.subCards?.length > 0;

              return (
                <div key={mIndex} className="flex items-stretch snap-start">

                  {/* ---- الكارت الرئيسي ---- */}
                  <div className="relative z-50 flex flex-col gap-2 pb-2">
                    <Link href={mainCard.linkUrl || "#"} className="min-w-[150px] md:min-w-[185px] block relative card-lift">
                      <div className={`relative aspect-[2/3] overflow-hidden bg-[#222]
                                      ring-1 ring-white/5 hover:ring-[#F5C518]/20
                                      transition-all duration-500
                                      ${isExpanded && hasSubCards ? 'rounded-none' : 'rounded-xl'}`}>
                        <img src={mainCard.image} alt={mainCard.mainTitle} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none" />

                        {mainCard.badgeType && mainCard.badgeType !== 'none' && (
                          <div className="absolute bottom-3 right-3 flex flex-row-reverse items-center gap-1
                                         text-white font-medium text-[9px] z-10
                                         bg-black/60 backdrop-blur-sm px-2 py-1
                                         border border-white/10 uppercase tracking-wider">
                            {mainCard.badgeType === 'list' ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

                    <div className="px-1 text-right mt-1 flex justify-between items-start gap-2">
                      <div>
                        <h3 className="section-title text-white text-[13px] font-bold line-clamp-2 leading-snug">
                          {mainCard.mainTitle}
                        </h3>
                        <span className="section-subtitle text-[#5799ef] text-[10px]">{mainCard.linkText}</span>
                      </div>
                      {hasSubCards && !isExpanded && (
                        <button
                          onClick={(e) => toggleDeck(mIndex, e)}
                          className="bg-[#222] hover:bg-[#2a2a2a] border border-[#3a3a3a]
                                     hover:border-[#F5C518]/30 text-white hover:text-[#F5C518]
                                     p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ---- الكروت الفرعية ---- */}
                  {hasSubCards && mainCard.subCards.map((subCard, sIndex) => {
                    const isLast = sIndex === mainCard.subCards.length - 1;
                    return (
                      <Link
                        key={`${mIndex}-${sIndex}`}
                        href={subCard.linkUrl || "#"}
                        className={`min-w-[150px] md:min-w-[185px] flex flex-col gap-2 cursor-pointer pb-2
                                   transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-right
                                   ${isExpanded ? 'mr-0 opacity-100 scale-100' : '-mr-[150px] md:-mr-[185px] opacity-0 scale-95 pointer-events-none'}`}
                        style={{ zIndex: 40 - sIndex }}
                      >
                        <div className="relative aspect-[2/3] rounded-none overflow-hidden bg-[#222]
                                       shadow-[-5px_0_20px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                          <img src={subCard.image} alt={subCard.mainTitle} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none" />
                        </div>

                        <div className={`px-1 text-right mt-1 flex justify-between items-start gap-2
                                        transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                          <div>
                            <h3 className="section-title text-white text-[13px] font-bold line-clamp-2 leading-snug">
                              {subCard.mainTitle}
                            </h3>
                            <span className="section-subtitle text-[#5799ef] text-[10px]">{subCard.linkText}</span>
                          </div>
                          {isExpanded && isLast && (
                            <button
                              onClick={(e) => toggleDeck(mIndex, e)}
                              className="bg-[#222] hover:bg-[#2a2a2a] border border-[#3a3a3a]
                                         hover:border-[#F5C518]/30 text-[#F5C518]
                                         p-1.5 rounded-full transition-all duration-300 ml-1 shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

// ==========================================================================
// 4. TOP TEN PRODUCTS — كارت معاد تصميمه بالكامل مع كل العناصر الأصلية
// ==========================================================================
export const TopTenProducts = ({ data }) => {
  if (!data?.cards?.length) return null;

  return (
    <section className="bg-[#0f0f0f] pt-2 pb-10 border-t border-[#2a2a2a]">
      <div className="max-w-[800px] mx-auto relative px-4" dir="rtl">

        {/* ---- العنوان ---- */}
        <SectionHeading title={data.title || "أفضل 10 منتجات"} subTitle={data.subTitle} />
        <div className="luxury-divider mb-6 mx-4" />

        {/* ---- القائمة ---- */}
        <div className="flex flex-col gap-3">
          {data.cards.slice(0, 10).map((card, index) => (

            /* الكارت الكامل */
            <div
              key={index}
              className="flex bg-[#1a1a1a] border border-[#2a2a2a]
                         hover:border-[#F5C518]/25 transition-all duration-300
                         rounded-xl overflow-hidden group shadow-lg"
            >

              {/* ======= العمود الأيمن: الصورة ======= */}
              <div className="relative w-[100px] md:w-[120px] shrink-0 bg-[#222]">
                <img
                  src={card.image}
                  alt={card.mainTitle}
                  className="w-full h-full object-cover aspect-[2/3]
                             group-hover:scale-105 transition-transform duration-500"
                />
                {/* Bookmark علامة + */}
                <div
                  className="absolute top-0 right-0 w-8 h-10
                             bg-black/70 backdrop-blur-sm
                             flex items-start justify-center pt-1.5"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>

              {/* ======= العمود الأيسر: التفاصيل ======= */}
              <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-h-[140px]">

                {/* --- الجزء العلوي: الرانك + الاسم + التصنيف --- */}
                <div>
                  {/* شارة الترتيب الزرقاء (الشكل الأصلي) */}
                  <div className="mb-2">
                    <span
                      className="inline-block bg-[#1f75d9] text-white
                                 text-xs md:text-sm font-black px-3 py-0.5
                                 rounded-sm"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0% 100%)' }}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  {/* اسم المنتج */}
                  <h3 className="section-title text-white font-bold text-sm md:text-base
                                 line-clamp-2 leading-snug mb-1">
                    {card.mainTitle}
                  </h3>

                  {/* السعر + التصنيف */}
                  <div className="flex items-center gap-3 text-[11px] md:text-xs text-gray-400 mb-2">
                    <span className="text-white font-semibold section-subtitle">
                      {card.price || "متوفر الآن"}
                    </span>
                    {card.category && <span className="section-subtitle">{card.category}</span>}
                  </div>
                </div>

                {/* --- الجزء السفلي: التقييم + الأزرار --- */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-1">

                  {/* التقييم + زر قيّم */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F5C518]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-white text-[12px] font-bold section-subtitle">
                        {card.rating || "5.0"}
                      </span>
                      <span className="text-gray-500 text-[10px] section-subtitle">
                        ({card.reviewsCount || "—"})
                      </span>
                    </div>

                    <button className="flex items-center gap-1 text-[#5799ef] hover:bg-[#1f3a5f]/40
                                      px-2 py-0.5 rounded transition-colors text-[11px] font-medium section-subtitle">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      قيّم
                    </button>
                  </div>

                  {/* زر عرض التفاصيل */}
                  <Link
                    href={card.linkUrl || "/"}
                    className="flex items-center gap-1 text-[#5799ef] hover:text-white
                               transition-colors text-[11px] md:text-xs font-bold section-subtitle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    عرض التفاصيل
                  </Link>

                </div>
              </div>
            </div>

          ))}
        </div>

        {/* زر عرض الكل */}
        {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
          <div className="mt-8 flex justify-center">
            <Link
              href={data.linkUrl || data.viewAllLink}
              className="section-title w-full text-center
                         bg-[#1e1e1e] hover:bg-[#252525]
                         text-[#5799ef] font-bold py-3 px-8
                         rounded-full transition-colors text-sm border border-[#333]
                         hover:border-[#F5C518]/20"
            >
              عرض الكل
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

// ==========================================================================
// 5. MARQUEE PRODUCTS
// ==========================================================================
export const MarqueeProducts = ({ data }) => {
  if (!data?.products?.length) return null;
  const dup = [...data.products, ...data.products, ...data.products];

  return (
    <section className="bg-[#161616] pt-2 pb-2 border-y border-[#2a2a2a] overflow-hidden">
      <div className="max-w-[1400px] mx-auto relative px-4 text-right" dir="rtl">

        <SectionHeading
          title={data.title || "تسوق التشكيلة الجديدة"}
          subTitle={data.subTitle}
          link={data.linkUrl?.trim() || data.viewAllLink?.trim() || null}
        />
        <div className="luxury-divider mb-6 mx-4" />

        <div className="relative overflow-hidden" dir="ltr">
          <div
            className="flex animate-marquee-infinite pause-on-hover items-start"
            style={{ animationDuration: '40s', width: 'max-content', gap: '18px' }}
          >
            {dup.map((product, index) => (
              <Link
                key={index}
                href={product.linkUrl || "#"}
                className="w-[155px] md:w-[200px] flex-none group block"
              >
                <div className="relative aspect-[3/4] w-full bg-[#222]
                               overflow-hidden mb-3
                               ring-1 ring-white/5
                               group-hover:ring-[#F5C518]/20
                               transition-all duration-400">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover
                               group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-2.5 right-2.5
                                    bg-[#F5C518] text-black
                                    text-[9px] font-black px-2 py-0.5
                                    uppercase tracking-wider shadow-md z-10">
                      {product.badge}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="absolute top-2.5 left-2.5
                                    bg-red-600 text-white
                                    text-[9px] font-black px-2 py-0.5
                                    uppercase tracking-wider shadow-md z-10">
                      تخفيض
                    </span>
                  )}
                </div>

                <div className="text-right px-0.5" dir="rtl">
                  <h3 className="section-title text-white font-semibold text-[12px] md:text-sm line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="section-subtitle text-[#5799ef] font-bold text-[12px] md:text-[13px]">
                      {product.price} LE
                    </span>
                    {product.compareAtPrice && (
                      <span className="section-subtitle text-gray-500 line-through text-[10px]">
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

// ==========================================================================
// 6. BEST SELLERS
// ==========================================================================
export const BestSellersSection = ({ data }) => {
  if (!data?.products?.length) return null;

  const heroProduct  = data.products[0];
  const gridProducts = data.products.slice(1, 5);

  return (
    <section className="bg-[#181818] py-2 border-y border-[#2a2a2a]">

      <SectionHeading
        title={data.title || "الأكثر مبيعاً"}
        subTitle={data.subTitle}
        link={data.linkUrl?.trim() || data.viewAllLink?.trim() || null}
      />
      <div className="luxury-divider mb-8 mx-4" />

      <div className="flex flex-col md:flex-row gap-4 px-4 max-w-[1400px] mx-auto" dir="rtl">

        {/* المنتج البطل */}
        {heroProduct && (
          <div className="md:w-1/3 w-full relative group card-lift">
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-[#F5C518] text-black
                               text-[9px] font-black px-2.5 py-1
                               uppercase tracking-wider shadow-md">
                الأكثر طلباً #1
              </span>
            </div>
            <Link href={heroProduct.linkUrl || "#"} className="block h-full">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#222]
                             ring-1 ring-white/5 group-hover:ring-[#F5C518]/20
                             transition-all duration-500">
                <img src={heroProduct.image} alt={heroProduct.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/80 to-transparent" />
                <div className="absolute bottom-5 right-4 left-4">
                  <h3 className="section-title text-white font-bold text-base md:text-lg
                                 line-clamp-2 leading-snug mb-2">
                    {heroProduct.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="section-subtitle text-[#5799ef] font-black text-lg">
                      {heroProduct.price} LE
                    </span>
                    {heroProduct.compareAtPrice && (
                      <span className="section-subtitle text-gray-500 line-through text-sm">
                        {heroProduct.compareAtPrice} LE
                      </span>
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
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#222]
                               ring-1 ring-white/5 group-hover:ring-[#F5C518]/15
                               transition-all duration-500">
                  <img src={p.image} alt={p.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/80 to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3">
                    <h3 className="section-title text-white font-semibold text-[12px] line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="section-subtitle text-[#5799ef] font-bold text-[13px]">
                        {p.price} LE
                      </span>
                      {p.compareAtPrice && (
                        <span className="section-subtitle text-gray-500 line-through text-[10px]">
                          {p.compareAtPrice} LE
                        </span>
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

// ==========================================================================
// 7. EXCLUSIVE OFFERS
// ==========================================================================
export const ExclusiveOffers = ({ data }) => {
  if (!data?.products?.length) return null;
  const premiumProducts = data.products.slice(0, 4);

  return (
    <section className="bg-[#0f0f0f] py-4 border-y border-[#2a2a2a] relative overflow-hidden">
      {/* إضاءة خلفية خفيفة */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
                     bg-[#F5C518] opacity-[0.025] blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 relative z-10" dir="rtl">

        <SectionHeading
          title={data.title || "عروض حصرية"}
          subTitle={data.subTitle}
          link={data.linkUrl?.trim() || data.viewAllLink?.trim() || null}
        />
        <div className="luxury-divider mb-8 mx-4" />

        {/* شبكة الكروت */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4">
          {premiumProducts.map((p, index) => (
            <Link
              key={index}
              href={p.linkUrl || "#"}
              className="group relative block aspect-[4/5] overflow-hidden bg-[#1a1a1a]
                        ring-1 ring-white/5
                        hover:ring-[#F5C518]/30
                        hover:shadow-[0_0_30px_rgba(245,197,24,0.08)]
                        transition-all duration-500 card-lift"
            >
              <img
                src={p.image} alt={p.name}
                className="w-full h-full object-cover
                           group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t
                             from-black via-black/45 to-transparent
                             opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

              {p.compareAtPrice && (
                <div className="absolute top-4 left-4
                               bg-red-600/90 backdrop-blur-sm
                               text-white text-[9px] font-black
                               px-3 py-1.5 border border-red-400/20
                               uppercase tracking-wider">
                  عرض خاص
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 p-5
                             translate-y-3 group-hover:translate-y-0
                             transition-transform duration-400">
                <h3 className="section-title text-white font-bold text-base
                               leading-snug line-clamp-2 mb-2">
                  {p.name}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="section-subtitle text-[#F5C518] font-black text-xl">
                    {p.price} LE
                  </span>
                  {p.compareAtPrice && (
                    <span className="section-subtitle text-gray-400 line-through text-sm">
                      {p.compareAtPrice} LE
                    </span>
                  )}
                </div>
                <div className="h-px bg-gradient-to-r from-[#F5C518]/40 to-transparent
                               opacity-0 group-hover:opacity-100
                               transition-opacity duration-400 mb-3" />
                <span className="section-subtitle inline-flex items-center gap-2
                               text-white text-[11px] font-medium tracking-wider uppercase
                               opacity-0 group-hover:opacity-100
                               transition-opacity duration-400 delay-75">
                  تسوق الآن
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* زر عرض الكل */}
        {(data.linkUrl?.trim() || data.viewAllLink?.trim()) && (
          <div className="mt-10 flex justify-center px-4">
            <Link
              href={data.linkUrl || data.viewAllLink}
              className="group inline-flex items-center gap-2
                         bg-transparent text-white section-title font-bold
                         py-3 px-10 transition-all duration-300
                         border border-[#F5C518]/30 hover:border-[#F5C518]
                         hover:bg-[#F5C518]/8 text-sm md:text-base"
            >
              عرض الكل
              <svg xmlns="http://www.w3.org/2000/svg"
                   className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
};

// ==========================================================================
// 8. MASTERPIECE COLLECTIONS
// ==========================================================================
export const MasterpieceCollections = ({ data }) => {
  const collections = data?.linkedCollections || [];
  if (!collections.length) return null;

  return (
    <section className="bg-[#0a0a0a] py-4" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">

        <SectionHeading
          title={data.title || "استكشف المجموعات"}
          subTitle={data.subTitle}
        />
        <div className="luxury-divider mb-10 mx-4" />

        {/* شبكة المجموعات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {collections.map((col, index) => (
            <Link
              key={index}
              href={`/collections/${col.slug || col.id}`}
              className="group relative overflow-hidden
                        ring-1 ring-white/5 hover:ring-[#F5C518]/20
                        transition-all duration-700"
              style={{ height: index === 0 ? '500px' : '440px' }}
            >
              {/* رقم شفاف */}
              <span className="absolute top-4 left-5
                              text-[80px] md:text-[100px] font-black
                              text-white/[0.04] leading-none select-none
                              group-hover:text-[#F5C518]/[0.07]
                              transition-colors duration-700 z-10
                              section-title">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* الصورة */}
              <img
                src={col.image || "/placeholder.jpg"}
                alt={col.customName || col.name}
                className="w-full h-full object-cover
                           grayscale-[20%] group-hover:grayscale-0
                           group-hover:scale-105
                           transition-all duration-1000"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/35 to-transparent" />

              {/* النصوص */}
              <div className="absolute bottom-8 right-8 left-8 text-right z-20">
                <h3 className="section-title text-white text-xl md:text-2xl font-black mb-3
                              transform group-hover:-translate-y-2 transition-transform duration-500">
                  {col.customName || col.name}
                </h3>
                {/* خط ذهبي */}
                <div className="h-px w-0 bg-gradient-to-r from-[#F5C518] to-transparent
                               group-hover:w-full transition-all duration-600" />
                <p className="section-subtitle text-gray-400 text-xs mt-3
                             opacity-0 group-hover:opacity-100
                             transition-opacity duration-600 delay-100 line-clamp-2">
                  {col.description || "تصفح المجموعة كاملة الآن ›"}
                </p>
              </div>

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};