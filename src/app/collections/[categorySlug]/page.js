import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ProductCard from "@/components/products/ProductCard";
import SectionHeader from "@/components/sections/SectionHeader";

export default async function CategoryPage({ params }) {
  // 1. الحصول على اسم القسم من الرابط (Slug)
  const { categorySlug } = params;

  // 2. جلب المنتجات من Firebase التي تنتمي لهذا القسم فقط
  const q = query(
    collection(db, "products"),
    where("category", "==", categorySlug)
  );
  
  const querySnapshot = await getDocs(q);
  const categoryProducts = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // فك تشفير الاسم للعرض (مثلاً: shawls تصبح "الشيلات")
  const categoryTitle = categorySlug === 'isdal' ? 'الإسدالات' : 
                       categorySlug === 'shawls' ? 'الشيلان' : 'التشكيلة';

  return (
    <main className="min-h-screen bg-[#121212] pt-24 pb-12" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* رأس الصفحة الديناميكي */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
            {categoryTitle}
          </h1>
          <p className="text-[#F5C518] font-bold tracking-[0.3em] text-sm">
            WIND ESSENTIALS
          </p>
        </div>

        {/* شبكة المنتجات - تظهر تلقائياً بمجرد إضافة منتج في Firebase */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-[#333]">
            <p className="text-gray-500">لا توجد منتجات في هذا القسم حالياً.</p>
          </div>
        )}
      </div>
    </main>
  );
}