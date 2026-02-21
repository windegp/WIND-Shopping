"use client";
import React from 'react';
import Link from 'next/link';

// --- 1. الأنماط والحركات (تم الإبقاء عليها لحاجة التصميم لها) ---
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

// --- 3. قسم Featured Today (المميز اليوم) ---
export const FeaturedToday = ({ data }) => {
  if (!data || !data.cards) return null;
  return (
    <section className="my-10 px-4 max-w-[1400px] mx-auto border-t border-[#222] pt-8">
      <GlobalStyles />
      <h2 className="text-[#F5C518] text-2xl md:text-3xl font-bold mb-6" dir="ltr">
        {data.title || "Featured today"}
      </h2>
      <div className="flex overflow-x-auto pb-6 gap-4 scrollbar-hide snap-x" dir="ltr">
        {data.cards.map((card, index) => (
          <Link key={index} href={card.linkUrl || "#"} className="min-w-[280px] md:min-w-[360px] flex flex-col gap-2 snap-start group cursor-pointer">
            <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-[#222]">
              <img src={card.image} alt={card.mainTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#121212]/90 to-transparent pointer-events-none"></div>
              {card.badgeType === 'list' && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-md z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  List
                </div>
              )}
              {card.badgeType === 'photos' && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-md z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Photos
                </div>
              )}
            </div>
            <h3 className="text-white text-base md:text-lg font-normal line-clamp-2 mt-1 px-1">{card.mainTitle}</h3>
            <span className="text-[#5799ef] text-sm md:text-base font-semibold px-1">{card.linkText}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};