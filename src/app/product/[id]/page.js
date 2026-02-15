"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
// --- الإضافة: استدعاء المكون الجديد ---
import SizeChartModal from '@/components/SizeChartModal';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // --- الإضافة: حالة فتح وإغلاق الدليل ---
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const staticProduct = staticProducts.find((p) => p.id.toString() === id.toString());
      
      if (staticProduct) {
        setProduct(staticProduct);
        setActiveImage(staticProduct.mainImage);
        if (staticProduct.sizes?.length > 0) setSelectedSize(staticProduct.sizes[0]);
        setLoading(false);
      } else {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const fbProduct = { id: docSnap.id, ...data };
            setProduct(fbProduct);
            
            const firstImg = fbProduct.images?.[0] || fbProduct.mainImageUrl || fbProduct.image;
            setActiveImage(firstImg);

            const sizesArray = fbProduct.options?.sizes || fbProduct.sizes;
            if (Array.isArray(sizesArray) && sizesArray.length > 0) {
              setSelectedSize(sizesArray[0]);
            }
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

  const getImageUrl = (imgName) => {
    if (!imgName) return "";
    if (imgName.startsWith("http")) return imgName;
    return `/images/products/${product.folderName}/${imgName}`;
  };

  const gallery = product.images || [product.mainImage, ...Array.from({ length: product.imagesCount || 0 }, (_, i) => `${i + 1}.webp`)];
  
  const safeSizes = Array.isArray(product.options?.sizes) ? product.options.sizes : (Array.isArray(product.sizes) ? product.sizes : []);
  const safeColors = Array.isArray(product.options?.colors) ? product.options.colors : [];

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-24">
      
      {/* 1. رأس الصفحة */}
      <div className="px-4 py-4 border-b border-[#333] flex justify-between items-start" dir="rtl">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1">{product.title}</h1>
          <div className="text-gray-400 text-xs flex gap-2">
            <span>{product.category}</span>
            <span>•</span>
            <span>Wind Exclusive</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#F5C518] font-black text-lg">★ {product.rating || "4.9"}</span>
        </div>
      </div>

      {/* 2. منطقة الميديا */}
      <div className="relative w-full aspect-[3/4] bg-[#1a1a1a]">
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-contain"
        />
      </div>

      {/* 3. شريط الصور المصغرة */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-[#1a1a1a] scrollbar-hide" dir="rtl">
        {gallery.filter(img => img).map((img, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveImage(img)}
            className={`flex-shrink-0 w-16 h-20 rounded overflow-hidden border-2 transition-all ${activeImage === img ? "border-[#F5C518]" : "border-transparent opacity-50"}`}
          >
            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
          </button>
        ))}
      </div>

      {/* 4. التفاصيل */}
      <div className="px-4 py-6 space-y-8" dir="rtl">
        
        {/* الوصف المطور */}
        <div className="mt-8">
          <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-[#F5C518]">
            <div className="w-1 h-5 bg-[#F5C518] rounded-full"></div>
            الوصف
          </h3>
          
          <div 
            className="text-gray-300 text-sm leading-relaxed ql-editor-display"
            dangerouslySetInnerHTML={{ __html: product.description }} 
          />
        </div>

        {/* اختيار اللون */}
        {safeColors.length > 0 && (
          <div>
            <h3 className="font-bold text-sm mb-3">الألوان المتوفرة:</h3>
            <div className="flex flex-wrap gap-4">
              {safeColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color.name)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all ${selectedColor === color.name ? "border-[#F5C518]" : "border-[#333]"}`}>
                    <img src={color.swatch} className="w-full h-full rounded-full object-cover" alt={color.name} />
                  </div>
                  <span className={`text-[10px] ${selectedColor === color.name ? "text-[#F5C518]" : "text-gray-500"}`}>{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* اختيار المقاس - تم التعديل هنا لإضافة زر الدليل */}
        {safeSizes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">المقاس:</h3>
              
              {/* زر دليل القياسات الذكي بستايل Wind */}
              {product.options?.sizeChart?.length > 0 && (
                <button 
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-[11px] text-[#F5C518] flex items-center gap-1 hover:brightness-125 transition-all cursor-pointer bg-[#333]/30 px-2 py-1 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  دليل القياسات
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {safeSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[50px] py-2 px-3 text-xs font-bold rounded border ${
                    selectedSize === size ? "bg-[#F5C518] text-black" : "bg-transparent border-[#333]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* السعر وزر الشراء */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#333] p-4 z-50">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4" dir="rtl">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">{product.price} EGP</span>
            </div>
            <button 
              onClick={() => addToCart({ ...product, selectedSize, selectedColor, image: getImageUrl(activeImage) })}
              className="flex-1 bg-[#F5C518] text-black font-bold py-3 rounded shadow-lg active:scale-95 transition"
            >
              أضف للسلة
            </button>
          </div>
        </div>
      </div>

      {/* --- الإضافة: استدعاء الـ Modal في نهاية الـ Container --- */}
      <SizeChartModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setSizeGuideOpen(false)} 
        product={product} 
      />

      {/* تـم وضـع الـسـتـايـل هـنـا داخـل الـ Component ليعمل بشكل صحيح */}
      <style jsx global>{`
        .ql-editor-display ul {
          list-style-type: disc !important;
          padding-right: 25px !important;
          margin-bottom: 10px;
        }
        .ql-editor-display ol {
          list-style-type: decimal !important;
          padding-right: 25px !important;
          margin-bottom: 10px;
        }
        .ql-editor-display strong {
          font-weight: bold;
          color: #fff;
        }
        .ql-editor-display h1, .ql-editor-display h2 {
          color: #F5C518;
          margin-top: 15px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}