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
  // const [isDescModalOpen, setDescModalOpen] = useState(false); // تم إيقاف استخدام مودال الوصف
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false); // حالة مودال تكبير الصورة
  
  // حالات تتبع السحب باللمس (Touch Swipe)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
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
            
            if (initialSize) {
              setSelectedSize(initialSize);
            } else {
              const sizesArray = fbProduct.options?.sizes || fbProduct.sizes;
              if (Array.isArray(sizesArray) && sizesArray.length > 0) setSelectedSize(sizesArray[0]);
            }

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
  
  // دوال التقليب للصورة
  const handleNextImage = () => {
    const currentIndex = gallery.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setActiveImage(gallery[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = gallery.indexOf(activeImage);
    const prevIndex = currentIndex === 0 ? gallery.length - 1 : currentIndex - 1;
    setActiveImage(gallery[prevIndex]);
  };

  // دوال تتبع السحب باللمس
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) handleNextImage();
    if (isRightSwipe) handlePrevImage();
  };
  
  // معالجة الألوان والمقاسات
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

  if (safeSizes.length === 0) {
    safeSizes = Array.isArray(product.options?.sizes) ? product.options.sizes : (Array.isArray(product.sizes) ? product.sizes : []);
  }
  if (safeColors.length === 0) {
    safeColors = Array.isArray(product.options?.colors) ? product.options.colors : [];
  }

  const currentColorImage = () => {
    if (!selectedColor) return gallery[1] || activeImage;
    const hexOrImage = product.colorSwatches?.[selectedColor];
    if (hexOrImage && (hexOrImage.startsWith('http') || hexOrImage.includes('/'))) {
      return hexOrImage;
    }
    return gallery[1] || activeImage;
  };
  
  // تم حذف دالة stripHtml والمتغير shortDescription لعدم الحاجة إليهما بعد الآن

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-32 font-sans selection:bg-[#F5C518] selection:text-black overflow-x-hidden">
      
      {/* 1. القسم السينمائي (Hero Section) مع دعم اللمس للتقليب */}
      <div 
        className="relative w-full h-[65vh] md:h-[70vh] bg-black group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-80 transition-all duration-500"
        />
        {/* تدرج لوني أعمق للتركيز على السعر والعنوان */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent pointer-events-none"></div>
        
        {/* سهم التقليب الكبير الاحترافي على اليسار */}
        <ChevronLeft size={50} strokeWidth={1} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 z-20 pointer-events-none animate-pulse" />

        {/* أيقونات التفاعل (يمين) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-10">
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

        {/* سهم التقليب الكبير على اليسار (تم استبداله بالأيقونة أعلاه) */}
        {/* <button onClick={handleNextImage} ... ><ChevronLeft ... /></button> */}

        {/* هيكلة جديدة لأسفل الصورة: اليمين (عنوان)، اليسار (سعر ومخزون) */}
        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-end z-20 pointer-events-none">
          
          {/* اليسار: السعر، الخصم، وحالة المخزون في سطر واحد */}
          <div className="flex items-center gap-3 drop-shadow-md bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
             <div className="flex items-end gap-2">
                <span style={{ fontFamily: 'Impact, sans-serif' }} className="text-2xl font-normal text-white">{product.price}</span>
                <span className="text-xs font-bold text-[#F5C518] mb-0.5">ج.م</span>
                {product.compareAtPrice && <span className="text-xs text-gray-400 line-through mb-0.5">{product.compareAtPrice}</span>}
             </div>
             <div className="h-4 w-px bg-white/20"></div> {/* فاصل */}
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر" : "غير متوفر"}
             </div>
          </div>

          {/* اليمين: اسم المنتج أصغر وتحته الكلمات الـ3 */}
          <div className="flex flex-col items-end text-right drop-shadow-md">
            <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">{product.title}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
              <span className="border border-white/20 px-1.5 rounded">WIND-24</span>
              <span>•</span>
              <span>{product.category || product.type || "أزياء"}</span>
              <span>•</span>
              <span className="text-[#F5C518]">WIND Series</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. منطقة البوستر والوصف التفصيلي (تم إعادة الهيكلة) */}
      <div className="px-4 py-8 max-w-5xl mx-auto" dir="rtl">
        
        {/* تم حذف قسم النبذة المختصرة وزر المزيد من هنا */}

        <div className="flex flex-col md:flex-row gap-8 items_start">
          
          {/* العمود الأيمن: البوستر الصغير وأيقونة التكبير تحته */}
          <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
             <div className="w-32 h-48 rounded-lg overflow-hidden border border-[#333] shadow-2xl relative z-10">
                {/* الصورة واضحة تماماً بدون أيقونات فوقها */}
                <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover" alt="poster" />
             </div>
             {/* زر التكبير أسفل البوستر */}
             <button 
               onClick={() => setImageZoomModalOpen(true)}
               className="flex items-center gap-2 text-gray-400 hover:text-[#F5C518] transition-colors group"
             >
                <Search size={18} />
                <span className="text-xs font-bold">تكبير الصورة</span>
             </button>
          </div>

          {/* العمود الأيسر: صندوق الوصف التفصيلي (بدلاً من المودال) */}
          <div className="flex-1 w-full bg-[#1a1a1a]/50 rounded-xl border border-[#333] overflow-hidden p-4">
              <h3 className="font-black text-lg text-white flex items-center gap-2 mb-4 border-b border-[#333] pb-3">
                <div className="w-1.5 h-5 bg-[#F5C518] rounded-full"></div>
                تفاصيل المنتج
              </h3>
              {/* محتوى الوصف بنفس تنسيقات المودال السابقة */}
              <div className="ql-editor-display dark-wind-tabs max-h-[500px] overflow-y-auto scrollbar-hide">
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
          </div>

        </div>

        {/* مدخل الألوان والمقاسات */}
        <div className="mt-8 space-y-6 border-t border-[#333]/50 pt-6">
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  اختر اللون: 
                  {selectedColor && <span className="text-[#F5C518] text-xs bg-[#222] border border-[#444] px-2 py-0.5 rounded-md">{selectedColor}</span>}
                </h3>
              </div>
              
              <div className="relative w-full">
                <div 
                  ref={colorsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar-horizontal pr-2"
                >
                  {safeColors.map((colorItem, idx) => {
                    const colorName = typeof colorItem === 'string' ? colorItem : colorItem.name;
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
                  
                  {safeColors.length > 4 && <div className="w-4 shrink-0"></div>}
                </div>
                
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
                
                <button 
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-[#F5C518] flex items-center gap-1.5 hover:bg-[#F5C518]/10 transition-all px-3 py-1.5 rounded-full border border-[#F5C518]/30"
                >
                  <Info size={14} /> دليل القياسات
                </button>
              </div>

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

      {/* 6. الزر السينمائي (Add to Cart) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-10 pb-4 px-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3" dir="rtl">
          
          <button 
            onClick={() => addToCart({ ...product, selectedSize, selectedColor, image: getImageUrl(activeImage) })}
            className="flex-1 bg-[#F5C518] text-black font-black text-lg py-4 rounded-[4px] shadow-lg hover:bg-[#ffdb4d] transition-all flex justify-center items-center gap-2 group"
          >
            <Plus size={22} className="transition-transform group-hover:scale-125" />
            أضف إلى حقيبتك ( {product.price} ج.م )
          </button>
          
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

      {/* تم إلغاء مودال الوصف المنبثق (isDescModalOpen) لأن الوصف أصبح معروضاً في الصفحة */}

      <SizeChartModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setSizeGuideOpen(false)} 
        product={product} 
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hide-scrollbar-horizontal::-webkit-scrollbar {
          height: 0px;
          background: transparent;
        }
        .hide-scrollbar-horizontal {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* تنسيقات الوصف داخل الصندوق الجديد */
        .dark-wind-tabs .wind-tabs-container { background: transparent !important; }
        .dark-wind-tabs .wind-tabs-container details {
          background: #222 !important;
          border: 1px solid #333 !important;
          border-radius: 8px;
          margin-bottom: 8px;
          padding: 5px 15px !important;
          transition: all 0.3s ease;
        }
        .dark-wind-tabs .wind-tabs-container details[open] { border-color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container summary { color: #fff !important; border: none !important; font-weight: bold; }
        .dark-wind-tabs .wind-tabs-container summary svg path { stroke: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container div { color: #aaa !important; line-height: 1.6; }
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom: 1px solid #333 !important; }
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"],
        .dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color: #e5e7eb !important; }
        .dark-wind-tabs .wind-tabs-container button,
        .dark-wind-tabs .wind-tabs-container .read-more-wrapper summary { color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container summary:hover { background-color: transparent !important; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .ql-editor-display ul { list-style-type: disc !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display ol { list-style-type: decimal !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display strong { font-weight: 900; color: #fff; }
      `}</style>
    </div>
  );
}