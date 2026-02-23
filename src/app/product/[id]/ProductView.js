"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from '@/components/SizeChartModal';
// استدعاء الأيقونات الاحترافية لتعزيز التجربة السينمائية وكلمات الثقة
import { Play, Plus, Star, Info, Share2, Heart, ImageIcon, ChevronDown, X, Truck, Eye, ShieldCheck, ChevronLeft, Search, ChevronRight } from "lucide-react";

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
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false); // حالة مودال تكبير الصورة
  
  const colorsScrollRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const staticProduct = staticProducts.find((p) => p.id.toString() === id.toString());
      
      if (staticProduct) {
        setProduct(staticProduct);
        setActiveImage(staticProduct.mainImage);
        if (staticProduct.sizes?.length > 0) setSelectedSize(staticProduct.sizes[0]);
        if (staticProduct.colors?.length > 0) setSelectedColor(staticProduct.colors[0].name || staticProduct.colors[0]);
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

            // === الربط الذكي مع صفحة الإضافة (قراءة المقاسات والألوان الافتراضية) ===
            let initialSize = "";
            let initialColor = "";
            
            if (fbProduct.options && Array.isArray(fbProduct.options)) {
              fbProduct.options.forEach(opt => {
                const optName = (opt.name || "").toLowerCase();
                if ((optName.includes("size") || optName === "المقاس" || optName === "مقاس") && opt.values) {
                   initialSize = opt.values.split(',')[0].trim();
                }
                if ((optName.includes("color") || optName === "اللون" || optName === "لون") && opt.values) {
                   initialColor = opt.values.split(',')[0].trim();
                }
              });
            }
            
            // تعيين المقاس الافتراضي (سواء بالنظام الجديد أو القديم)
            if (initialSize) {
              setSelectedSize(initialSize);
            } else {
              const sizesArray = fbProduct.options?.sizes || fbProduct.sizes;
              if (Array.isArray(sizesArray) && sizesArray.length > 0) setSelectedSize(sizesArray[0]);
            }

            // تعيين اللون الافتراضي (سواء بالنظام الجديد أو القديم)
            if (initialColor) {
              setSelectedColor(initialColor);
            } else {
              const colorsArray = fbProduct.options?.colors;
              if (Array.isArray(colorsArray) && colorsArray.length > 0) {
                setSelectedColor(colorsArray[0].name || colorsArray[0]);
              }
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
  
  // دالة التقليب للصورة التالية
  const handleNextImage = () => {
    const currentIndex = gallery.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setActiveImage(gallery[nextIndex]);
  };
  
  // === معالجة الألوان والمقاسات لدعم (النظام الجديد) الخاص بلوحة التحكم و (النظام القديم) ===
  let safeSizes = [];
  let safeColors = [];

  if (product.options && Array.isArray(product.options)) {
    product.options.forEach(opt => {
      const optName = (opt.name || "").toLowerCase();
      if (optName.includes("size") || optName === "المقاس" || optName === "مقاس") {
        safeSizes = opt.values.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (optName.includes("color") || optName === "اللون" || optName === "لون") {
        safeColors = opt.values.split(',').map(c => c.trim()).filter(Boolean);
      }
    });
  }

  // دعم للأنظمة القديمة في الفايربيس إن وجدت
  if (safeSizes.length === 0) {
    safeSizes = Array.isArray(product.options?.sizes) ? product.options.sizes : (Array.isArray(product.sizes) ? product.sizes : []);
  }
  if (safeColors.length === 0) {
    safeColors = Array.isArray(product.options?.colors) ? product.options.colors : [];
  }

  // استخراج الصورة المرتبطة باللون المختار حالياً (للبوستر الصغير)
  const currentColorImage = () => {
    if (!selectedColor) return gallery[1] || activeImage;
    const hexOrImage = product.colorSwatches?.[selectedColor];
    if (hexOrImage && (hexOrImage.startsWith('http') || hexOrImage.includes('/'))) {
      return hexOrImage;
    }
    return gallery[1] || activeImage;
  };
  
  // دالة متطورة لحذف العناوين والكلمات الافتتاحية
  const stripHtml = (html) => {
    if (!html) return "";
    // حذف العناوين Tags وما بينها
    let clean = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    // تحويل الـ HTML لنص
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    let text = doc.body.textContent || "";
    // حذف الكلمات الافتتاحية مهما كانت طريقة كتابتها (عن المنتج، تفاصيل، الخ)
    const keywordsToRemove = [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i];
    keywordsToRemove.forEach(regex => {
      text = text.replace(regex, "");
    });
    return text.trim();
  };
  
  // 110 حرف بتدينا تقريباً سطرين متناسقين في الموبايل
  const shortDescription = stripHtml(product.description).substring(0, 110) + "... ";

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-32 font-sans selection:bg-[#F5C518] selection:text-black">
      
      {/* 1. القسم السينمائي (Hero Section) */}
      <div className="relative w-full h-[65vh] md:h-[75vh] bg-black group">
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-80 transition-all duration-500"
        />
        {/* تدرج لوني يعطي تأثير دمج مع الخلفية زي نتفليكس */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent pointer-events-none"></div>
        
        {/* التعديل الأول والثالث: أيقونات التفاعل بشكل طولي داخل الصورة + سهم التقليب */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
          <button className="flex flex-col items-center gap-1 text-white hover:text-[#F5C518] transition-colors drop-shadow-md">
            <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <ImageIcon size={20} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-lg">{gallery.length} صور</span>
          </button>
          
          <button 
            onClick={() => setIsWishlisted(!isWishlisted)} 
            className="flex flex-col items-center gap-1 text-white hover:text-[#F5C518] transition-colors drop-shadow-md"
          >
            <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <Heart size={20} fill={isWishlisted ? "#F5C518" : "none"} color={isWishlisted ? "#F5C518" : "currentColor"} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-lg">{product.likes || "1.2K"}</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-white hover:text-[#F5C518] transition-colors drop-shadow-md">
            <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <Share2 size={20} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-lg">مشاركة</span>
          </button>
        </div>

        {/* سهم التقليب الكبير على اليسار */}
        <button 
          onClick={handleNextImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <ChevronLeft size={40} strokeWidth={1.5} />
        </button>
      </div>

      {/* 3. منطقة الحبكة (Mini Poster & Synopsis & Options) */}
      <div className="px-4 py-6 max-w-4xl mx-auto" dir="rtl">
        {/* التعديل الثاني: العناصر الثلاثة تحت اسم المنتج + نبذة الوصف */}
        <div className="mb-4 pt-2">
          {/* تصغير الخط لـ 26px وتقليل المسافة السفلية لرفعه لفوق */}
          <h1 className="text-[26px] leading-tight font-black text-white mb-1.5 tracking-tight">{product.title}</h1>
          
          {/* العناصر التلاتة */}
          <div className="flex items-center gap-3 text-sm text-gray-300 font-medium mb-3">
            <span className="text-[#F5C518]">WIND Series</span>
            <span>•</span>
            <span>{product.category || product.type || "أزياء"}</span>
            <span>•</span>
            <span className="border border-gray-500 px-1.5 rounded text-xs bg-[#1a1a1a]">WIND-24</span>
          </div>

          {/* نبذة الوصف مع التدرج اللوني والزرار في نفس السطر */}
          <div className="relative text-sm leading-relaxed pr-2 border-r-2 border-[#333]">
            <span className="bg-gradient-to-l from-gray-400 via-gray-400 to-[#121212] bg-clip-text text-transparent">
              {shortDescription}
            </span>
            <button 
              onClick={() => setDescModalOpen(true)}
              className="inline-flex items-center gap-1 text-[#F5C518] font-bold mr-1 hover:underline decoration-1 underline-offset-4 whitespace-nowrap align-bottom"
            >
              المزيد عن المنتج <span className="w-3.5 h-3.5 rounded-full border border-[#F5C518] flex items-center justify-center text-[9px] font-black">!</span>
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-start border-t border-[#333]/50 pt-6">
          
          {/* البوستر المصغر (التعديل الرابع والسابع: مرتبط باللون + عدسة مكبرة) */}
          <div className="w-32 h-48 flex-shrink-0 rounded-md overflow-hidden border border-[#333] shadow-2xl relative group">
            <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="poster" />
            <div className="absolute top-0 left-0 bg-black/70 px-1 py-0.5 rounded-br-md">
              <Plus size={16} className="text-white" />
            </div>
            
            {/* أيقونة العدسة المكبرة */}
            <button 
              onClick={() => setImageZoomModalOpen(true)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <div className="bg-black/60 p-3 rounded-full border border-[#F5C518]/50 text-white hover:text-[#F5C518] hover:scale-110 transition-all shadow-lg">
                <Search size={24} />
              </div>
            </button>
          </div>

          {/* تفاصيل السعر والبيانات البيعية */}
          <div className="flex-1 flex flex-col justify-between min-h-[192px]">
            <div>
              {/* التاجز زي تصنيف الأفلام */}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-400 bg-[#1a1a1a]">Premium</span>
                <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-400 bg-[#1a1a1a]">Oversized</span>
              </div>
              
              {/* السعر والخصم - تم تعديل الخط ليكون أكثر احترافية كالماركات العالمية */}
              <div className="flex items-end gap-2 mt-2">
                <span style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.5px' }} className="text-4xl font-normal text-white">{product.price}</span>
                <span className="text-sm font-normal text-[#F5C518] mb-1.5">ج.م</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-gray-500 line-through mb-1.5 mr-2">{product.compareAtPrice} ج.م</span>
                )}
              </div>

              {/* حالة المخزون */}
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-400">{product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر في المخزون" : "غير متوفر"}</span>
              </div>

              {/* ملاحظة الشحن */}
              <div className="text-[10px] text-gray-500 mt-1.5">
                يتم احتساب مصاريف الشحن عند الدفع
              </div>

              {/* كلمات الثقة (Trust Badges) - سطر واحد وأيقونات شفافة */}
              <div className="flex items-center justify-between gap-1 mt-4 w-full bg-[#1a1a1a] p-2.5 rounded border border-[#333]">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-bold"><Truck size={14} className="text-[#F5C518]" /> شحن سريع</div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-bold"><Eye size={14} className="text-[#F5C518]" /> معاينة المنتجات</div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-bold"><ShieldCheck size={14} className="text-[#F5C518]" /> دفع آمن</div>
              </div>
            </div>
          </div>
        </div>

        {/* مدخل الألوان والمقاسات - تم نقلها أسفل منطقة الثقة مباشرة */}
        <div className="mt-6 space-y-6 border-t border-[#333]/50 pt-5">
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  اختر اللون: 
                  {selectedColor && <span className="text-[#F5C518] text-xs bg-[#222] border border-[#444] px-2 py-0.5 rounded-md">{selectedColor}</span>}
                </h3>
              </div>
              
              {/* التعديل الخامس: شريط الألوان الأفقي */}
              <div className="relative w-full">
                <div 
                  ref={colorsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar-horizontal pr-2"
                >
                  {safeColors.map((colorItem, idx) => {
                    // استخراج اسم اللون
                    const colorName = typeof colorItem === 'string' ? colorItem : colorItem.name;
                    // جلب درجة اللون أو الصورة المرتبطة
                    const hexOrImage = product.colorSwatches?.[colorName] || (typeof colorItem === 'object' ? colorItem.swatch : '#333333');
                    const isImage = hexOrImage.startsWith('http') || hexOrImage.includes('/');

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(colorName);
                          if (isImage) {
                            setActiveImage(hexOrImage);
                          }
                        }}
                        className="flex flex-col items-center gap-2 group shrink-0 snap-start"
                      >
                        <div className={`w-14 h-14 rounded-full p-1 transition-all ${selectedColor === colorName ? "border-2 border-[#F5C518] bg-[#F5C518]/10 scale-105" : "border border-[#333] hover:border-gray-500"}`}>
                          {isImage ? (
                            <img src={hexOrImage} className="w-full h-full rounded-full object-cover shadow-inner" alt={colorName} />
                          ) : (
                            <div style={{ backgroundColor: hexOrImage }} className="w-full h-full rounded-full shadow-inner border border-[#222]"></div>
                          )}
                        </div>
                        <span className={`text-xs font-bold uppercase ${selectedColor === colorName ? "text-white" : "text-gray-500"}`}>{colorName}</span>
                      </button>
                    );
                  })}
                  
                  {/* تريكة اللون المقطوع: مساحة فارغة في الآخر تعطي إيحاء بوجود المزيد لو كان العدد كبير */}
                  {safeColors.length > 4 && <div className="w-4 shrink-0"></div>}
                </div>
                
                {/* مؤشر السحب الجانبي لو الألوان كتير */}
                {safeColors.length > 4 && (
                  <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-[#121212] via-[#121212]/90 to-transparent flex items-center justify-start pointer-events-none border-l-2 border-[#333]">
                    <ChevronLeft size={16} className="text-gray-500 mr-1 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {safeSizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  اختر المقاس:
                  {selectedSize && <span className="text-[#F5C518] text-xs bg-[#222] border border-[#444] px-2 py-0.5 rounded-md">{selectedSize}</span>}
                </h3>
                
                {/* زر دليل المقاسات */}
                <button 
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-[#F5C518] flex items-center gap-1.5 hover:bg-[#F5C518]/10 transition-all px-3 py-1.5 rounded-full border border-[#F5C518]/30"
                >
                  <Info size={14} /> دليل القياسات
                </button>
              </div>

              {/* التعديل السادس: إخفاء أزرار المقاسات الكبيرة لو مقاس واحد */}
              {safeSizes.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {safeSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-12 flex items-center justify-center text-sm font-black rounded-md border transition-all ${
                        selectedSize === size ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105" : "bg-[#1a1a1a] text-gray-400 border-[#333] hover:border-gray-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <span className="text-white">{product.metafields?.fabric || "قطن 100% معالج ضد الانكماش"}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">القصّة (Fit): </span>
            <span className="text-white">{product.metafields?.fit || "مريح (Relaxed Fit) - مناسب للجنسين"}</span>
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

      {/* 🎬 مودال تكبير صورة اللون (الكارت المنبثق) */}
      {isImageZoomModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setImageZoomModalOpen(false)}
        >
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover" alt="Zoomed Color" />
            <button 
              onClick={() => setImageZoomModalOpen(false)} 
              className="absolute top-4 left-4 bg-black/60 hover:bg-black p-2 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm border border-white/20"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#F5C518]/30">
              <span className="text-[#F5C518] font-bold text-sm">{selectedColor}</span>
            </div>
          </div>
        </div>
      )}

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
        /* إخفاء شريط التمرير الأفقي للألوان مع الحفاظ على التمرير */
        /* ========================================== */
        .hide-scrollbar-horizontal::-webkit-scrollbar {
          height: 0px;
          background: transparent;
        }
        .hide-scrollbar-horizontal {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
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