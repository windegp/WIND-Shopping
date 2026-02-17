"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";

// --- استيراد المكونات القديمة (سنستخدمها داخل التصميمات الجديدة) ---
import ProductCard from "../components/products/ProductCard";
// تأكد من مسار ProductCard عندك

export default function Home() {
  const [sections, setSections] = useState([]); // الأقسام القادمة من اللوحة
  const [products, setProducts] = useState([]); // كل المنتجات
  const [loading, setLoading] = useState(true);

  // --- 1. جلب البيانات (الربط مع اللوحة) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // أ) جلب إعدادات الصفحة الجديدة (v2)
        const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (docSnap) => {
            if (docSnap.exists()) {
                setSections(docSnap.data().sections || []);
            }
            setLoading(false);
        });

        // ب) جلب المنتجات (عشان نملا الأقسام)
        const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const productsUnsub = onSnapshot(productsQuery, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // ضمان وجود صورة للعرض
                image: doc.data().images?.[0] || doc.data().image || '/images/placeholder.jpg' 
            }));
            setProducts(prods);
        });

        return () => { settingsUnsub(); productsUnsub(); };
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. دوال مساعدة (Helpers) ---
  
  // دالة لفلترة المنتجات حسب مصدر البيانات (القسم المختار في اللوحة)
  const getSectionData = (source) => {
      if (!source || source === 'all') return products;
      if (source === 'new-arrivals') return products.slice(0, 10); // مجازاً أحدث 10
      // الفلترة حسب الكاتيغوري
      return products.filter(p => 
          p.category === source || 
          (p.categories && p.categories.includes(source))
      );
  };

  // --- 3. مكونات التصميم (Layout Components) ---

  // أ) تصميم الهيرو (Hero Section)
  const RenderHero = ({ section }) => {
      const slides = section.heroSlides?.length > 0 ? section.heroSlides : [section.mediaUrl || '/images/banner-placeholder.jpg'];
      const [currentSlide, setCurrentSlide] = useState(0);

      useEffect(() => {
          if(slides.length <= 1) return;
          const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
          return () => clearInterval(timer);
      }, [slides.length]);

      return (
          <section className="relative h-[85vh] w-full overflow-hidden bg-black">
              {/* الصور الخلفية */}
              {slides.map((slide, index) => (
                  <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                      <img src={slide} className="w-full h-full object-cover opacity-60" alt="Hero" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                  </div>
              ))}
              
              {/* المحتوى النصي */}
              <div className="absolute inset-0 flex items-center justify-center text-center z-10 px-4">
                  <div className="max-w-3xl animate-fade-in-up">
                      <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">{section.title || "WIND STORE"}</h1>
                      {section.subTitle && <p className="text-xl md:text-2xl text-gray-200 font-light mb-8">{section.subTitle}</p>}
                      {/* لو عايز زرار ممكن تضيفه في إعدادات اللوحة مستقبلاً */}
                  </div>
              </div>
          </section>
      );
  };

  // ب) تصميم شريط العناوين (Header)
  const SectionTitle = ({ title, subTitle, link }) => (
      <div className="flex items-center justify-between mb-8 px-4 md:px-8 mt-16" dir="rtl">
          <div>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-[#f5c518] rounded block"></span>
                  {title}
              </h2>
              {subTitle && <p className="text-gray-400 text-sm mt-1 mr-4">{subTitle}</p>}
          </div>
          {link && (
              <Link href={`/collections/${link}`} className="text-[#f5c518] text-sm font-bold hover:underline flex items-center gap-1">
                  عرض الكل <span>←</span>
              </Link>
          )}
      </div>
  );

  // ج) المصنع الرئيسي للأقسام (The Section Factory)
  const RenderSection = ({ section }) => {
      const data = getSectionData(section.dataSource);
      
      // 1. معالجة قسم الـ Hero
      if (section.type === 'hero') return <RenderHero section={section} />;

      // 2. معالجة أقسام المنتجات والكولكشن
      return (
          <div className="mb-12">
              <SectionTitle title={section.title} subTitle={section.subTitle} link={section.dataSource} />
              
              {/* اختيار اللي أوت بناءً على اللوحة */}
              
              {/* --- Layout: Slider (شريط سحب) --- */}
              {section.layout === 'slider_row' && (
                  <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide snap-x" dir="rtl">
                      {data.map(product => (
                          <div key={product.id} className="min-w-[180px] md:min-w-[240px] snap-start">
                              <ProductCard {...product} />
                          </div>
                      ))}
                  </div>
              )}

              {/* --- Layout: Grid (شبكة تقليدية) --- */}
              {section.layout === 'grid_default' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4" dir="rtl">
                      {data.slice(0, 8).map(product => ( // نعرض أول 8 فقط
                          <ProductCard key={product.id} {...product} />
                      ))}
                  </div>
              )}

              {/* --- Layout: Marquee (شريط متحرك) --- */}
              {section.layout === 'marquee_scroll' && (
                  <div className="overflow-hidden py-8 bg-[#1a1a1a] border-y border-[#333]">
                      <div className="flex gap-6 animate-marquee min-w-max">
                          {/* تكرار المنتجات لخلق حركة لا نهائية */}
                          {[...data.slice(0,10), ...data.slice(0,10)].map((product, i) => (
                              <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100 transition-opacity">
                                  <ProductCard {...product} />
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- Layout: IMDb Cards (كروت عريضة) --- */}
              {section.layout === 'imdb_cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4" dir="rtl">
                      {data.slice(0, 6).map(product => (
                          <div key={product.id} className="flex bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden hover:border-[#f5c518] transition-colors group h-40">
                              <div className="w-1/3 relative">
                                  <img src={product.image} className="w-full h-full object-cover" alt={product.title} />
                                  <div className="absolute top-2 right-2 bg-[#f5c518] text-black text-xs font-bold px-1.5 rounded">{product.rating || '4.9'} ★</div>
                              </div>
                              <div className="w-2/3 p-4 flex flex-col justify-between">
                                  <div>
                                      <h3 className="text-white font-bold text-lg line-clamp-1">{product.title}</h3>
                                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{product.description || 'وصف مختصر للمنتج يظهر هنا لجذب الانتباه...'}</p>
                                  </div>
                                  <div className="flex justify-between items-end">
                                      <div className="text-[#f5c518] font-bold text-xl">{product.price} EGP</div>
                                      <Link href={`/product/${product.id}`} className="bg-[#333] hover:bg-[#f5c518] hover:text-black text-white text-xs px-3 py-2 rounded transition-colors">
                                          عرض التفاصيل
                                      </Link>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* --- Layout: Masonry (بنترست) --- */}
              {section.layout === 'masonry_wall' && (
                  <div className="columns-2 md:columns-4 gap-4 px-4 space-y-4" dir="rtl">
                      {data.slice(0, 10).map(product => (
                          <div key={product.id} className="break-inside-avoid">
                              <ProductCard {...product} />
                          </div>
                      ))}
                  </div>
              )}

              {/* رسالة لو مفيش منتجات */}
              {data.length === 0 && (
                  <div className="text-center py-10 text-gray-600 border border-dashed border-[#333] mx-4 rounded">
                      لا توجد منتجات في قسم "{section.dataSource}" حالياً.
                  </div>
              )}
          </div>
      );
  };

  // --- 4. العرض الرئيسي (Main Render) ---
  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#f5c518] font-bold text-xl animate-pulse">جاري بناء الواجهة...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white pb-20">
      
      {/* حقن ستايل الأنيميشن (مؤقت) */}
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {sections.length > 0 ? (
          sections.map((section, index) => (
              <RenderSection key={section.id || index} section={section} />
          ))
      ) : (
          // شاشة الترحيب لو الموقع لسه جديد
          <div className="h-screen flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-4xl font-bold text-[#f5c518] mb-4">WIND STORE</h1>
              <p className="text-gray-500">الموقع قيد الإنشاء حالياً. انتظرونا قريباً!</p>
          </div>
      )}

    </main>
  );
}