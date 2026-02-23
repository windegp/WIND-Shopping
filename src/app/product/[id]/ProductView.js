"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from '@/components/SizeChartModal';
// استدعاء أيقونات احترافية لتعزيز التجربة السينمائية
import { Play, Plus, Star, Info, Share2, Heart, ImageIcon, ChevronDown, X } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDescModalOpen, setDescModalOpen] = useState(false); // حالة مودال الوصف السينمائي

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

  if (loading) return (
    <div className="h-screen bg-[#121212] flex flex-col items-center justify-center text-[#F5C518]">
      <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="font-bold tracking-widest animate-pulse">WIND ORIGINALS...</span>
    </div>
  );
  
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
    <div className="bg-[#121212] min-h-screen text-white pb-32 font-sans selection:bg-[#F5C518] selection:text-black">
      
      {/* 1. القسم السينمائي (Hero Section) */}
      <div className="relative w-full h-[65vh] md:h-[75vh] bg-black">
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-80"
        />
        {/* تدرج لوني يعطي تأثير دمج مع الخلفية زي نتفليكس */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
        
        {/* العنوان والبيانات الأساسية على الصورة */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">{product.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
            <span className="text-[#F5C518]">WIND Series</span>
            <span>•</span>
            <span>{product.category || "أزياء"}</span>
            <span>•</span>
            <span className="border border-gray-500 px-1.5 rounded text-xs bg-black/50">WIND-24</span>
          </div>
        </div>
      </div>

      {/* 2. شريط التفاعل (التريلر واللايكات) */}
      <div className="flex justify-center items-center gap-6 py-4 border-b border-[#333]/50 text-sm font-bold text-gray-300">
        <button className="flex items-center gap-2 hover:text-white transition-colors">
          <ImageIcon size={18} />
          <span>{gallery.length} صور الموديل</span>
        </button>
        <button 
          onClick={() => setIsWishlisted(!isWishlisted)} 
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <Heart size={18} fill={isWishlisted ? "#F5C518" : "none"} color={isWishlisted ? "#F5C518" : "currentColor"} />
          <span>{product.likes || "1.2K"}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-white transition-colors">
          <Share2 size={18} />
          <span>مشاركة</span>
        </button>
      </div>

      {/* 3. منطقة الحبكة (Mini Poster & Synopsis) */}
      <div className="px-4 py-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex gap-4 items-start">
          
          {/* البوستر المصغر */}
          <div className="w-28 h-40 flex-shrink-0 rounded-md overflow-hidden border border-[#333] shadow-2xl relative">
            <img src={getImageUrl(gallery[1] || activeImage)} className="w-full h-full object-cover" alt="poster" />
            <div className="absolute top-0 left-0 bg-black/70 px-1 py-0.5 rounded-br-md">
              <Plus size={16} className="text-white" />
            </div>
            {/* الشعار السينمائي */}
            <div className="absolute bottom-1 w-full text-center">
              <span className="text-[8px] font-black tracking-widest uppercase text-[#F5C518] drop-shadow-md">WIND EXCLUSIVE</span>
            </div>
          </div>

          {/* تفاصيل السعر والبيانات البيعية */}
          <div className="flex-1 pt-1 flex flex-col justify-between min-h-[160px]">
            <div>
              {/* التاجز زي تصنيف الأفلام */}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-400 bg-[#1a1a1a]">Premium</span>
                <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-400 bg-[#1a1a1a]">Oversized</span>
              </div>
              
              {/* السعر والخصم */}
              <div className="flex items-end gap-3 mt-3">
                <span className="text-3xl font-black text-white tracking-tight">{product.price} <span className="text-sm font-normal text-[#F5C518]">ج.م</span></span>
                {/* افتراض وجود سعر قديم للخصم، لو موجود هيظهر */}
                {product.oldPrice && (
                  <span className="text-sm text-gray-500 line-through mb-1.5">{product.oldPrice} ج.م</span>
                )}
              </div>

              {/* حالة المخزون */}
              <div className="flex items-center gap-2 mt-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-400">متوفر في المخزون</span>
              </div>

              {/* ملاحظة الشحن */}
              <div className="text-[10px] text-gray-500 mt-1.5">
                يتم احتساب مصاريف الشحن عند الدفع
              </div>

              {/* كلمات الثقة (Trust Badges) */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] text-gray-300 bg-[#222] border border-[#333] px-2 py-1 rounded">🛡️ دفع آمن</span>
                <span className="text-[10px] text-gray-300 bg-[#222] border border-[#333] px-2 py-1 rounded">🔄 استرجاع مجاني</span>
                <span className="text-[10px] text-gray-300 bg-[#222] border border-[#333] px-2 py-1 rounded">🚚 شحن سريع</span>
              </div>
            </div>
            
            {/* زرار فتح تفاصيل الوصف كاملة */}
            <button 
              onClick={() => setDescModalOpen(true)}
              className="text-left mt-4 text-[#F5C518] text-xs font-bold flex items-center justify-center gap-2 hover:brightness-125 w-full border border-[#F5C518]/30 px-3 py-2 rounded-md bg-[#F5C518]/10 transition-all"
            >
              عرض التفاصيل الكاملة للمنتج <Info size={14} />
            </button>
          </div>
        </div>

        {/* التقييم وفريق العمل (الخامات) */}
        <div className="mt-6 space-y-3 border-t border-[#333]/50 pt-4">
          <div className="flex items-center gap-3">
            <Star className="text-[#F5C518]" fill="#F5C518" size={20} />
            <span className="font-black text-lg">{product.rating || "4.9"}<span className="text-gray-500 text-sm font-normal">/5</span></span>
            <span className="text-gray-500 text-sm">{product.reviewsCount || "490K"} تقييم</span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-400">الخامة الأساسية: </span>
            <span className="text-white">قطن 100% معالج ضد الانكماش</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">القصّة (Fit): </span>
            <span className="text-white">مريح (Relaxed Fit) - مناسب للجنسين</span>
          </div>
        </div>
      </div>

      {/* 4. معرض الحلقات (معرض الصور) */}
      <div className="mt-2 border-t border-[#333]/50 pt-6">
        <h3 className="px-4 font-bold text-lg mb-4 text-white">معرض اللقطات (Gallery)</h3>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide" dir="rtl">
          {gallery.filter(img => img).map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`flex-shrink-0 relative w-32 h-44 rounded-md overflow-hidden transition-all duration-300 ${activeImage === img ? "ring-2 ring-[#F5C518] scale-105" : "border border-[#333] opacity-60 hover:opacity-100"}`}
            >
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold">
                لقطة {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. الاختيارات (الألوان والمقاسات) */}
      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 border-t border-[#333]/50" dir="rtl">
        
        {safeColors.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-400 mb-3 uppercase tracking-widest">اختر اللون (Color)</h3>
            <div className="flex flex-wrap gap-4">
              {safeColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color.name)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 rounded-full p-1 transition-all ${selectedColor === color.name ? "border-2 border-[#F5C518] bg-[#F5C518]/10" : "border border-[#333]"}`}>
                    <img src={color.swatch} className="w-full h-full rounded-full object-cover" alt={color.name} />
                  </div>
                  <span className={`text-xs font-bold ${selectedColor === color.name ? "text-white" : "text-gray-500"}`}>{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {safeSizes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest">اختر المقاس (Size)</h3>
              
              {/* زر دليل المقاسات */}
              <button 
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-[#F5C518] flex items-center gap-1.5 hover:bg-[#F5C518]/10 transition-all px-3 py-1.5 rounded-full border border-[#F5C518]/30"
              >
                <Info size={14} /> دليل القياسات
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {safeSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[60px] h-12 flex items-center justify-center text-sm font-black rounded-md border transition-all ${
                    selectedSize === size ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-[#1a1a1a] text-gray-400 border-[#333] hover:border-gray-500"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. الزر السينمائي (Add to Cart / Watchlist) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-10 pb-4 px-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3" dir="rtl">
          
          <button 
            onClick={() => addToCart({ ...product, selectedSize, selectedColor, image: getImageUrl(activeImage) })}
            className="flex-1 bg-[#F5C518] text-black font-black text-lg py-4 rounded-[4px] shadow-lg hover:bg-[#ffdb4d] transition-all flex justify-center items-center gap-2 group"
          >
            <Plus size={22} className="transition-transform group-hover:scale-125" />
            أضف إلى حقيبتك ( {product.price} ج.م )
          </button>
          
          {/* زر التفضيلات (Dropdown style from Netflix) */}
          <button className="bg-[#242424] p-4 rounded-[4px] text-white hover:bg-[#333] transition-colors border border-[#444]">
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* 🎬 مودال تفاصيل الوصف (الكارت السينمائي) */}
      {isDescModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#121212] w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
            {/* رأس المودال */}
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a] sticky top-0 z-10">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#F5C518] rounded-full"></div>
                معلومات المنتج والتفاصيل
              </h3>
              <button onClick={() => setDescModalOpen(false)} className="bg-[#242424] hover:bg-[#333] p-1.5 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            {/* محتوى الوصف بكامل تصميمه لكن الكلاس dark-wind-tabs بيعكس ألوانه */}
            <div className="p-5 overflow-y-auto ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          </div>
        </div>
      )}

      <SizeChartModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setSizeGuideOpen(false)} 
        product={product} 
      />

      <style jsx global>{`
        /* أنيميشن الدخول */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========================================== */
        /* 1. تنسيقات إخفاء الأكورديون في العرض المصغر (تم تعطيلها لأن الوصف أصبح في المودال فقط) */
        /* ========================================== */
        .preview-description .wind-tabs-container details:not(:first-child) { display: none !important; }
        .preview-description .wind-tabs-container summary { display: none !important; }
        .preview-description .wind-tabs-container .read-more-wrapper { display: none !important; }
        .preview-description .wind-tabs-container { background: transparent !important; }
        .preview-description .wind-tabs-container div { 
          color: #d1d5db !important;
          font-size: 11px !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* ========================================== */
        /* 2. تحويل ألوان تصميمك للوضع الليلي داخل المودال (Dark Mode) */
        /* ========================================== */
        .dark-wind-tabs .wind-tabs-container {
          background: transparent !important;
        }
        .dark-wind-tabs .wind-tabs-container details {
          background: #1a1a1a !important;
          border-bottom: 1px solid #333 !important;
          border-radius: 8px;
          margin-bottom: 8px;
          padding: 0 15px !important;
          transition: all 0.3s ease;
        }
        .dark-wind-tabs .wind-tabs-container details[open] {
          border-color: #F5C518 !important;
        }
        .dark-wind-tabs .wind-tabs-container summary {
          color: #fff !important;
          border: none !important;
        }
        /* تلوين أسهم الفتح والقفل باللون الأصفر */
        .dark-wind-tabs .wind-tabs-container summary svg path {
          stroke: #F5C518 !important; 
        }
        /* تلوين النصوص الداخلية */
        .dark-wind-tabs .wind-tabs-container div {
          color: #a1a1aa !important;
        }
        /* تغيير اللون العنابي (أحمر ويند القديم) للأصفر السينمائي */
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] {
          color: #F5C518 !important;
        }
        /* خطوط الفواصل الداخلية في المواصفات */
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] {
          border-bottom: 1px solid #333 !important;
        }
        /* العناوين الداخلية (زي الخامة، التصميم) */
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"],
        .dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] {
          color: #e5e7eb !important;
        }
        /* الأزرار (دليل القياسات / اقرأ المزيد) */
        .dark-wind-tabs .wind-tabs-container button,
        .dark-wind-tabs .wind-tabs-container .read-more-wrapper summary {
          color: #F5C518 !important;
        }
        .dark-wind-tabs .wind-tabs-container summary:hover {
          background-color: transparent !important;
        }

        /* إخفاء شريط التمرير لمعرض الصور */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* تنسيق الوصف */
        .ql-editor-display ul { list-style-type: disc !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display ol { list-style-type: decimal !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display strong { font-weight: 900; color: #fff; }
      `}</style>
    </div>
  );
}