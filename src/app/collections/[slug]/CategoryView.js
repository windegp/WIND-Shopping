"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { usePageReady, useGlobalLoader } from "../../../context/GlobalLoaderContext";
import ProductCard from "../../../components/products/ProductCard";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function CategoryView({ initialSlug, initialCategoryData }) {
  const pathname = usePathname();
  const currentSlug = initialSlug; 
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderActive } = useGlobalLoader();
  
  const [products, setProducts] = useState([]);
  const [categoryData, setCategoryData] = useState(initialCategoryData);
  const [loading, setLoading] = useState(true);
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentSlug) return;
      setLoading(true);
      
      try {
        const typeVariants = [
          currentSlug, currentSlug.toLowerCase(), 
          currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1).toLowerCase(), categoryData.name
        ];

        const q1 = query(collection(db, "products"), where("categories", "array-contains-any", [currentSlug, `/${currentSlug}`]), limit(40));
        const q2 = query(collection(db, "products"), where("type", "in", typeVariants), limit(40));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const productsMap = new Map();
        snap1.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        snap2.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        
        setProducts(Array.from(productsMap.values()));
        setLoading(false);
      } catch (error) {
        console.error("WIND Fetch Error:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentSlug, categoryData.name]);

  useEffect(() => {
    if (!loading && (products.length > 0 || categoryData.name)) {
      signalPageReady();
    }
  }, [loading, products, categoryData.name, pathname, signalPageReady]);

  return (
    <main className="min-h-screen bg-[#121212] pt-24 pb-12" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* التاجات الذكية (Breadcrumbs) مطابقة لتصميم صفحة المنتج */}
        <div className="flex items-center justify-center gap-3 text-[11px] md:text-[13px] font-medium text-gray-400 mb-6" style={{fontFamily:"Cairo,sans-serif"}}>
          <span className="border border-gray-600 rounded-[4px] px-2 py-0.5 text-gray-300">
            ويند-{new Date().getFullYear().toString().slice(-2)}
          </span>
          <span className="w-1.5 h-1.5 bg-gray-500 rounded-sm"></span>
          <span className="text-gray-300">منتجات ويند</span>
          <span className="w-1.5 h-1.5 bg-gray-500 rounded-sm"></span>
          <span className="capitalize text-[#F5C518] font-bold">{categoryData.name}</span>
        </div>

        {/* Header */}
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter" style={{fontFamily:"Cairo,sans-serif"}}>
            {categoryData.name}
          </h1>
          <div className="flex justify-center items-center gap-4">
            <span className="h-[1px] w-12 bg-gradient-to-l from-[#F5C518] to-transparent"></span>
            <p className="text-[#F5C518] font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase">
              {categoryData.subtitle || "WIND ESSENTIALS"}
            </p>
            <span className="h-[1px] w-12 bg-gradient-to-r from-[#F5C518] to-transparent"></span>
          </div>
          {categoryData.description && (
            <p className="mt-6 text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed" style={{fontFamily:"Tajawal,sans-serif"}}>
              {categoryData.description}
            </p>
          )}
        </div>

        {/* النتائج */}
        {!loading && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} sourceCategory={currentSlug} /> 
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-32 border border-[#333] rounded-3xl bg-[#1a1a1a]/50">
            <p className="text-gray-400 mb-8 text-lg font-bold">لا توجد قطع متوفرة في "{categoryData.name}" حالياً.</p>
            <Link href="/" className="bg-[#F5C518] text-black px-10 py-4 font-black text-sm hover:bg-white transition-all rounded-full active:scale-95">
              اكتشف باقي المجموعات
            </Link>
          </div>
        ) : null}

        {/* سكشن الـ SEO السفلي */}
        {categoryData.bottomDescription && products.length > 0 && (
          <div className="mt-24 pt-10 border-t border-white/5 max-w-4xl mx-auto">
            <div className="relative">
              <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isSeoExpanded ? 'max-h-[2000px]' : 'max-h-24'}`}>
                <div className="text-gray-400 text-sm md:text-base font-light leading-loose whitespace-pre-wrap" style={{fontFamily:"Tajawal,sans-serif"}}>
                  {categoryData.bottomDescription}
                </div>
              </div>
              
              {!isSeoExpanded && (
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none"></div>
              )}
            </div>

            <button 
              onClick={() => setIsSeoExpanded(!isSeoExpanded)} 
              className="mt-4 mx-auto flex items-center gap-2 text-[#F5C518] font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              {isSeoExpanded ? 'إخفاء التفاصيل' : 'اقرأ المزيد'}
              <ChevronDown className={`transition-transform duration-300 ${isSeoExpanded ? 'rotate-180' : ''}`} size={16}/>
            </button>
          </div>
        )}

      </div>
    </main>
  );
}