"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";

// --- المكون الأصلي الخاص بك (بنفس أحجام الخطوط والتنسيق الدقيق) ---
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10 font-cairo" dir="rtl">
    <div className="flex items-center gap-3">
      {/* الخط الأصفر الصغير والأنيق */}
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {/* زر عرض الكل الأصلي */}
    <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
      عرض الكل <span className="text-xl leading-none">›</span>
    </Link>
  </div>
);

export default function Home() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "homePage_v2"), (snap) => {
        if (snap.exists()) setSections(snap.data().sections || []);
        setLoading(false);
    });
    onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data(), image: d.data().images?.[0] || d.data().image })));
    });
  }, []);

  const RenderSection = ({ section }) => {
    // جلب البيانات بناء على وضع الاختيار
    const data = section.selectionMode === 'manual' 
        ? products.filter(p => section.selectedItems?.includes(p.id)) 
        : products.filter(p => p.category === section.selectedCategory || p.categories?.includes(section.selectedCategory));

    // رابط عرض الكل بناء على نوع القسم
    const sectionLink = section.type === 'products' ? `/collections/${section.selectedCategory || 'all'}` : '#';

    return (
      <section className="mb-12 font-cairo animate-fade-in max-w-[1600px] mx-auto overflow-hidden">
        
        {/* --- تم استبدال الهيدر القديم بالمكون الأصلي الخاص بك هنا --- */}
        <SectionHeader title={section.title} subTitle={section.subTitle} link={sectionLink} />

        {/* --- الأنماط البصرية (نفس المنطق البرمجي دون تغيير) --- */}
        <div className="px-4">
            {/* 1. IMDb Vertical Posters */}
            {section.layout === 'imdb_posters' && (
                <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 scrollbar-hide snap-x" dir="rtl">
                    {data.map(p => (
                        <div key={p.id} className="min-w-[170px] md:min-w-[240px] snap-start group cursor-pointer transform hover:scale-[1.02] transition-transform">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-500">
                                <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                <div className="absolute bottom-4 right-4 text-right">
                                    <div className="text-[#F5C518] font-black text-lg mb-1">{p.price} EGP</div>
                                    <h4 className="text-white font-bold text-xs uppercase leading-tight line-clamp-1">{p.title}</h4>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. Bento Modern Grid */}
            {section.layout === 'bento_modern' && data.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[650px]" dir="rtl">
                    <div className="md:col-span-2 md:row-span-2 relative rounded-[2rem] overflow-hidden group border border-white/5">
                        <img src={data[0]?.image} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                        <div className="absolute bottom-10 right-10">
                            <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-none tracking-tighter">{data[0]?.title}</h3>
                            <Link href={`/product/${data[0]?.id}`} className="bg-[#F5C518] text-black px-8 py-3 rounded-full font-black text-sm uppercase">اكتشف الآن</Link>
                        </div>
                    </div>
                    <div className="md:col-span-2 md:row-span-1 rounded-[2rem] overflow-hidden border border-white/5 relative group">
                        <img src={data[1]?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    </div>
                    <div className="md:col-span-1 md:row-span-1 rounded-[2rem] overflow-hidden border border-white/5">
                        <img src={data[2]?.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="md:col-span-1 md:row-span-1 bg-[#F5C518] rounded-[2rem] flex items-center justify-center p-6 text-center text-black font-black text-xl italic leading-tight">
                        أفضل الاختيارات
                    </div>
                </div>
            )}

            {/* 3. IMDb Born Today Circles */}
            {section.layout === 'circle_avatars' && (
                <div className="flex overflow-x-auto gap-8 px-4 py-8 scrollbar-hide" dir="rtl">
                    {section.selectedCollections?.map(cat => (
                        <Link href={`/collections/${cat}`} key={cat} className="flex flex-col items-center gap-4 min-w-fit group">
                            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-1 border-2 border-white/10 group-hover:border-[#F5C518] transition-all duration-500 shadow-2xl relative">
                                <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={products.find(p => p.category === cat)?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                </div>
                            </div>
                            <span className="text-sm md:text-base font-black text-white/60 group-hover:text-[#F5C518] uppercase tracking-widest">{cat}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* 4. WIND Default Grid */}
            {section.layout === 'grid_default' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8" dir="rtl">
                    {data.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                </div>
            )}

            {/* 5. Marquee Promo Bar */}
            {section.layout === 'marquee_promo' && (
                <div className="bg-[#F5C518] py-8 -mx-8 relative overflow-hidden group">
                    <div className="flex gap-10 animate-marquee whitespace-nowrap">
                       {[...Array(10)].map((_, i) => (
                           <span key={i} className="text-black text-5xl md:text-7xl font-black uppercase tracking-tighter opacity-90">{section.title} • </span>
                       ))}
                    </div>
                </div>
            )}
        </div>
      </section>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center font-black text-[#F5C518] text-2xl animate-pulse tracking-[0.5em]">
      WIND LOADING
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden font-cairo">
      {/* استيراد خط القاهرة Cairo */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>

      <HeroSection />
      
      <div className="mt-10">
        {sections.map((section) => <RenderSection key={section.id} section={section} />)}
      </div>
    </main>
  );
}