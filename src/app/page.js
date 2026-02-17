"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";

// استيراد المكونات
import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";

export default function Home() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات من Firebase
  useEffect(() => {
    const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (docSnap) => {
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
        setLoading(false);
    });

    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            image: doc.data().images?.[0] || doc.data().image || '/images/placeholder.jpg' 
        })));
    });

    return () => { settingsUnsub(); productsUnsub(); };
  }, []);

  // --- مكون العناوين ---
  const SectionTitle = ({ title, subTitle, link }) => (
    <div className="flex items-center justify-between mb-8 px-4 md:px-8 mt-16" dir="rtl">
        <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#f5c518] rounded-full"></div>
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{title}</h2>
                {subTitle && <p className="text-gray-500 text-xs mt-1">{subTitle}</p>}
            </div>
        </div>
        {link && <Link href={`/collections/${link}`} className="text-[#f5c518] text-sm font-bold hover:underline">عرض الكل ←</Link>}
    </div>
  );

  // --- المكون الرئيسي لرسم الأقسام ---
  const RenderSection = ({ section }) => {
    // 1. فلترة البيانات (يدوي أو آلي)
    const data = section.selectionMode === 'manual' 
        ? products.filter(p => section.selectedItems?.includes(p.id)) 
        : products.filter(p => p.category === section.selectedCategory || (p.categories && p.categories.includes(section.selectedCategory)));

    return (
      <section className="mb-20">
        <SectionTitle title={section.title} subTitle={section.subTitle} link={section.selectedCategory} />
        
        {/* تصميم: الشبكة التقليدية */}
        {section.layout === 'grid_default' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4" dir="rtl">
                {data.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
            </div>
        )}

        {/* تصميم: بوسترات IMDb الطولية */}
        {section.layout === 'imdb_posters' && (
            <div className="flex overflow-x-auto gap-4 px-4 pb-6 scrollbar-hide snap-x">
                {data.map(p => (
                    <div key={p.id} className="min-w-[160px] md:min-w-[240px] snap-start">
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#222] group">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-4 right-4 left-4 text-right">
                                <p className="text-[#F5C518] font-black text-sm">{p.price} EGP</p>
                                <h4 className="text-white text-xs font-bold line-clamp-1">{p.title}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* تصميم: دوائر الأقسام (Born Today) */}
        {section.layout === 'circle_avatars' && (
            <div className="flex overflow-x-auto gap-8 px-8 py-4 scrollbar-hide" dir="rtl">
                {section.selectedCollections?.map(cat => (
                    <Link href={`/collections/${cat}`} key={cat} className="flex flex-col items-center gap-3 min-w-fit group">
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-[#222] group-hover:border-[#F5C518] transition-all p-1 shadow-2xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a]">
                                {/* سيحاول البحث عن صورة للمنتج الأول في هذا القسم ليعرضها كصورة للقسم */}
                                <img src={products.find(p => p.category === cat)?.image || '/images/placeholder.jpg'} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-[#F5C518]">{cat}</span>
                    </Link>
                ))}
            </div>
        )}

        {/* تصميم: Bento Grid (عصري جداً) */}
        {section.layout === 'bento_modern' && data.length >= 3 && (
            <div className="grid grid-cols-4 grid-rows-2 gap-4 px-4 h-[450px] md:h-[600px]" dir="rtl">
                <div className="col-span-2 row-span-2 bg-[#1a1a1a] rounded-3xl overflow-hidden relative group">
                    <img src={data[0]?.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-8 right-8 text-right">
                        <h3 className="font-black text-2xl md:text-4xl text-white mb-2">{data[0]?.title}</h3>
                        <Link href={`/product/${data[0]?.id}`} className="bg-[#F5C518] text-black px-6 py-2 rounded-full font-bold text-sm">تسوق الآن</Link>
                    </div>
                </div>
                <div className="col-span-2 row-span-1 bg-[#1a1a1a] rounded-3xl overflow-hidden relative">
                    <img src={data[1]?.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="col-span-1 row-span-1 bg-[#1a1a1a] rounded-3xl overflow-hidden">
                    <img src={data[2]?.image} className="w-full h-full object-cover" />
                </div>
                <div className="col-span-1 row-span-1 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black font-black text-center p-4 text-lg">
                    {section.title} ✨
                </div>
            </div>
        )}
      </section>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#f5c518] font-bold">WIND IS LOADING...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white pb-20 overflow-x-hidden">
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 1. الهيرو الثابت */}
      <HeroSection />

      {/* 2. الأقسام الديناميكية */}
      {sections.map((section) => <RenderSection key={section.id} section={section} />)}
    </main>
  );
}