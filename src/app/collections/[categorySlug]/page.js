"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; // مسار نسبي مضمون
import { collection, query, where, getDocs } from "firebase/firestore";
import ProductCard from "../../../components/products/ProductCard"; // مسار نسبي مضمون

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", categorySlug)
        );
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [categorySlug]);

  // فك تشفير الاسم للعرض
  const categoryTitle = categorySlug === 'isdal' ? 'الإسدالات' : 
                        categorySlug === 'shawls' ? 'الشيلان' : 'التشكيلة';

  return (
    <main className="min-h-screen bg-[#121212] pt-24 pb-12" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* رأس الصفحة - قمت بدمجه هنا مباشرة بدلاً من استيراد ملف مفقود */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
            {categoryTitle}
          </h1>
          <p className="text-[#F5C518] font-bold tracking-[0.3em] text-sm">
            WIND ESSENTIALS
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">جاري تحميل المجموعة...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => (
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