"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";

// --- مكون الهيدر الموحد (لا تقم بتغييره) ---
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-8 px-4 pt-10 font-cairo" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {link !== '#' && (
        <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
        عرض الكل <span className="text-xl leading-none">›</span>
        </Link>
    )}
  </div>
);

export default function Home() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات
  useEffect(() => {
    const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (snap) => {
        if (snap.exists()) setSections(snap.data().sections || []);
        setLoading(false);
    });
    
    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        setProducts(snap.docs.map(d => ({ 
            id: d.id, 
            ...d.data(), 
            image: d.data().images?.[0] || d.data().image || '/images/placeholder.jpg' 
        })));
    });

    return () => { settingsUnsub(); productsUnsub(); };
  }, []);

  // --- المحرك الرئيسي لعرض الأقسام (Render Engine) ---
  const RenderSection = ({ section }) => {
    // 1. تجهيز البيانات (المنتجات)
    let data = [];
    if (section.type === 'products') {
        data = section.selectionMode === 'manual' 
            ? products.filter(p => section.selectedItems?.includes(p.id)) 
            : products.filter(p => p.category === section.selectedCategory || p.categories?.includes(section.selectedCategory));
    }

    const sectionLink = section.type === 'products' ? `/collections/${section.selectedCategory || 'all'}` : '#';

    return (
      <section className="mb-16 font-cairo max-w-[1600px] mx-auto overflow-hidden animate-fade-in">
        
        {/* عرض الهيدر فقط إذا لم يكن ستايل "ماركي" أو "قصة" لأن لهم تصميم خاص */}
        {!['story_banner', 'trust_bar'].includes(section.layout) && (
            <SectionHeader title={section.title} subTitle={section.subTitle} link={sectionLink} />
        )}

        <div className="px-4">
            
            {/* ======================================================== */}
            {/* 1. ستايل الأكثر مبيعاً (Bestseller Split) */}
            {/* ======================================================== */}
            {section.layout === 'bestseller_split' && data.length > 0 && (
                <div className="flex flex-col md:flex-row gap-6" dir="rtl">
                    {/* المنتج الكبير */}
                    <div className="w-full md:w-1/3 bg-[#111] border border-white/5 p-4 rounded-2xl relative group">
                        <div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-3 py-1 z-10 rounded shadow-lg">الأكثر طلباً #1</div>
                        <ProductCard {...data[0]} />
                    </div>
                    {/* الشبكة الجانبية */}
                    <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {data.slice(1, 5).map(p => (
                             <div key={p.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                                <ProductCard {...p} />
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 2. ستايل الماركي اللانهائي (Infinite Marquee) */}
            {/* ======================================================== */}
            {section.layout === 'infinite_marquee' && (
                <div className="py-8 bg-[#161616] -mx-4 border-y border-[#222] relative">
                    <div className="flex gap-6 animate-marquee hover:pause-animation w-max">
                        {/* تكرار المنتجات لضمان الحركة المستمرة */}
                        {[...data, ...data, ...data].slice(0, 15).map((p, idx) => (
                            <div key={`${p.id}-${idx}`} className="min-w-[200px] md:min-w-[260px] opacity-90 hover:opacity-100 transition-opacity">
                                <ProductCard {...p} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 3. شريط الثقة (Trust Bar) */}
            {/* ======================================================== */}
            {section.layout === 'trust_bar' && (
                <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] py-10 border-y border-white/5 rounded-2xl">
                    <div className="flex flex-col md:flex-row justify-around items-center gap-8 text-center px-4">
                        <div className="group">
                            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl md:text-4xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4>
                            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{section.title || "تقييم العملاء"}</p>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10"></div>
                        <div className="group">
                            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl md:text-4xl font-black">+10k</h4>
                            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">قطعة بيعت</p>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10"></div>
                        <div className="group">
                            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl md:text-4xl font-black">100%</h4>
                            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">ضمان الجودة</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 4. ستايل المجلة (Magazine Grid) */}
            {/* ======================================================== */}
            {section.layout === 'magazine_grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                    <div className="relative h-64 md:h-80 group cursor-pointer overflow-hidden rounded-2xl border border-white/5">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                        <img src="/images/article1.jpg" onError={(e) => e.target.src='https://via.placeholder.com/800x600/111/333?text=WIND+MAGAZINE'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt="Article" />
                        <div className="absolute bottom-0 right-0 p-8 z-20 w-full bg-gradient-to-t from-black via-black/70 to-transparent text-right">
                            <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-3 inline-block rounded-sm">نصائح</span>
                            <h3 className="text-white font-black text-2xl group-hover:text-[#F5C518] transition-colors leading-tight">كيف تنسقين أزياء الشتاء بأناقة؟</h3>
                        </div>
                    </div>
                    <div className="relative h-64 md:h-80 group cursor-pointer overflow-hidden rounded-2xl border border-white/5">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                         <img src="/images/article2.jpg" onError={(e) => e.target.src='https://via.placeholder.com/800x600/222/444?text=WIND+STORY'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt="Article" />
                        <div className="absolute bottom-0 right-0 p-8 z-20 w-full bg-gradient-to-t from-black via-black/70 to-transparent text-right">
                            <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-3 inline-block rounded-sm">قصتنا</span>
                            <h3 className="text-white font-black text-2xl group-hover:text-[#F5C518] transition-colors leading-tight">رحلة WIND من الفكرة إلى الواقع</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 5. ستايل آراء العملاء (Reviews) */}
            {/* ======================================================== */}
            {section.layout === 'review_marquee' && (
                <div className="relative py-10 bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
                    <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
                        {/* بيانات تجريبية لأن الآراء غير مرتبطة بالمنتجات مباشرة في هذا الكود */}
                        {[1,2,3,4,5].map((i) => (
                            <div key={i} className="min-w-[300px] md:min-w-[350px] bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl hover:border-[#F5C518]/30 transition-all">
                                <div className="flex items-center gap-3 mb-4" dir="rtl">
                                    <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black border border-[#333]">
                                        {['A','M','S','H','K'][i-1]}
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-white font-bold text-sm">عميل WIND المميز</h4>
                                        <div className="text-[#F5C518] text-xs">★★★★★</div>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm italic text-right" dir="rtl">"الخامة ممتازة والتصميم رائع جداً، شكراً WIND على هذا الإبداع!"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 6. ستايل قصة البراند (Story Banner) */}
            {/* ======================================================== */}
            {section.layout === 'story_banner' && (
                <div className="relative h-[400px] rounded-[3rem] overflow-hidden border border-white/10 group">
                    <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/50 transition-all"></div>
                    <img src="/images/story-bg.jpg" onError={(e) => e.target.src='https://via.placeholder.com/1600x800/111/333?text=WIND+BRAND'} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[3s]" alt="Story" />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                        <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter mix-blend-screen opacity-90">{section.title}</h2>
                        <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed drop-shadow-md">
                            {section.subTitle || "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."}
                        </p>
                        <button className="mt-8 border border-white text-white px-8 py-3 text-sm font-bold hover:bg-white hover:text-black transition-all rounded-full">
                            اكتشف المزيد
                        </button>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 7. ستايل التخفيضات (Sale Grid) */}
            {/* ======================================================== */}
            {section.layout === 'sale_grid' && (
                <div className="bg-[#141414] p-4 md:p-8 rounded-[2rem] border border-[#222]">
                    <div className="bg-[#F5C518] text-black py-3 mb-6 text-center font-black text-lg md:text-xl uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(245,197,24,0.2)] animate-pulse">
                        🔥 {section.title} - لفترة محدودة 🔥
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.slice(0, 4).map((p) => <ProductCard key={p.id} {...p} />)}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* 8. الاستايلات الأساسية (Grid, IMDb, Bento, Circles) */}
            {/* ======================================================== */}
            
            {section.layout === 'grid_default' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" dir="rtl">
                    {data.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                </div>
            )}

            {section.layout === 'imdb_posters' && (
                <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x" dir="rtl">
                    {data.map(p => (
                        <div key={p.id} className="min-w-[170px] md:min-w-[240px] snap-start transition-transform hover:scale-[1.02]">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 group">
                                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-4 right-4 left-4 text-right">
                                    <p className="text-[#F5C518] font-black text-lg">{p.price} EGP</p>
                                    <h4 className="text-white text-xs font-bold line-clamp-1">{p.title}</h4>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {section.layout === 'circle_avatars' && (
                <div className="flex overflow-x-auto gap-6 md:gap-10 py-4 scrollbar-hide justify-start md:justify-center" dir="rtl">
                    {section.selectedCollections?.map(cat => (
                        <Link href={`/collections/${cat}`} key={cat} className="flex flex-col items-center gap-4 min-w-fit group">
                            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-1 border-2 border-white/10 group-hover:border-[#F5C518] transition-all duration-500 shadow-2xl relative">
                                <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={products.find(p => p.category === cat)?.image || '/images/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter grayscale group-hover:grayscale-0" alt="" />
                                </div>
                            </div>
                            <span className="text-sm md:text-base font-black text-white/60 group-hover:text-[#F5C518] uppercase tracking-widest">{cat}</span>
                        </Link>
                    ))}
                </div>
            )}

             {section.layout === 'bento_modern' && data.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]" dir="rtl">
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
                    <div className="md:col-span-1 md:row-span-1 bg-[#F5C518] rounded-[2rem] flex items-center justify-center p-6 text-center text-black font-black text-xl italic leading-tight shadow-[inset_0_0_30px_rgba(0,0,0,0.1)]">
                        {section.title}
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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; }
        .pause-animation:hover { animation-play-state: paused; }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>

      <HeroSection />
      
      <div className="mt-12">
        {sections.map((section) => <RenderSection key={section.id} section={section} />)}
      </div>
    </main>
  );
}