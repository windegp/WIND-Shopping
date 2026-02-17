"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";

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

    return (
      <section className="mb-24 animate-fade-in px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden">
        {/* Header الخاص بكل سيكشن */}
        <div className="flex items-center justify-between mb-10" dir="rtl">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-[#F5C518] rounded-full shadow-[0_0_15px_rgba(245,197,24,0.5)]"></div>
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">{section.title}</h2>
                    {section.subTitle && <p className="text-gray-500 text-sm md:text-base mt-1 font-light italic">{section.subTitle}</p>}
                </div>
            </div>
            {section.type === 'products' && (
                <Link href={`/collections/${section.selectedCategory || 'all'}`} className="text-[#F5C518] text-sm font-black border-b-2 border-[#F5C518]/20 hover:border-[#F5C518] transition-all pb-1 uppercase tracking-widest">عرض الكل</Link>
            )}
        </div>

        {/* --- الأنماط البصرية المتقدمة --- */}

        {/* 1. IMDb Vertical Posters (البوسترات السينمائية) */}
        {section.layout === 'imdb_posters' && (
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 scrollbar-hide snap-x" dir="rtl">
                {data.map(p => (
                    <div key={p.id} className="min-w-[180px] md:min-w-[280px] snap-start group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                            <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-6 right-6 left-6 text-right">
                                <div className="text-[#F5C518] font-black text-xl mb-1">{p.price} EGP</div>
                                <h4 className="text-white font-black text-sm uppercase leading-tight line-clamp-2">{p.title}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* 2. Bento Modern Grid (التصميم الهندسي) */}
        {section.layout === 'bento_modern' && data.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[700px]" dir="rtl">
                <div className="md:col-span-2 md:row-span-2 relative rounded-[3rem] overflow-hidden group border border-white/5">
                    <img src={data[0]?.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                    <div className="absolute bottom-12 right-12">
                        <h3 className="text-4xl md:text-6xl font-black text-white mb-4 leading-none tracking-tighter">{data[0]?.title}</h3>
                        <Link href={`/product/${data[0]?.id}`} className="bg-[#F5C518] text-black px-10 py-4 rounded-2xl font-black text-sm uppercase">اكتشف الآن</Link>
                    </div>
                </div>
                <div className="md:col-span-2 md:row-span-1 rounded-[3rem] overflow-hidden border border-white/5 relative group">
                    <img src={data[1]?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute top-8 left-8 text-white font-black text-2xl uppercase tracking-tighter">{data[1]?.title}</div>
                </div>
                <div className="md:col-span-1 md:row-span-1 rounded-[3rem] overflow-hidden border border-white/5">
                    <img src={data[2]?.image} className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-1 md:row-span-1 bg-[#F5C518] rounded-[3rem] flex items-center justify-center p-8 text-center shadow-[0_20px_50px_rgba(245,197,24,0.3)]">
                    <span className="text-black font-black text-2xl uppercase leading-none tracking-tighter italic">أفضل<br/>الاختيارات</span>
                </div>
            </div>
        )}

        {/* 3. IMDb Born Today Circles (أقسام مميزة) */}
        {section.layout === 'circle_avatars' && (
            <div className="flex overflow-x-auto gap-8 md:gap-12 px-4 py-8 scrollbar-hide" dir="rtl">
                {section.selectedCollections?.map(cat => (
                    <Link href={`/collections/${cat}`} key={cat} className="flex flex-col items-center gap-6 min-w-fit group">
                        <div className="w-32 h-32 md:w-56 md:h-56 rounded-full p-1 border-2 border-white/10 group-hover:border-[#F5C518] transition-all duration-500 shadow-2xl relative">
                            <div className="w-full h-full rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                                <img src={products.find(p => p.category === cat)?.image} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                            </div>
                            <div className="absolute -bottom-2 bg-[#F5C518] text-black px-4 py-1 text-[10px] font-black rounded-full opacity-0 group-hover:opacity-100 transition-all">SHOP</div>
                        </div>
                        <span className="text-lg font-black text-white/60 group-hover:text-white uppercase tracking-widest">{cat}</span>
                    </Link>
                ))}
            </div>
        )}

        {/* 4. WIND Default Grid (الشبكة التقليدية المحسنة) */}
        {section.layout === 'grid_default' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8" dir="rtl">
                {data.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
            </div>
        )}

        {/* 5. Marquee Promo Bar */}
        {section.layout === 'marquee_promo' && (
            <div className="bg-[#F5C518] py-10 -mx-8 relative overflow-hidden group">
                <div className="flex gap-10 animate-marquee whitespace-nowrap">
                   {[...Array(10)].map((_, i) => (
                       <span key={i} className="text-black text-6xl md:text-8xl font-black uppercase tracking-tighter opacity-90">{section.title} • </span>
                   ))}
                </div>
            </div>
        )}
      </section>
    );
  };

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center font-black text-[#F5C518] text-2xl animate-pulse tracking-[0.5em]">WIND LOADING</div>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden">
      <HeroSection />
      <div className="mt-10">
        {sections.map((section) => <RenderSection key={section.id} section={section} />)}
      </div>
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </main>
  );
}