"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";

// استيراد إعدادات Firebase
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      // 1. البحث في المنتجات الثابتة أولاً
      const staticProduct = staticProducts.find((p) => p.id.toString() === id.toString());
      
      if (staticProduct) {
        setProduct(staticProduct);
        setActiveImage(staticProduct.mainImage);
        if (staticProduct.sizes && staticProduct.sizes.length > 0) setSelectedSize(staticProduct.sizes[0]);
        setLoading(false);
      } else {
        // 2. إذا لم يوجد، البحث في Firebase
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const fbProduct = { id: docSnap.id, ...data };
            setProduct(fbProduct);
            // ضبط الصورة الأولى كصورة نشطة
            const firstImg = fbProduct.images ? fbProduct.images[0] : fbProduct.image;
            setActiveImage(firstImg);
            if (fbProduct.sizes && fbProduct.sizes.length > 0) setSelectedSize(fbProduct.sizes[0]);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-white text-center py-20 bg-[#121212] min-h-screen">جاري التحميل...</div>;
  if (!product) return <div className="text-white text-center py-20 bg-[#121212] min-h-screen">المنتج غير موجود</div>;

  // دالة ذكية لتحديد مسار الصورة
  const getImageUrl = (imgName) => {
    if (!imgName) return "";
    // إذا كان الرابط يبدأ بـ http فهو من Firebase
    if (imgName.startsWith("http")) return imgName;
    // وإلا فهو من المجلدات المحلية
    return `/images/products/${product.folderName}/${imgName}`;
  };

  // إنشاء معرض الصور بناءً على نوع المنتج (ثابت أم Firebase)
  const gallery = product.images 
    ? product.images // إذا كان من Firebase (مصفوفة روابط)
    : [product.mainImage, ...Array.from({ length: product.imagesCount || 0 }, (_, i) => `${i + 1}.webp`)];

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-24">
      
      {/* 1. رأس الصفحة (العنوان والتقييم) */}
      <div className="px-4 py-4 border-b border-[#333] flex justify-between items-start" dir="rtl">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">{product.title}</h1>
          <div className="text-gray-400 text-xs flex gap-2">
            <span>{product.category}</span>
            <span>•</span>
            <span>2026</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#F5C518] font-black text-lg">★ {product.rating || "4.9"}</span>
          <span className="text-gray-500 text-[10px]">تقييم WIND</span>
        </div>
      </div>

      {/* 2. منطقة الميديا */}
      <div className="relative w-full aspect-[3/4] md:aspect-video bg-black">
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-contain md:object-cover mx-auto"
        />
      </div>

      {/* 3. شريط الصور المصغرة (Gallery Strip) */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-[#1a1a1a] scrollbar-hide" dir="rtl">
        {gallery.map((img, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveImage(img)}
            className={`flex-shrink-0 w-20 h-28 rounded overflow-hidden border-2 transition-all ${activeImage === img ? "border-[#F5C518] opacity-100" : "border-transparent opacity-60"}`}
          >
            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`gallery-${idx}`} />
          </button>
        ))}
      </div>

      {/* 4. التفاصيل والاختيارات */}
      <div className="px-4 py-6 space-y-6" dir="rtl">
        
        {/* وصف المنتج */}
        <div>
          <h3 className="flex items-center gap-2 font-bold text-lg mb-2">
            <div className="w-1 h-5 bg-[#F5C518] rounded-full"></div>
            الوصف
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
        </div>

        {/* اختيار المقاس */}
        {product.sizes && product.sizes.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-white mb-3">المقاسات المتاحة:</h3>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-2 text-sm font-bold rounded border transition-all ${
                    selectedSize === size 
                    ? "bg-[#F5C518] text-black border-[#F5C518]" 
                    : "bg-[#222] text-gray-300 border-[#444] hover:bg-[#333]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* السعر وزر الشراء (Fixed Bottom Action) */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#333] p-4 z-50">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4" dir="rtl">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">الإجمالي</span>
              <span className="text-xl font-bold text-white">{product.price} <span className="text-sm font-normal">EGP</span></span>
            </div>
            
            <button 
              onClick={() => addToCart({ ...product, selectedSize, image: getImageUrl(activeImage) })}
              className="flex-1 bg-[#F5C518] hover:bg-[#e3b616] text-black font-bold py-3 rounded text-base flex justify-center items-center gap-2 transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              أضف للسلة
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}