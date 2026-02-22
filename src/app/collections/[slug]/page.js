"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import ProductCard from "../../../components/products/ProductCard";
import Link from "next/link";

export default function CategoryPage() {
  const params = useParams();
  // بيدعم الكودين (سواء الفولدر اسمه slug أو categorySlug) لضمان عدم حدوث 404
  const currentSlug = params.slug || params.categorySlug; 
  
  const [products, setProducts] = useState([]);
  const [categoryData, setCategoryData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEverything = async () => {
      if (!currentSlug) return;
      setLoading(true);
      try {
        // 1. محاولة جلب بيانات القسم ديناميكياً من Firestore (من صفحة الكولكشنز في الأدمن)
        const catQuery = query(
          collection(db, "collections"), 
          where("slug", "in", [currentSlug, `/${currentSlug}`])
        );
        const catSnapshot = await getDocs(catQuery);
        
        let currentCatName = "";
        if (!catSnapshot.empty) {
          const data = catSnapshot.docs[0].data();
          setCategoryData(data);
          currentCatName = data.name;
        } else {
          // الـ Fallback (لو القسم مش موجود في الداتا بيز كـ Collection، بس موجود كـ Type في المنتجات)
          // بنعمله اسم شيك أوتوماتيك
          const formatSlugToName = (slug) => {
             return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
          }

          const fallbackTitle = currentSlug === 'isdal' ? 'الإسدالات' : 
                                currentSlug === 'shawls' ? 'الشيلان' : formatSlugToName(currentSlug);
          
          setCategoryData({ name: fallbackTitle, description: "تشكيلة حصرية من WIND تناسب ذوقك." });
          currentCatName = fallbackTitle;
        }

        // ==========================================
// ==========================================
// 2. جلب المنتجات (بحث ذكي وموازي)
// ==========================================

// الاستعلام الأول: يبحث في نظام الـ Slugs (النظام الجديد في الأدمن)
const q1 = getDocs(query(
  collection(db, "products"),
  where("categories", "array-contains-any", [currentSlug, `/${currentSlug}`]),
  limit(40)
));

// الاستعلام الثاني: بيبحث في نظام الـ Type (نظام شوبيفاي القديم)
const q2 = getDocs(query(
  collection(db, "products"),
  where("type", "in", typeVariants),
  limit(40)
));

// تنفيذ الاستعلامين معاً ودمج النتائج (snap1 و snap2)
const [snap1, snap2] = await Promise.all([q1, q2]);

        // تنفيذ الاستعلامين في نفس الوقت لسرعة التحميل
        const [snap1, snap2] = await Promise.all([q1, q2]);
        
        // دمج النتائج بدون تكرار باستخدام Map
        const productsMap = new Map();
        
        snap1.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        snap2.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        
        // تحويل الـ Map لمصفوفة عشان نعرضها
        const productsData = Array.from(productsMap.values());
        
        setProducts(productsData);
      } catch (error) {
        console.error("WIND Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
  }, [currentSlug]);

  return (
    <main className="min-h-screen bg-[#121212] pt-24 pb-12" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* Header - دمج تصميم الكودين لضمان الفخامة */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter">
            {categoryData.name}
          </h1>
          <div className="flex justify-center items-center gap-4">
            <span className="h-[1px] w-10 bg-[#F5C518]"></span>
            <p className="text-[#F5C518] font-bold tracking-[0.3em] text-xs md:text-sm">
              WIND ESSENTIALS
            </p>
            <span className="h-[1px] w-10 bg-[#F5C518]"></span>
          </div>
          {categoryData.description && (
            <p className="mt-6 text-gray-400 max-w-2xl mx-auto font-light leading-relaxed italic">
              {categoryData.description}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5C518]"></div>
            <p className="mt-4 text-gray-500 font-bold">جاري تحميل تشكيلة WIND...</p>
          </div>
        ) : products.length > 0 ? (
          /* Grid - تصميم الكود الأول مع انيميشن الكود التاني */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 animate-in fade-in duration-700">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          /* Empty State - من الكود التاني (أشيك وأوضح) */
          <div className="text-center py-32 border border-[#333] rounded-3xl bg-[#1a1a1a]/50">
            <p className="text-gray-400 mb-8 text-lg">لا توجد قطع متوفرة في "{categoryData.name}" حالياً.</p>
            <Link href="/" className="bg-[#F5C518] text-black px-10 py-4 font-black text-sm hover:bg-white transition-all rounded-full active:scale-95">
              اكتشف باقي المجموعات
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}