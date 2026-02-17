"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import ProductCard from "../components/products/ProductCard";

export default function Home() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (docSnap) => {
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
        setLoading(false);
    });
    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), image: doc.data().images?.[0] || doc.data().image || '/images/placeholder.jpg' })));
    });
    return () => { settingsUnsub(); productsUnsub(); };
  }, []);

  // --- تصميم الهيرو (WIND Style المطور) ---
  const RenderHero = ({ section }) => {
      const slides = section.heroSlides?.length > 0 ? section.heroSlides : [section.mediaUrl || '/images/banner-placeholder.jpg'];
      const [currentSlide, setCurrentSlide] = useState(0);

      useEffect(() => {
          if(slides.length <= 1) return;
          const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
          return () => clearInterval(timer);
      }, [slides.length]);

      return (
          <section className={`relative w-full overflow-hidden bg-black ${section.heroHeight || 'h-[85vh]'}`}>
              {slides.map((slide, index) => (
                  <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                      <img src={slide} className="w-full h-full object-cover opacity-60 animate-kenburns" alt="Hero" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#121212]" />
                  </div>
              ))}
              
              <div className="absolute inset-0 flex items-center justify-center text-center z-10 px-4">
                  <div className="max-w-4xl flex flex-col items-center">
                      {/* 1. البوكس الأصفر الصغير */}
                      {section.topBadge && (
                        <span className="bg-[#f5c518] text-black text-xs md:text-sm font-black px-4 py-1.5 uppercase tracking-widest mb-6 animate-fade-in">
                            {section.topBadge}
                        </span>
                      )}
                      
                      {/* 2. العنوان العريض جداً */}
                      <h1 className="text-5xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter uppercase leading-tight">
                          {section.title || "WIND STORE"}
                      </h1>

                      {/* 3. العنوان الفرعي الخفيف */}
                      {section.subTitle && (
                        <p className="text-lg md:text-2xl text-gray-300 font-light mb-10 max-w-2xl leading-relaxed italic">
                            {section.subTitle}
                        </p>
                      )}

                      {/* 4. الزر (تصفح المجموعة) */}
                      {section.buttonText && (
                        <Link href={section.buttonLink || "/collections/all"} className="border-2 border-white text-white hover:bg-white hover:text-black px-10 py-4 font-black text-sm uppercase transition-all duration-300 tracking-widest active:scale-95">
                            {section.buttonText}
                        </Link>
                      )}
                  </div>
              </div>
          </section>
      );
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
        {link && <Link href={`/collections/${link}`} className="text-[#f5c518] text-xs font-bold hover:underline">عرض الكل ←</Link>}
    </div>
  );

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#f5c518] font-bold">جاري تحميل WIND...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white pb-20 overflow-x-hidden">
      <style jsx global>{`
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .animate-kenburns { animation: kenburns 20s infinite alternate linear; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {sections.map((section, index) => (
          <div key={section.id || index}>
            {section.type === 'hero' ? <RenderHero section={section} /> : (
                <div className="mb-12">
                    <SectionTitle title={section.title} subTitle={section.subTitle} link={section.dataSource} />
                    {section.layout === 'grid_default' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4" dir="rtl">
                            {products.filter(p => !section.dataSource || p.category === section.dataSource).slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                        </div>
                    )}
                    {/* يمكنك هنا إضافة باقي التصنيفات (IMDb, Slider) كما في الكود السابق */}
                </div>
            )}
          </div>
      ))}
    </main>
  );
}