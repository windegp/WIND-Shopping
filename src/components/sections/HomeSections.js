"use client";
import React from 'react';
import Link from 'next/link';
import ProductCard from "../products/ProductCard";
import CollectionsSection from "./CollectionsSection";

// --- 1. الأنماط والحركات (تم نقلها بالحرف من الكود الأصلي) ---
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

// --- 2. مكون الهيدر (SectionHeader) ---
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

// --- 3. قسم Featured Today (IMDB Style) ---
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

// --- 4. قسم تسوق التشكيلة الجديدة (Marquee) ---
export const NewArrivalsMarquee = ({ data }) => {
  const products = data?.products || [];
  return (
    <section className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
      <SectionHeader title={data?.title || "تسوق التشكيلة الجديدة"} subTitle={data?.subTitle || "أناقة WIND في كل خطوة"} />
      <div className="relative flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing" dir="ltr">
        <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
          {[...products, ...products].map((product, index) => (
            <div key={`${product.id}-${index}`} className="min-w-[200px] md:min-w-[250px] opacity-80 hover:opacity-100 transition-opacity">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 5. قسم الأكثر مبيعاً (Best Sellers) ---
export const BestSellersSection = ({ data }) => {
  const products = data?.products || [];
  return (
    <section className="bg-[#181818] py-8 my-4 border-y border-[#222]">
      <div className="px-4 mb-4" dir="rtl">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight border-r-4 border-[#F5C518] pr-3">
            {data?.title || "الأكثر مبيعاً"}
          </h2>
      </div>
      <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
        {products[0] && (
          <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative group">
            <div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">الأكثر طلباً #1</div>
            <ProductCard {...products[0]} />
          </div>
        )}
        <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">
           {products.slice(1, 5).map(p => (
             <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>
           ))}
        </div>
      </div>
    </section>
  );
};

// --- 6. شريط الثقة (Trust Stats) ---
export const TrustBar = () => (
  <section className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
    <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
      <div className="group">
        <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4>
        <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">تقييم العملاء</p>
      </div>
      <div className="w-px h-10 bg-[#333]"></div>
      <div className="group">
        <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">+10k</h4>
        <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">قطعة بيعت</p>
      </div>
      <div className="w-px h-10 bg-[#333]"></div>
      <div className="group">
        <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">100%</h4>
        <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">ضمان الجودة</p>
      </div>
    </div>
  </section>
);

// --- 7. قسم آراء عائلة WIND ---
export const ReviewsMarquee = ({ data, onOpenModal }) => (
  <section className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222]">
    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right" dir="rtl">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">آراء عائلة WIND</h2>
          <p className="text-[#F5C518] text-sm font-bold mt-2 uppercase tracking-[0.2em]">أصوات حقيقية - تجارب صادقة</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-transparent border-2 border-[#F5C518] text-[#F5C518] px-8 py-3 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 rounded-sm"
        >
          + أضف تجربتك
        </button>
      </div>
      <div className="relative flex overflow-hidden pointer-events-none">
        <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
          {[...(data || []), ...(data || [])].map((rev, index) => (
            <div key={index} className="min-w-[300px] md:min-w-[400px] bg-[#121212] border border-[#333] p-6 rounded-lg hover:border-[#F5C518]/50 transition-all duration-500">
              <div className="flex items-center gap-4 mb-4" dir="rtl">
                {rev.userImage ? (
                  <img src={rev.userImage} className="w-12 h-12 rounded-full object-cover border-2 border-[#F5C518]/20" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black border border-[#333]">
                    {rev.userName?.charAt(0)}
                  </div>
                )}
                <div className="text-right">
                  <h4 className="text-white font-black text-sm">{rev.userName}</h4>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (<span key={i} className="text-[#F5C518] text-[10px]">★</span>))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed italic text-right" dir="rtl">"{rev.userComment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// --- 8. قسم المجلة (Magazine) ---
export const MagazineGrid = () => (
  <section className="px-4 max-w-[1280px] mx-auto my-16">
    <SectionHeader title="WIND Magazine" subTitle="مقالات في الأناقة" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
      {[{ id: 1, title: "كيفية تنسيق الفستان في الشتاء", tag: "نصائح" }, { id: 2, title: "رحلة WIND: من الفكرة إلى التصميم", tag: "قصتنا" }].map((art) => (
        <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden bg-[#222]">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
          <div className="absolute inset-0 bg-[#333] group-hover:scale-110 transition-transform duration-[2s]"></div> 
          <div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black via-black/60 to-transparent text-right">
            <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span>
            <h3 className="text-white font-black text-xl group-hover:text-[#F5C518] transition-colors">{art.title}</h3>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// --- 9. قسم قصة WIND (Story) ---
export const StorySection = () => (
  <section className="relative h-[400px] overflow-hidden border-t border-[#333]">
    <div className="absolute inset-0 bg-black/50 z-10"></div>
    <img 
      src="/images/story-bg.webp" 
      className="absolute inset-0 w-full h-full object-cover kenburns-bg" 
      alt="Story Background"
    />
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter mix-blend-screen opacity-90">قصة WIND</h2>
      <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed drop-shadow-md">
        "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."
      </p>
      <button className="mt-8 border border-white text-white px-8 py-3 text-sm font-bold hover:bg-white hover:text-black transition-all">
        اكتشف المزيد
      </button>
    </div>
  </section>
);

// --- 10. قسم تسوق حسب الفئة (Category Shop) ---
export const CategoryGrid = ({ dresses = [], blouses = [] }) => (
  <div className="bg-[#151515] py-12 border-t border-[#222]">
    <SectionHeader title="تسوق حسب الفئة" />
    <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
        <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
          <h3 className="text-2xl font-black text-white mb-4 z-10 relative">فساتين WIND</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">
             {dresses.slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}
          </div>
        </div>
        <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
          <h3 className="text-2xl font-black text-white mb-4 z-10 relative">البلوزات العصرية</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">
             {blouses.slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}
          </div>
        </div>
    </div>
  </div>
);

// --- 11. قسم التخفيضات (Discounts) ---
export const DiscountGrid = ({ products = [] }) => (
  <section className="py-12 px-4">
    <div className="bg-[#F5C518] text-black p-4 mb-6 text-center font-black text-xl uppercase tracking-widest">
      تخفيضات WIND الحصرية - لفترة محدودة
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.slice(0, 8).map((product) => <ProductCard key={product.id} {...product} />)}
    </div>
  </section>
);

// --- 12. مودال التقييم (Review Modal) ---
export const ReviewModal = ({ isOpen, onClose, onSubmit, newReview, setNewReview, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-[5px]">
      <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] shadow-[0_0_30px_rgba(245,197,24,0.1)] relative animate-[fadeIn_0.3s_ease-out]">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold text-xl">✕</button>
        <div className="p-8">
          <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
          <p className="text-gray-400 text-xs text-center mb-6">شاركنا تجربتك مع منتجات WIND</p>
          <form onSubmit={onSubmit} className="space-y-4 text-right">
            <input 
              type="text" placeholder="الاسم" 
              className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white focus:border-[#F5C518] outline-none rounded-sm"
              value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} 
            />
            <select 
              className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-[#F5C518] outline-none rounded-sm"
              value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
            >
              {[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}
            </select>
            <textarea 
              placeholder="اكتب تجربتك..." 
              className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white h-24 focus:border-[#F5C518] outline-none rounded-sm resize-none"
              value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} 
            />
            <div className="border border-dashed border-[#444] p-4 text-center rounded-sm cursor-pointer hover:bg-[#222] transition relative">
               <p className="text-gray-400 text-xs">{newReview.image ? newReview.image.name : "اضغط لرفع صورة (اختياري)"}</p>
               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewReview({...newReview, image: e.target.files[0]})} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm uppercase tracking-wide hover:bg-[#ffdb4d] transition-colors rounded-sm">
              {loading ? 'جاري النشر...' : 'نشر التقييم'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};