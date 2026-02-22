"use client";
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from 'next/link';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if(!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(products.filter(p => p.id !== id));
      alert("تم الحذف بنجاح");
    } catch (error) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  if(loading) return <div className="text-center mt-20 text-[#F5C518]">جاري تحميل منتجات WIND...</div>;

  return (
    <div dir="rtl" className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">المنتجات</h2>
        <Link href="/admin/products/create" className="bg-[#F5C518] text-black px-4 py-2 rounded font-bold hover:bg-[#ffdb4d] transition-colors">
          + إضافة منتج
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded border border-[#333] overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#222] text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">الصورة</th>
              <th className="p-4">المنتج</th>
              <th className="p-4">السعر</th>
              <th className="p-4">القسم</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {products.map((product) => {
              
              // --- معالجة ذكية للبيانات لدعم الطريقة القديمة والجديدة (Shopify) ---
              
              // 1. تحديد الصورة
              const displayImage = product.images?.[0] || product.mainImageUrl || product.image;
              
              // 2. تحديد السعر
              const displayPrice = product.price || (product.variants && product.variants[0]?.price) || "0";
              
              // 3. تحديد القسم (نعطي الأولوية لبيانات شوبيفاي ثم القديمة)
              let displayCategory = 'عام';
              if (product.type) displayCategory = product.type;
              else if (product.category) displayCategory = product.category;
              else if (product.collections) displayCategory = product.collections;
              else if (Array.isArray(product.categories) && product.categories.length > 0) displayCategory = product.categories.join('، ');

              return (
                <tr key={product.id} className="hover:bg-[#222] transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden border border-[#333]">
                      {displayImage && (
                        <img 
                          src={displayImage} 
                          className="w-full h-full object-cover" 
                          alt={product.title || 'Product'}
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">{product.title || 'بدون اسم'}</td>
                  <td className="p-4 text-[#F5C518]">{displayPrice} ج.م</td>
                  <td className="p-4 text-gray-400">
                    {displayCategory}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-4">
                      {/* رابط التعديل يرسل الـ ID كـ Query Parameter ليتم سحبه في صفحة الإنشاء */}
                      <Link 
                        href={`/admin/products/create?id=${product.id}`} 
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        تعديل
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="text-red-500 hover:text-red-400 font-medium transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-20 text-center text-gray-500 bg-[#1a1a1a]">
            لا توجد منتجات حالياً في WIND.
          </div>
        )}
      </div>
    </div>
  );
}