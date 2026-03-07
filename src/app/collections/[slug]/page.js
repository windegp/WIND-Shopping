"use client";
import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { usePageReady, useGlobalLoader } from "../../../context/GlobalLoaderContext";
import ProductCard from "../../../components/products/ProductCard";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const pathname = usePathname();
  const currentSlug = params.slug || params.categorySlug; 
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderActive } = useGlobalLoader();
  
  const [products, setProducts] = useState([]);
  const [categoryData, setCategoryData] = useState({ name: "", subtitle: "", description: "", bottomDescription: "" });
  const [loading, setLoading] = useState(true);
  const [isSeoExpanded, setIsSeoExpanded] = useState(false);

  useEffect(() => {
    const fetchEverything = async () => {
      if (!currentSlug) return;
      setLoading(true);
      
      try {
        const catQuery = query(collection(db, "collections"), where("slug", "in", [currentSlug, `/${currentSlug}`]));
        const catSnapshot = await getDocs(catQuery);
        
        let currentCatName = "";
        if (!catSnapshot.empty) {
          const data = catSnapshot.docs[0].data();
          setCategoryData(data);
          currentCatName = data.name;
        } else {
          const formatSlugToName = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
          const fallbackTitle = currentSlug === 'isdal' ? 'الإسدالات' : currentSlug === 'shawls' ? 'الشيلان' : formatSlugToName(currentSlug);
          setCategoryData({ name: fallbackTitle, subtitle: "WIND ESSENTIALS", description: "تشكيلة حصرية من WIND تناسب ذوقك." });
          currentCatName = fallbackTitle;
        }

        const typeVariants = [
          currentSlug, currentSlug.toLowerCase(), 
          currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1).toLowerCase(), currentCatName
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

    fetchEverything();
  }, [currentSlug]);

  // Signal readiness when critical data loads (FIX: add pathname to ensure re-trigger on navigation)
  useEffect(() => {
    if (!loading && (products.length > 0 || categoryData.name)) {
      signalPageReady();
    }
  }, [loading, products, categoryData.name, pathname, signalPageReady]);

  return (
    <main className="min-h-screen bg-[#121212] pt-24 pb-12" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* Header - تم تصغير العنوان وربط الوصف الفرعي */}
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
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
            <p className="mt-6 text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              {categoryData.description}
            </p>
          )}
        </div>

        {/* النتائج */}
        {!loading && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
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

        {/* سكشن الـ SEO السفلي (يظهر فقط لو فيه داتا) */}
        {categoryData.bottomDescription && products.length > 0 && (
          <div className="mt-24 pt-10 border-t border-white/5 max-w-4xl mx-auto">
            <div className="relative">
              <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isSeoExpanded ? 'max-h-[2000px]' : 'max-h-24'}`}>
                {/* استخدام whitespace-pre-wrap عشان يحافظ على السطور اللي كتبتها في الإدارة */}
                <div className="text-gray-400 text-sm md:text-base font-light leading-loose whitespace-pre-wrap">
                  {categoryData.bottomDescription}
                </div>
              </div>
              
              {/* التدرج اللوني (Fade) اللي بيخفي الكلام من تحت لما يكون مقفول */}
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