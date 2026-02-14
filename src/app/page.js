"use client";
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection"; // قسم الشيلان اللي عاجبك
import ProductCard from "../components/products/ProductCard";
import { products } from "../lib/products";

// مكون فرعي لعنوان القسم بستايل IMDb (خط أصفر + سهم)
const SectionHeader = ({ title, subTitle }) => (
  <div className="flex items-center justify-between mb-4 px-4 pt-8" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div> {/* الخط الأصفر الأيقوني */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white leading-none">{title}</h2>
        {subTitle && <p className="text-gray-400 text-xs mt-1">{subTitle}</p>}
      </div>
    </div>
    <button className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:underline">
      عرض الكل <span className="text-xl">›</span>
    </button>
  </div>
);

export default function Home() {
  // تصفية المنتجات للاقسام المختلفة
  const newArrivals = products.slice(0, 4); 
  const topRated = products.filter(p => parseFloat(p.rating) >= 4.9);

  return (
    <main className="pb-20 bg-[#121212] min-h-screen">
      
      {/* 1. الهيرو سكشن (تم تعديله مسبقاً) */}
      <HeroSection />

      {/* 2. قسم "أهم الاختيارات" - نظام تمرير أفقي (Horizontal Scroll) مثل التطبيقات */}
      <section>
        <SectionHeader title="أهم الاختيارات لك" subTitle="بناءً على ذوقك الرفيع" />
        
        {/* حاوية التمرير الأفقي */}
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x" dir="rtl">
          {newArrivals.map((product) => (
            <div key={product.id} className="min-w-[160px] md:min-w-[200px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 3. قسم الشيلان (التصميم القديم الذي أعجبك) */}
      <div className="my-8">
        <SectionHeader title="مجموعات مميزة" />
        <CollectionsSection />
      </div>

      {/* 4. قسم "الأعلى تقييماً" - شكل مختلف (قائمة طولية مع تفاصيل) */}
      <section className="px-4 max-w-[1280px] mx-auto">
        <SectionHeader title="المفضلة لدى العملاء" subTitle="القطع الأكثر طلباً هذا الأسبوع" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topRated.map((product) => (
             <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

    </main>
  );
}