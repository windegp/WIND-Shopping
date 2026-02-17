"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";

// استيراد المكونات الأصلية
import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";

export default function Home() {
  const [sections, setSections] = useState([]); // الأقسام القادمة من اللوحة
  const [products, setProducts] = useState([]); // المنتجات
  const [loading, setLoading] = useState(true);

  // --- 1. جلب البيانات ---
  useEffect(() => {
    // جلب هيكل الأقسام (v2)
    const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (docSnap) => {
        if (docSnap.exists()) {
            setSections(docSnap.data().sections || []);
        }
        setLoading(false);
    });

    // جلب المنتجات
    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            image: doc.data().images?.[0] || doc.data().image || '/images/placeholder.jpg' 
        })));
    });

    return () => { settingsUnsub(); productsUnsub(); };
  }, []);

  // --- 2. دوال مساعدة ---
  const getSectionData = (source) => {
      if (!source || source === 'all') return products;
      return products.filter(p => p.category === source || (p.categories && p.categories.includes(source)));
  };

  const SectionTitle = ({ title, subTitle, link }) => (
      <div className="flex items-center justify-between mb-8 px-4 md:px-8 mt-16" dir="rtl">
          <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-[#f5c518]"></div>
              <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{title}</h2>
                  {subTitle && <p className="text-gray-500 text-xs mt-1">{subTitle}</p>}
              </div>
          </div>
          {link && <Link href={`/collections/${link}`} className="text-[#f5c518] text-sm font-bold hover:underline">عرض الكل ←</Link>}
      </div>
  );

  // --- 3. العرض الرئيسي ---
  return (
    <main className="min-h-screen bg-[#121212] text-white pb-20 overflow-x-hidden">
      {/* ستايلات الحركات الأصلية (KenBurns وغيرها) */}
      <style jsx global>{`
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 1. الهيرو سيكشن الأصلي (ثابت لا يتغير من اللوحة) */}
      <HeroSection />

      {/* 2. الأقسام الديناميكية (تبدأ من هنا) */}
      {loading ? (
          <div className="py-20 text-center text-[#f5c518] animate-pulse font-bold">جاري تحميل الأقسام...</div>
      ) : (
          sections.map((section) => {
              const data = getSectionData(section.dataSource);
              return (
                  <section key={section.id} className="mb-16 animate-fade-in">
                      <SectionTitle title={section.title} subTitle={section.subTitle} link={section.dataSource} />
                      
                      {/* عرض الشبكة التقليدية */}
                      {section.layout === 'grid_default' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4" dir="rtl">
                              {data.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                          </div>
                      )}

                      {/* عرض شريط السحب */}
                      {section.layout === 'slider_row' && (
                          <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide snap-x" dir="rtl">
                              {data.map(p => (
                                  <div key={p.id} className="min-w-[180px] md:min-w-[240px] snap-start">
                                      <ProductCard {...p} />
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* عرض IMDb (كروت عريضة) */}
                      {section.layout === 'imdb_cards' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4" dir="rtl">
                              {data.slice(0, 6).map(p => (
                                  <div key={p.id} className="flex bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden h-40 group hover:border-[#f5c518] transition-colors">
                                      <div className="w-1/3 relative"><img src={p.image} className="w-full h-full object-cover" /></div>
                                      <div className="w-2/3 p-4 flex flex-col justify-between">
                                          <h3 className="text-white font-bold">{p.title}</h3>
                                          <div className="flex justify-between items-end">
                                              <span className="text-[#f5c518] font-bold">{p.price} EGP</span>
                                              <Link href={`/product/${p.id}`} className="bg-[#333] text-white px-3 py-1 text-xs rounded hover:bg-[#f5c518] hover:text-black">التفاصيل</Link>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* عرض شريط متحرك Marquee */}
                      {section.layout === 'marquee_scroll' && (
                          <div className="overflow-hidden py-8 bg-[#1a1a1a] border-y border-[#333]">
                              <div className="flex gap-6 animate-marquee min-w-max">
                                  {[...data.slice(0,10), ...data.slice(0,10)].map((p, i) => (
                                      <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100 transition-opacity">
                                          <ProductCard {...p} />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </section>
              );
          })
      )}
    </main>
  );
}