"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from '@/components/SizeChartModal';
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
  const [isDescModalOpen, setDescModalOpen] = useState(false);
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false);
  
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

  // bg-[#121212] → bg-[#f5f5f0]
  if (loading) return (
    <div className="h-screen bg-[#f5f5f0] flex flex-col items-center justify-center text-[#F5C518]">
      <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="font-bold tracking-widest animate-pulse">WIND ORIGINALS...</span>
    </div>
  );
  
  // text-white → text-gray-900 ، bg-[#121212] → bg-[#f5f5f0]
  if (!product) return <div className="text-gray-900 text-center py-20 bg-[#f5f5f0] min-h-screen">المنتج غير موجود</div>;

  const getImageUrl = (imgName) => {
    if (!imgName) return "";
    if (imgName.startsWith("http")) return imgName;
    return `/images/products/${product.folderName}/${imgName}`;
  };

  const gallery = product.images || [product.mainImage, ...Array.from({ length: product.imagesCount || 0 }, (_, i) => `${i + 1}.webp`)];
  
  const handleNextImage = () => {
    const currentIndex = gallery.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setActiveImage(gallery[nextIndex]);
  };
  
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
  
  const stripHtml = (html) => {
    if (!html) return "";
    let clean = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    let text = doc.body.textContent || "";
    const keywordsToRemove = [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i];
    keywordsToRemove.forEach(regex => { text = text.replace(regex, ""); });
    return text.trim();
  };
  
  const shortDescription = stripHtml(product.description).substring(0, 110) + "... ";

  return (
    // bg-[#121212] → bg-[#f5f5f0] ، text-white → text-gray-900
    <div className="bg-[#f5f5f0] min-h-screen text-gray-900 pb-32 font-sans selection:bg-[#F5C518] selection:text-black">
      
      {/* Hero Section */}
      {/* bg-black → bg-gray-100 */}
      <div className="relative w-full h-[65vh] md:h-[75vh] bg-gray-100 group">
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-90 transition-all duration-500"
        />
        {/* from-[#121212] via-[#121212]/40 → from-[#f5f5f0] via-[#f5f5f0]/40 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f5f0] via-[#f5f5f0]/40 to-transparent pointer-events-none"></div>
        
        {/* أيقونات التفاعل — bg-black/40 → bg-white/70 ، border-white/20 → border-gray-300 ، text-white → text-gray-700 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
          <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#F5C518] transition-colors drop-shadow-md">
            <div className="bg-white/70 p-2.5 rounded-full backdrop-blur-md border border-gray-300">
              <ImageIcon size={20} />
            </div>
            <span className="text-[10px] font-bold drop-shadow-lg">{gallery.length} صور</span>
          </button>
          
          <button 
            onClick={() => setIsWishlisted(!isWishlisted)} 
            className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#F5C518] transition-colors drop-shadow-md"
          >
            <div className="bg-white/70 p-2.5 rounded-full backdrop-blur-md border border-gray-300">
              <Heart size={20} fill={isWishlisted ? "#F5C518" : "none"} color={isWishlisted ? "#F5C518" : "currentColor"} />
            </div>
            <span className="text-[10px] font-bold drop-shadow-lg">{product.likes || "1.2K"}</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#F5C518] transition-colors drop-shadow-md">
            <div className="bg-white/70 p-2.5 rounded-full backdrop-blur-md border border-gray-300">
              <Share2 size={20} />
            </div>
            <span className="text-[10px] font-bold drop-shadow-lg">مشاركة</span>
          </button>
        </div>

        {/* سهم التقليب — bg-black/20 → bg-white/50 ، border-white/10 → border-gray-300 ، text-white/70 → text-gray-600 */}
        <button 
          onClick={handleNextImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 p-3 rounded-full backdrop-blur-sm border border-gray-300 text-gray-600 hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <ChevronLeft size={40} strokeWidth={1.5} />
        </button>
      </div>

      {/* منطقة التفاصيل */}
      <div className="px-4 py-6 max-w-4xl mx-auto" dir="rtl">
        <div className="mb-4 pt-2">
          {/* text-white → text-gray-900 */}
          <h1 className="text-[26px] leading-tight font-black text-gray-900 mb-1.5 tracking-tight">{product.title}</h1>
          
          {/* text-gray-300 → text-gray-500 ، border-gray-500 → border-gray-300 ، bg-[#1a1a1a] → bg-gray-100 */}
          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-3">
            <span className="text-[#F5C518]">WIND Series</span>
            <span>•</span>
            <span>{product.category || product.type || "أزياء"}</span>
            <span>•</span>
            <span className="border border-gray-300 px-1.5 rounded text-xs bg-gray-100">WIND-24</span>
          </div>

          {/* border-[#333] → border-gray-300 ، from-gray-400 via-gray-400 to-[#121212] → from-gray-500 via-gray-500 to-[#f5f5f0] */}
          <div className="relative text-sm leading-relaxed pr-2 border-r-2 border-gray-300">
            <span className="bg-gradient-to-l from-gray-500 via-gray-500 to-[#f5f5f0] bg-clip-text text-transparent">
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

        {/* border-[#333]/50 → border-gray-200 */}
        <div className="flex gap-4 items-start border-t border-gray-200 pt-6">
          
          {/* البوستر — border-[#333] → border-gray-200 ، shadow-2xl يفضل */}
          <div className="w-32 h-48 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 shadow-md relative group">
            <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="poster" />
            {/* bg-black/70 → bg-gray-900/60 */}
            <div className="absolute top-0 left-0 bg-gray-900/60 px-1 py-0.5 rounded-br-md">
              <Plus size={16} className="text-white" />
            </div>
            
            {/* bg-black/40 → bg-white/30 */}
            <button 
              onClick={() => setImageZoomModalOpen(true)}
              className="absolute inset-0 bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              {/* bg-black/60 → bg-white/80 ، text-white → text-gray-800 */}
              <div className="bg-white/80 p-3 rounded-full border border-[#F5C518]/50 text-gray-800 hover:text-[#F5C518] hover:scale-110 transition-all shadow-lg">
                <Search size={24} />
              </div>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-between min-h-[192px]">
            <div>
              {/* border-[#444] → border-gray-300 ، bg-[#1a1a1a] → bg-gray-100 ، text-gray-400 → text-gray-500 */}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="border border-gray-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100">Premium</span>
                <span className="border border-gray-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100">Oversized</span>
              </div>
              
              {/* text-white → text-gray-900 */}
              <div className="flex items-end gap-2 mt-2">
                <span style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.5px' }} className="text-4xl font-normal text-gray-900">{product.price}</span>
                <span className="text-sm font-normal text-[#F5C518] mb-1.5">ج.م</span>
                {product.compareAtPrice && (
                  // text-gray-500 → text-gray-400
                  <span className="text-sm text-gray-400 line-through mb-1.5 mr-2">{product.compareAtPrice} ج.م</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {/* text-green-400 → text-green-600 */}
                <span className="text-xs font-bold text-green-600">{product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر في المخزون" : "غير متوفر"}</span>
              </div>

              {/* text-gray-500 → text-gray-400 */}
              <div className="text-[10px] text-gray-400 mt-1.5">
                يتم احتساب مصاريف الشحن عند الدفع
              </div>

              {/* bg-[#1a1a1a] → bg-white ، border-[#333] → border-gray-200 ، text-gray-300 → text-gray-600 */}
              <div className="flex items-center justify-between gap-1 mt-4 w-full bg-white p-2.5 rounded border border-gray-200">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold"><Truck size={14} className="text-[#F5C518]" /> شحن سريع</div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold"><Eye size={14} className="text-[#F5C518]" /> معاينة المنتجات</div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold"><ShieldCheck size={14} className="text-[#F5C518]" /> دفع آمن</div>
              </div>
            </div>
          </div>
        </div>

        {/* border-[#333]/50 → border-gray-200 */}
        <div className="mt-6 space-y-6 border-t border-gray-200 pt-5">
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                {/* text-gray-400 → text-gray-500 ، bg-[#222] → bg-gray-100 ، border-[#444] → border-gray-300 */}
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  اختر اللون: 
                  {selectedColor && <span className="text-[#F5C518] text-xs bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md">{selectedColor}</span>}
                </h3>
              </div>
              
              <div className="relative w-full">
                <div 
                  ref={colorsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar-horizontal pr-2"
                >
                  {safeColors.map((colorItem, idx) => {
                    const colorName = typeof colorItem === 'string' ? colorItem : colorItem.name;
                    // '#333333' → '#e5e7eb' (اللون الافتراضي للـ swatch في الـ light theme)
                    const hexOrImage = product.colorSwatches?.[colorName] || (typeof colorItem === 'object' ? colorItem.swatch : '#e5e7eb');
                    const isImage = hexOrImage.startsWith('http') || hexOrImage.includes('/');

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(colorName);
                          if (isImage) setActiveImage(hexOrImage);
                        }}
                        className="flex flex-col items-center gap-2 group shrink-0 snap-start"
                      >
                        {/* border-[#333] → border-gray-200 ، hover:border-gray-500 → hover:border-gray-400 */}
                        <div className={`w-14 h-14 rounded-full p-1 transition-all ${selectedColor === colorName ? "border-2 border-[#F5C518] bg-[#F5C518]/10 scale-105" : "border border-gray-200 hover:border-gray-400"}`}>
                          {isImage ? (
                            <img src={hexOrImage} className="w-full h-full rounded-full object-cover shadow-inner" alt={colorName} />
                          ) : (
                            // border-[#222] → border-gray-200
                            <div style={{ backgroundColor: hexOrImage }} className="w-full h-full rounded-full shadow-inner border border-gray-200"></div>
                          )}
                        </div>
                        {/* text-white → text-gray-900 ، text-gray-500 → text-gray-400 */}
                        <span className={`text-xs font-bold uppercase ${selectedColor === colorName ? "text-gray-900" : "text-gray-400"}`}>{colorName}</span>
                      </button>
                    );
                  })}
                  
                  {safeColors.length > 4 && <div className="w-4 shrink-0"></div>}
                </div>
                
                {/* from-[#121212] via-[#121212]/90 → from-[#f5f5f0] via-[#f5f5f0]/90 ، border-[#333] → border-gray-200 ، text-gray-500 → text-gray-400 */}
                {safeColors.length > 4 && (
                  <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-[#f5f5f0] via-[#f5f5f0]/90 to-transparent flex items-center justify-start pointer-events-none border-l-2 border-gray-200">
                    <ChevronLeft size={16} className="text-gray-400 mr-1 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {safeSizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                {/* text-gray-400 → text-gray-500 ، bg-[#222] → bg-gray-100 ، border-[#444] → border-gray-300 */}
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  اختر المقاس:
                  {selectedSize && <span className="text-[#F5C518] text-xs bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md">{selectedSize}</span>}
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
                      // selected: bg-gray-900 text-white ← أوضح من bg-white text-black في اللايت تيم
                      // unselected: bg-white border-gray-200 text-gray-500 بدل bg-[#1a1a1a] border-[#333] text-gray-400
                      className={`min-w-[60px] h-12 flex items-center justify-center text-sm font-black rounded-md border transition-all ${
                        selectedSize === size
                          ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
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

        {/* border-[#333]/50 → border-gray-200 */}
        <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3">
            <Star className="text-[#F5C518]" fill="#F5C518" size={20} />
            {/* text-white → text-gray-900 ، text-gray-500 يفضل */}
            <span className="font-black text-lg text-gray-900">{product.rating || "4.9"}<span className="text-gray-500 text-sm font-normal">/5</span></span>
            <span className="text-gray-500 text-sm">{product.reviewsCount || "490K"} تقييم</span>
          </div>
          
          <div className="text-sm">
            {/* text-gray-400 → text-gray-500 ، text-white → text-gray-900 */}
            <span className="text-gray-500">الخامة الأساسية: </span>
            <span className="text-gray-900">{product.metafields?.fabric || "قطن 100% معالج ضد الانكماش"}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">القصّة (Fit): </span>
            <span className="text-gray-900">{product.metafields?.fit || "مريح (Relaxed Fit) - مناسب للجنسين"}</span>
          </div>
        </div>
      </div>

      {/* معرض الصور — border-[#333]/50 → border-gray-200 ، text-white → text-gray-900 */}
      <div className="mt-2 border-t border-gray-200 pt-6">
        <h3 className="px-4 font-bold text-lg mb-4 text-gray-900">معرض اللقطات (Gallery)</h3>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide" dir="rtl">
          {gallery.filter(img => img).map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveImage(img)}
              // border-[#333] → border-gray-200
              className={`flex-shrink-0 relative w-32 h-44 rounded-md overflow-hidden transition-all duration-300 ${activeImage === img ? "ring-2 ring-[#F5C518] scale-105" : "border border-gray-200 opacity-60 hover:opacity-100"}`}
            >
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
              {/* bg-black/80 → bg-gray-900/70 */}
              <div className="absolute bottom-2 right-2 bg-gray-900/70 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                لقطة {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* زر Add to Cart — from-black via-black/95 → from-[#f5f5f0] via-[#f5f5f0]/95 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#f5f5f0] via-[#f5f5f0]/95 to-transparent pt-10 pb-4 px-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3" dir="rtl">
          
          {/* زر الإضافة — لم يتغير (أصفر/أسود) */}
          <button 
            onClick={() => addToCart({ ...product, selectedSize, selectedColor, image: getImageUrl(activeImage) })}
            className="flex-1 bg-[#F5C518] text-black font-black text-lg py-4 rounded-[4px] shadow-lg hover:bg-[#ffdb4d] transition-all flex justify-center items-center gap-2 group"
          >
            <Plus size={22} className="transition-transform group-hover:scale-125" />
            أضف إلى حقيبتك ( {product.price} ج.م )
          </button>
          
          {/* bg-[#242424] → bg-white ، border-[#444] → border-gray-300 ، text-white → text-gray-700 */}
          <button className="bg-white p-4 rounded-[4px] text-gray-700 hover:bg-gray-100 transition-colors border border-gray-300">
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* مودال تكبير الصورة — bg-black/90 → bg-black/80 ، باقي العناصر على الصورة تفضل داكنة */}
      {isImageZoomModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setImageZoomModalOpen(false)}
        >
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover" alt="Zoomed Color" />
            {/* العناصر دي على صورة فاتفضل داكنة */}
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

      {/* مودال الوصف — bg-[#121212] → bg-white ، border-[#333] → border-gray-200 */}
      {isDescModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
            {/* bg-[#1a1a1a] → bg-gray-50 ، border-[#333] → border-gray-200 ، text-white → text-gray-900 */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#F5C518] rounded-full"></div>
                معلومات المنتج والتفاصيل
              </h3>
              {/* bg-[#242424] → bg-gray-100 ، text-gray-400 → text-gray-500 */}
              <button onClick={() => setDescModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            {/* dark-wind-tabs → light-wind-tabs */}
            <div className="p-5 overflow-y-auto ql-editor-display light-wind-tabs" dir="rtl">
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hide-scrollbar-horizontal::-webkit-scrollbar { height: 0px; background: transparent; }
        .hide-scrollbar-horizontal { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Light theme للـ description modal ── */
        .light-wind-tabs .wind-tabs-container { background: transparent !important; }
        .light-wind-tabs .wind-tabs-container details {
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-radius: 8px;
          margin-bottom: 8px;
          padding: 0 15px !important;
          transition: all 0.3s ease;
        }
        .light-wind-tabs .wind-tabs-container details[open] { border-color: #F5C518 !important; }
        .light-wind-tabs .wind-tabs-container summary { color: #111827 !important; border: none !important; }
        .light-wind-tabs .wind-tabs-container summary svg path { stroke: #F5C518 !important; }
        .light-wind-tabs .wind-tabs-container div { color: #6b7280 !important; }
        .light-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color: #F5C518 !important; }
        .light-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom: 1px solid #e5e7eb !important; }
        .light-wind-tabs .wind-tabs-container div[style*="color: #111827"],
        .light-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color: #111827 !important; }
        .light-wind-tabs .wind-tabs-container button,
        .light-wind-tabs .wind-tabs-container .read-more-wrapper summary { color: #F5C518 !important; }
        .light-wind-tabs .wind-tabs-container summary:hover { background-color: transparent !important; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .ql-editor-display ul { list-style-type: disc !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display ol { list-style-type: decimal !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display strong { font-weight: 900; color: #111827; }
      `}</style>
    </div>
  );
}