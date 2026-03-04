"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from "@/components/SizeChartModal";
import { Plus, Minus, Star, Info, Share2, Heart, ImageIcon, ChevronDown, X, Truck, Eye, ShieldCheck, ChevronLeft, ChevronRight, Search, ShoppingBag, CreditCard, Banknote } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const { addToCart }                       = useCart();
  const [activeImage, setActiveImage]       = useState("");
  const [activeIdx, setActiveIdx]           = useState(0);
  const [selectedSize, setSelectedSize]     = useState("");
  const [selectedColor, setSelectedColor]   = useState("");
  const [quantity, setQuantity]             = useState(1);
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [isWishlisted, setIsWishlisted]     = useState(false);
  const [isGalleryOpen, setGalleryOpen]     = useState(false);
  const [galleryIdx, setGalleryIdx]         = useState(0);
  const [isZoomed, setIsZoomed]             = useState(false); // لحالة التكبير داخل المعرض
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false); 
  const [isDescModalOpen, setDescModalOpen] = useState(false); 

  const touchStartX = useRef(null);
  const colorsRef   = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const sp = staticProducts.find(p => p.id.toString() === id.toString());
      if (sp) {
        setProduct(sp);
        setActiveImage(sp.mainImage);
        if (sp.sizes?.length  > 0) setSelectedSize(sp.sizes[0]);
        if (sp.colors?.length > 0) setSelectedColor(sp.colors[0].name || sp.colors[0]);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          const fb = { id: snap.id, ...snap.data() };
          setProduct(fb);
          setActiveImage(fb.images?.[0] || fb.mainImageUrl || fb.image);
          let iS = "", iC = "";
          if (fb.options && Array.isArray(fb.options)) {
            fb.options.forEach(opt => {
              const n = (opt.name || "").toLowerCase();
              if ((n.includes("size") || n === "المقاس" || n === "مقاس") && opt.values) iS = opt.values.split(",")[0].trim();
              if ((n.includes("color")|| n === "اللون"  || n === "لون")   && opt.values) iC = opt.values.split(",")[0].trim();
            });
          }
          if (iS) setSelectedSize(iS);
          else { const a = fb.options?.sizes || fb.sizes; if (Array.isArray(a) && a.length) setSelectedSize(a[0]); }
          if (iC) setSelectedColor(iC);
          else { const a = fb.options?.colors; if (Array.isArray(a) && a.length) setSelectedColor(a[0].name || a[0]); }
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="h-screen bg-[#121212] flex flex-col items-center justify-center text-[#F5C518] gap-4">
      <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="font-bold tracking-widest animate-pulse" style={{fontFamily:"Cairo,sans-serif"}}>WIND ORIGINALS...</span>
    </div>
  );
  
  if (!product) return (
    <div className="bg-[#121212] min-h-screen flex items-center justify-center text-gray-500" style={{fontFamily:"Cairo,sans-serif"}}>المنتج غير موجود</div>
  );

  const getImageUrl = img => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `/images/products/${product.folderName}/${img}`;
  };

  const gallery = product.images || [product.mainImage, ...Array.from({length: product.imagesCount || 0}, (_, i) => `${i+1}.webp`)];

  const handleNextImage = () => {
    const currentIndex = gallery.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setActiveImage(gallery[nextIndex]);
    setActiveIdx(nextIndex);
  };

  const openGallery = idx => { setGalleryIdx(idx); setIsZoomed(false); setGalleryOpen(true); };
  const galleryNext = () => { setGalleryIdx(i => (i + 1) % gallery.length); setIsZoomed(false); };
  const galleryPrev = () => { setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length); setIsZoomed(false); };
  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx > 0 ? galleryPrev() : galleryNext();
    touchStartX.current = null;
  };

  let safeSizes = [], safeColors = [];
  if (product.options && Array.isArray(product.options)) {
    product.options.forEach(opt => {
      const n = (opt.name || "").toLowerCase();
      if (n.includes("size") || n === "المقاس" || n === "مقاس") safeSizes  = opt.values.split(",").map(s => s.trim()).filter(Boolean);
      if (n.includes("color")|| n === "اللون"  || n === "لون")  safeColors = opt.values.split(",").map(c => c.trim()).filter(Boolean);
    });
  }
  if (!safeSizes.length)  safeSizes  = Array.isArray(product.options?.sizes)  ? product.options.sizes  : (Array.isArray(product.sizes)  ? product.sizes  : []);
  if (!safeColors.length) safeColors = Array.isArray(product.options?.colors) ? product.options.colors : [];

  const currentColorImage = () => {
    if (!selectedColor) return gallery[1] || activeImage;
    const hi = product.colorSwatches?.[selectedColor];
    if (hi && (hi.startsWith("http") || hi.includes("/"))) return hi;
    return gallery[1] || activeImage;
  };

  const getClosedDescriptionHTML = () => {
    if (!product.description) return "";
    return product.description.replace(/<details\s+open[^>]*>/gi, '<details>');
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-10 selection:bg-[#F5C518] selection:text-black">

      {/* 1. مسار الصفحة (Breadcrumbs) */}
      <div className="pt-4 pb-2 px-4 max-w-4xl mx-auto text-[10px] md:text-xs text-gray-500 flex items-center gap-2 overflow-x-auto hide-scrollbar-horizontal whitespace-nowrap" dir="rtl" style={{fontFamily:"Cairo,sans-serif"}}>
        <span className="hover:text-white cursor-pointer transition-colors">الرئيسية</span> 
        <span>/</span> 
        <span className="hover:text-white cursor-pointer transition-colors">{product.category || 'المنتجات'}</span> 
        <span>/</span> 
        <span className="text-[#F5C518]">{product.title}</span>
      </div>

      {/* 2. القسم السينمائي العلوي (الصورة الرئيسية) */}
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-black group cursor-pointer" onClick={() => openGallery(activeIdx)}>
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-80 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent pointer-events-none"></div>
        
        {/* أيقونات التفاعل */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10" onClick={e => e.stopPropagation()}>
          <button onClick={() => openGallery(activeIdx)} className="flex flex-col items-center gap-1 text-white hover:text-[#F5C518] transition-colors drop-shadow-md">
            <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <ImageIcon size={20} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-lg">{gallery.length} صور</span>
          </button>
          
          <button onClick={() => setIsWishlisted(!isWishlisted)} className="flex flex-col items-center gap-1 text-white hover:text-[#F5C518] transition-colors drop-shadow-md">
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

        <button 
          onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <ChevronLeft size={40} strokeWidth={1.5} />
        </button>
      </div>

      {/* 3. شريط الكتالوج السينمائي المتداخل */}
      <div className="relative -mt-14 z-20 px-4 max-w-4xl mx-auto group/strip" dir="rtl">
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar-horizontal py-2 px-1 items-end transition-all duration-300 origin-bottom hover:scale-[1.02] hover:-translate-y-1">
          {gallery.filter(Boolean).map((img, idx) => (
            <button 
              key={idx}
              onClick={() => { setActiveImage(img); setActiveIdx(idx); }}
              className={`flex-shrink-0 w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden transition-all duration-300 shadow-lg ${activeImage === img ? "ring-2 ring-[#F5C518] scale-105" : "border border-white/10 opacity-60 hover:opacity-100"}`}
            >
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`لقطة ${idx+1}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-4xl mx-auto" dir="rtl">
        {/* 4. اسم المنتج والتفاصيل */}
        <div className="mb-4 pt-2">
          {/* تصغير خط اسم المنتج */}
          <h1 className="text-xl md:text-2xl leading-tight font-black text-white mb-2 tracking-tight">{product.title}</h1>
          
          <div className="flex items-center gap-3 text-[11px] md:text-xs text-gray-400 font-medium mb-3">
            <span className="text-[#F5C518]">WIND Series</span>
            <span>•</span>
            <span>{product.category || product.type || "أزياء"}</span>
            <span>•</span>
            <span className="border border-gray-600 px-1.5 py-0.5 rounded bg-[#1a1a1a]">WIND-24</span>
          </div>
        </div>

        {/* البوستر المصغر والسعر */}
        <div className="flex gap-4 items-start border-t border-[#333]/50 pt-5">
          <div className="w-28 h-40 md:w-32 md:h-48 flex-shrink-0 rounded-md overflow-hidden border border-[#333] shadow-2xl relative group cursor-pointer" onClick={() => setImageZoomModalOpen(true)}>
            <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="poster" />
            <div className="absolute top-0 left-0 bg-black/70 px-1 py-0.5 rounded-br-md">
              <Plus size={14} className="text-white" />
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <div className="bg-black/60 p-2.5 rounded-full border border-[#F5C518]/50 text-white shadow-lg">
                <Search size={20} />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-start pt-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[9px] font-bold text-gray-400 bg-[#1a1a1a]">Premium</span>
              <span className="border border-[#444] rounded-full px-2.5 py-0.5 text-[9px] font-bold text-gray-400 bg-[#1a1a1a]">Oversized</span>
            </div>
            
            <div className="flex items-end gap-2 mt-1">
              <span style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.5px' }} className="text-3xl md:text-4xl font-normal text-white">{product.price}</span>
              <span className="text-xs font-normal text-[#F5C518] mb-1.5">ج.م</span>
              {product.compareAtPrice && (
                <span className="text-xs text-gray-500 line-through mb-1.5 mr-2">{product.compareAtPrice} ج.م</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[11px] font-bold text-green-400">{product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر في المخزون" : "غير متوفر"}</span>
            </div>
          </div>
        </div>

        {/* 5. الألوان والمقاسات وزر أضف للسلة */}
        <div className="mt-6 space-y-6 border-t border-[#333]/50 pt-5">
          {/* الألوان */}
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اختر اللون</span>
                {selectedColor && <span className="text-[#F5C518] text-[11px] bg-[#1a1a1a] border border-[#333] px-2.5 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
              </div>
              <div ref={colorsRef} className="flex flex-wrap gap-4">
                {safeColors.map((ci, i) => {
                  const name  = typeof ci === "string" ? ci : ci.name;
                  const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
                  const isImg = hi.startsWith("http") || hi.includes("/");
                  const isSel = selectedColor === name;
                  return (
                    <button key={i} onClick={() => { setSelectedColor(name); if (isImg) { setActiveImage(hi); setActiveIdx(0); } }} title={name} className="flex flex-col items-center group/c transition-all duration-300 ease-out">
                      {/* إزالة اسم اللون من تحت الأيقونة والاكتفاء بالمربع الناعم */}
                      <div className={`w-11 h-11 rounded-[10px] overflow-hidden transition-all duration-300 ease-out ${isSel ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#121212] shadow-[0_4px_12px_rgba(245,197,24,0.3)] scale-[1.05]" : "ring-1 ring-white/10 hover:ring-white/30 hover:shadow-[0_4px_10px_rgba(255,255,255,0.08)] hover:-translate-y-1"}`}>
                        {isImg ? <img src={hi} className="w-full h-full object-cover" alt={name} /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* المقاسات */}
          {safeSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اختر المقاس</span>
                  {selectedSize && <span className="text-[#F5C518] text-[11px] bg-[#1a1a1a] border border-[#333] px-2.5 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
                </div>
                <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-[#F5C518] flex items-center gap-1.5 border border-[#F5C518]/20 hover:border-[#F5C518]/50 hover:bg-[#F5C518]/10 px-3 py-1.5 rounded-full transition-all" style={{fontFamily:"Cairo,sans-serif"}}>
                  <Info size={12} /> دليل القياسات
                </button>
              </div>
              {safeSizes.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {safeSizes.map(sz => (
                    <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[58px] h-11 text-sm font-black rounded border transition-all duration-200 ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105" : "bg-[#1a1a1a] text-gray-400 border-[#333] hover:border-[#F5C518]/30 hover:text-gray-200"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* زر السلة والعداد في مسار الصفحة (بدون شريط ثابت) */}
          <div className="pt-2">
            <div className="flex gap-3">
              <button onClick={() => addToCart({...product, selectedSize, selectedColor, image: getImageUrl(activeImage), qty: quantity})} className="pay-btn flex-1 text-black font-black text-base py-3.5 rounded-[8px] flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,197,24,0.15)] transition-all group/cta" style={{fontFamily:"Cairo,sans-serif"}}>
                <ShoppingBag size={18} className="transition-transform group-hover/cta:-translate-y-0.5" />
                أضف إلي السلة — {(product.price * quantity)} ج.م
              </button>
              
              <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-[8px] px-2 w-[110px] shrink-0 transition-colors hover:border-[#F5C518]/40">
                <button onClick={() => setQuantity(q => q + 1)} className="text-gray-400 hover:text-[#F5C518] p-2 transition-colors"><Plus size={16} /></button>
                <span className="text-white font-bold text-base" style={{fontFamily:"Cairo,sans-serif"}}>{quantity}</span>
                <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="text-gray-400 hover:text-[#F5C518] p-2 transition-colors"><Minus size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. شريط الثقة للشحن */}
        <div className="mt-6 flex justify-between items-center bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold"><Truck size={14} className="text-[#F5C518]" /> شحن سريع</div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold"><Eye size={14} className="text-[#F5C518]" /> معاينة قبل الاستلام</div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold"><ShieldCheck size={14} className="text-[#F5C518]" /> استرجاع سهل</div>
        </div>

        {/* 7. بوابات الدفع الآمنة */}
        <div className="mt-3 flex flex-col items-center justify-center bg-[#121212] p-4 rounded-lg border border-[#333] gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <ShieldCheck size={14} className="text-green-500" />
            <span>تسوق بأمان - طرق دفع موثوقة ومحميّة 100%</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
             <CreditCard size={24} className="hover:text-white transition-colors"/>
             <Banknote size={24} className="hover:text-white transition-colors"/>
             {/* أيقونات تعبيرية للبوابات المتاحة */}
             <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded text-[10px] border border-[#333] font-bold tracking-wider">INSTAPAY</div>
             <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded text-[10px] border border-[#333] font-bold tracking-wider">VISA</div>
          </div>
        </div>

        {/* 8. التقييمات */}
        <div className="mt-6 flex flex-col items-center justify-center border-t border-[#333]/50 pt-6 gap-1.5">
          <div className="flex gap-1">
            {[...Array(5)].map((_,i) => <Star key={i} size={16} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-white/20"} fill={i<Math.round(product.rating||5)?"#F5C518":"transparent"} />)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl text-white">{product.rating || "4.9"}</span>
            <span className="text-gray-500 text-xs">/ 5  ({product.reviewsCount || "490K"} تقييم)</span>
          </div>
        </div>

        {/* الوصف الداخلي */}
        {product.description && (
          <div className="py-8 border-t border-[#333]/50 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>تفاصيل المنتج</span>
            </div>
            <div className="ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{__html: getClosedDescriptionHTML()}} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🎬 المودالات (المعرض، العدسة، المقاسات) */}
      {/* ========================================== */}

      {/* مودال معرض الصور (يغلق عند الضغط بالخارج ويدعم التكبير) */}
      {isGalleryOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col gallery-enter backdrop-blur-md"
          onClick={() => setGalleryOpen(false)} // الإغلاق عند الضغط بالخارج
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-white font-black text-sm" style={{fontFamily:"Cairo,sans-serif"}}>{product.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs" style={{fontFamily:"Cairo,sans-serif"}}>{galleryIdx+1} / {gallery.length}</span>
              <button onClick={() => setGalleryOpen(false)} className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-full text-gray-300 hover:text-white transition-colors"><X size={18} /></button>
            </div>
          </div>
          
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden" 
            onTouchStart={onTouchStart} 
            onTouchEnd={onTouchEnd}
            onClick={e => e.stopPropagation()} // منع الإغلاق عند الضغط داخل المنطقة دي إلا لو ضغطت على الصورة نفسها (حسب الرغبة، هنخليه هنا يمنع الإغلاق)
          >
            {/* الصورة - مع دعم التكبير */}
            <img 
              key={galleryIdx} 
              src={getImageUrl(gallery[galleryIdx])} 
              alt="" 
              onClick={() => setIsZoomed(!isZoomed)}
              className={`max-h-full max-w-full object-contain gallery-img-enter transition-transform duration-300 ${isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`} 
            />
            
            {!isZoomed && (
              <>
                <button onClick={galleryPrev} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all"><ChevronRight size={22} strokeWidth={1.5} /></button>
                <button onClick={galleryNext} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all"><ChevronLeft size={22} strokeWidth={1.5} /></button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {gallery.map((_,i) => <span key={i} className={`rounded-full transition-all duration-300 ${galleryIdx===i ? "w-5 h-1.5 bg-[#F5C518]" : "w-1.5 h-1.5 bg-white/20"}`} />)}
            </div>
          </div>
        </div>
      )}

      {/* مودال تكبير صورة اللون بالبوستر */}
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

      <SizeChartModal isOpen={isSizeGuideOpen} onClose={() => setSizeGuideOpen(false)} product={product} />

      {/* ========================================== */}
      {/* 🎨 التنسيقات العامة (CSS) */}
      {/* ========================================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes galleryIn { from{opacity:0} to{opacity:1} }
        @keyframes imgIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        
        .gallery-enter { animation: galleryIn 0.25s ease-out }
        .gallery-img-enter { animation: imgIn 0.3s cubic-bezier(0.25,1,0.5,1) }
        
        .hide-scrollbar-horizontal::-webkit-scrollbar { height: 0px; background: transparent; }
        .hide-scrollbar-horizontal { -ms-overflow-style: none; scrollbar-width: none; }

        /* ✅ تأثير زر الإضافة اللامع */
        @keyframes shine {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .pay-btn {
          background: #F5C518;
          color: #1a1a1a;
          position: relative;
          overflow: hidden;
        }
        .pay-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
          background-size: 200% auto;
        }
        .pay-btn:hover::after { animation: shine 0.7s linear; }
        .pay-btn:hover { background: #e6b800; }

        /* تنسيقات الوصف الداخلي (Dark Mode) */
        .dark-wind-tabs .wind-tabs-container { background:transparent!important }
        .dark-wind-tabs .wind-tabs-container details { background:#161616!important; border-bottom:1px solid #1e1e1e!important; border-radius:10px; margin-bottom:8px; padding:0 16px!important; transition:all .3s }
        .dark-wind-tabs .wind-tabs-container details[open] { border-color:#F5C518!important; background:#181818!important }
        .dark-wind-tabs .wind-tabs-container summary { color:#e5e7eb!important; border:none!important; padding:14px 0!important; font-family:'Cairo',sans-serif; font-weight:700 }
        .dark-wind-tabs .wind-tabs-container summary::-webkit-details-marker { display:none }
        .dark-wind-tabs .wind-tabs-container summary svg path { stroke:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container div { color:#9ca3af!important; font-family:'Tajawal',sans-serif; line-height:1.8 }
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom:1px solid #1e1e1e!important }
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"], .dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color:#f3f4f6!important }
        .dark-wind-tabs .wind-tabs-container button, .dark-wind-tabs .wind-tabs-container .read-more-wrapper summary { color:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container summary:hover { background-color:transparent!important }
        
        .ql-editor-display ul { list-style-type:disc!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display ol { list-style-type:decimal!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display strong { font-weight:900; color:#f9fafb }
        .ql-editor-display p { margin-bottom:8px; line-height:1.75; color:#9ca3af; font-family:'Tajawal',sans-serif }
      `}</style>
    </div>
  );
}