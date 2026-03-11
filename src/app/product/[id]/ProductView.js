"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { usePageReady, useGlobalLoader } from "../../../context/GlobalLoaderContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore"; 
import SizeChartModal from "@/components/SizeChartModal";
import { Play, Plus, Minus, Star, Info, Share2, Heart, ImageIcon, ChevronDown, X, Truck, Eye, ShieldCheck, ChevronLeft, Search, ChevronRight, ShoppingBag, CreditCard, Banknote } from "lucide-react";

// 1. تغيير اسم الدالة واستقبال الخواص من السيرفر (initialProduct و sourceCategory)
export default function ProductView({ initialProduct, sourceCategory }) {
  const { id } = useParams();
  const pathname = usePathname();
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderActive } = useGlobalLoader();
  
  // 2. استخدام المنتج الممرر من السيرفر كقيمة افتراضية لسرعة العرض
  const [product, setProduct]               = useState(initialProduct || null);
  const [loading, setLoading]               = useState(!initialProduct);
  const { addToCart }                       = useCart();
  const [activeImage, setActiveImage]       = useState(initialProduct?.images?.[0] || initialProduct?.mainImage || "");
  const [activeIdx, setActiveIdx]           = useState(0);
  const [selectedSize, setSelectedSize]     = useState("");
  const [selectedColor, setSelectedColor]   = useState("");
  const [quantity, setQuantity]             = useState(1);
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [isWishlisted, setIsWishlisted]     = useState(false);
  const [isGalleryOpen, setGalleryOpen]     = useState(false);
  const [galleryIdx, setGalleryIdx]         = useState(0);
  const [isZoomed, setIsZoomed]             = useState(false); 
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false); 
  const [isDescModalOpen, setDescModalOpen] = useState(false); 
  const [heroLoaded, setHeroLoaded]         = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Swipe States for Hero Image
  const [isSwipingHero, setIsSwipingHero]   = useState(false);
  const heroTouchStartX                     = useRef(null);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const colorsRef   = useRef(null);

  useEffect(() => {
    if (isGalleryOpen || isImageZoomModalOpen || isDescModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isGalleryOpen, isImageZoomModalOpen, isDescModalOpen]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setHeroLoaded(false);
      
      const sp = staticProducts.find(p => p.id.toString() === id.toString());
      if (sp) {
        setProduct(sp);
        setActiveImage(sp.mainImage);
        if (sp.sizes?.length  > 0) setSelectedSize(sp.sizes[0]);
        if (sp.colors?.length > 0) setSelectedColor(sp.colors[0].name || sp.colors[0]);
        
        const spRefValue = (Array.isArray(sp.categories) ? sp.categories[0] : sp.categories) || (Array.isArray(sp.collections) ? sp.collections[0] : sp.collections) || sp.type;
        let related = staticProducts.filter(p => {
          const matchCat = Array.isArray(p.categories) ? p.categories.includes(spRefValue) : p.categories === spRefValue;
          const matchCol = Array.isArray(p.collections) ? p.collections.includes(spRefValue) : p.collections === spRefValue;
          return (matchCat || matchCol || p.type === spRefValue) && p.id.toString() !== id.toString();
        });
        if (related.length === 0) related = staticProducts.filter(p => p.id.toString() !== id.toString());
        setRelatedProducts(related.slice(0, 5));
        
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
          
          const fbRefValue = (Array.isArray(fb.categories) && fb.categories[0]) || (Array.isArray(fb.collections) && fb.collections[0]) || fb.type || fb.category;
          
          let relatedFbs = [];
          const productsRef = collection(db, "products");

          if (fbRefValue) {
            try {
              const qCat = query(productsRef, where("categories", "array-contains", fbRefValue), limit(6));
              const snapCat = await getDocs(qCat);
              snapCat.forEach(d => { if(d.id !== id.toString()) relatedFbs.push({ id: d.id, ...d.data() }) });

              if (relatedFbs.length === 0) {
                const qCol = query(productsRef, where("collections", "array-contains", fbRefValue), limit(6));
                const snapCol = await getDocs(qCol);
                snapCol.forEach(d => { if(d.id !== id.toString()) relatedFbs.push({ id: d.id, ...d.data() }) });
              }
            } catch (err) { console.error("Error fetching related by category:", err); }
          }

          if (relatedFbs.length === 0) {
            const qFallback = query(productsRef, limit(6));
            const snapFallback = await getDocs(qFallback);
            snapFallback.forEach(d => { if(d.id !== id.toString()) relatedFbs.push({ id: d.id, ...d.data() }) });
          }

          const uniqueRelated = Array.from(new Map(relatedFbs.map(item => [item.id, item])).values());
          setRelatedProducts(uniqueRelated.slice(0, 5));
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    
    // إذا لم يكن المنتج ممرر من السيرفر، قم بجلبه
    if (!initialProduct) {
      fetchProduct();
    } else {
      // فقط لتجهيز المنتجات ذات الصلة إذا كان المنتج ممرر مسبقاً
      fetchProduct(); 
    }
  }, [id, initialProduct]);

  useEffect(() => {
    if (!loading && product) {
      signalPageReady();
    }
  }, [loading, product, pathname, signalPageReady]);

  const shortDescription = useMemo(() => {
    if (!product?.description) return "";
    let clean = product.description.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    let text = doc.body.textContent || "";
    const keywordsToRemove = [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i];
    keywordsToRemove.forEach(regex => { text = text.replace(regex, ""); });
    return text.trim().substring(0, 110) + "... ";
  }, [product?.description]);

  const closedDescriptionHTML = useMemo(() => {
    if (!product?.description) return "";
    return product.description.replace(/<details\s+open[^>]*>/gi, '<details>');
  }, [product?.description]);

  if (loading && !product) return null; 
  if (!product) return null;

  const getImageUrl = img => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `/images/products/${product.folderName}/${img}`;
  };

  const getRelatedImageUrl = (rp) => {
    if (rp.mainImage?.startsWith("http")) return rp.mainImage;
    if (rp.mainImage && rp.folderName) return `/images/products/${rp.folderName}/${rp.mainImage}`;
    if (rp.images && rp.images.length > 0) return rp.images[0];
    if (rp.mainImageUrl) return rp.mainImageUrl;
    if (rp.image) return rp.image;
    return "";
  };

  const gallery = product.images || [product.mainImage, ...Array.from({length: product.imagesCount || 0}, (_, i) => `${i+1}.webp`)];

  const openGallery = idx => { setGalleryIdx(idx); setIsZoomed(false); setGalleryOpen(true); };
  const galleryNext = () => { setGalleryIdx(i => (i + 1) % gallery.length); setIsZoomed(false); };
  const galleryPrev = () => { setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length); setIsZoomed(false); };
  
  // Hero Touch Logic (Swipe left/right)
  const handleHeroTouchStart = (e) => {
    heroTouchStartX.current = e.touches[0].clientX;
    setIsSwipingHero(true);
  };
  const handleHeroTouchMove = (e) => {
    if (heroTouchStartX.current) setIsSwipingHero(true);
  };
  const handleHeroTouchEnd = (e) => {
    if (!heroTouchStartX.current) return;
    const dx = e.changedTouches[0].clientX - heroTouchStartX.current;
    if (Math.abs(dx) > 40) {
      const currentIndex = gallery.indexOf(activeImage);
      if (dx > 0) {
        const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
        setActiveImage(gallery[prevIndex]);
        setActiveIdx(prevIndex);
      } else {
        const nextIndex = (currentIndex + 1) % gallery.length;
        setActiveImage(gallery[nextIndex]);
        setActiveIdx(nextIndex);
      }
    }
    heroTouchStartX.current = null;
    // تأخير بسيط قبل إظهار الأيقونات لضمان النعومة وعدم التشتيت أثناء التقليب المستمر
    setTimeout(() => {
      setIsSwipingHero(false);
    }, 150);
  };

  const onTouchStart = e => { 
    touchStartX.current = e.touches[0].clientX; 
    touchStartY.current = e.touches[0].clientY; 
  };
  const onTouchEnd   = e => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    
    if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx)) {
      setGalleryOpen(false);
    } else if (Math.abs(dx) > 50) {
      dx > 0 ? galleryPrev() : galleryNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
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

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-10 selection:bg-[#3b82f6] selection:text-white">

      {/* 1. القسم السينمائي (Hero Section) مع دعم السحب */}
      <div 
        className="relative w-full h-[65vh] md:h-[75vh] bg-black group" 
        onClick={() => openGallery(activeIdx)}
        onTouchStart={handleHeroTouchStart}
        onTouchMove={handleHeroTouchMove}
        onTouchEnd={handleHeroTouchEnd}
      >
        <img 
          src={getImageUrl(activeImage)} 
          alt={product.title} 
          className="w-full h-full object-cover object-top opacity-80 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent pointer-events-none"></div>
        
        {/* إخفاء الأيقونات بسلاسة أثناء السحب */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10 transition-opacity duration-300 ${isSwipingHero ? 'opacity-0' : 'opacity-100'}`} onClick={e => e.stopPropagation()}>
          <button onClick={() => openGallery(activeIdx)} className="flex flex-col items-center gap-1 text-white hover:text-[#3b82f6] transition-colors drop-shadow-md">
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
          
          <button className="flex flex-col items-center gap-1 text-white hover:text-[#3b82f6] transition-colors drop-shadow-md">
            <div className="bg-black/40 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <Share2 size={20} />
            </div>
            <span className="text-[10px] font-bold shadow-black drop-shadow-lg">مشاركة</span>
          </button>
        </div>

        {/* مؤشر الصور الأنيق بالأسفل */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/50 text-[10px] md:text-xs font-bold font-sans tracking-[0.2em] pointer-events-none z-10">
          <span>&lt;</span>
          <span>{activeIdx + 1} / {gallery.length}</span>
          <span>&gt;</span>
        </div>
      </div>

      {/* 3. منطقة الحبكة (Mini Poster & Synopsis & Options) */}
      <div className="px-4 py-4 max-w-4xl mx-auto" dir="rtl">
        <div className="mb-8 pt-2">
          <h1 className="text-[22px] md:text-2xl font-black text-white mb-2 tracking-tight leading-tight" style={{fontFamily:"Cairo,sans-serif"}}>{product.title}</h1>
          
          {/* 3. التاجات الديناميكية الذكية (متوافقة 100% مع حقول Firebase) */}
          <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-gray-500 mb-1" style={{fontFamily:"Cairo,sans-serif"}}>
            <span>ويند-{new Date().getFullYear().toString().slice(-2)}</span>
            <span className="w-1 h-1 bg-[#F5C518] rounded-full"></span>
            <span>منتجات ويند</span>
            
            {/* استخدام sourceCategory أو البحث في حقول فايربيز البديلة (productCategory, category, type, tags) */}
            {(sourceCategory || product?.productCategory || product?.category || product?.type || (Array.isArray(product?.tags) && product.tags[0])) && (
              <>
                <span className="w-1 h-1 bg-[#F5C518] rounded-full"></span>
                <span className="capitalize">
                  {String(sourceCategory || product?.productCategory || product?.category || product?.type || (Array.isArray(product?.tags) ? product.tags[0] : "") || "").split('/')[0].trim()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4 md:gap-5 items-start border-t border-[#333]/50 pt-6">
          {/* البوستر المصغر - استخدام priority لضمان التحميل الفوري وعدم التأخير للصور المكدسة */}
          <div className="w-28 h-40 md:w-32 md:h-48 flex-shrink-0 rounded-xl overflow-hidden border border-[#333] shadow-2xl relative group cursor-pointer hover:border-white/20 transition-colors" onClick={() => setImageZoomModalOpen(true)}>
            {safeColors.map((ci, i) => {
              const name  = typeof ci === "string" ? ci : ci.name;
              const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
              const isImg = hi.startsWith("http") || hi.includes("/");
              if (!isImg) return null;
              const isSel = selectedColor === name;
              return (
                <Image key={i} src={getImageUrl(hi)} fill quality={70} sizes="(max-width: 768px) 112px, 128px" priority={true} className={`object-cover transition-opacity duration-150 ${isSel ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} alt={name} />
              );
            })}
            <Image src={getImageUrl(gallery[1] || activeImage)} fill quality={70} sizes="(max-width: 768px) 112px, 128px" priority={true} className={`object-cover transition-opacity duration-150 ${(!selectedColor || !product.colorSwatches?.[selectedColor]) ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} alt="poster default" />

            {/* أيقونة العدسة للمؤشر المصغر */}
            <div className="absolute top-0 left-0 bg-black/70 px-1.5 py-1 rounded-br-md z-20 border-b border-r border-[#333]">
              <Search size={13} className="text-white" />
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-30">
              <div className="bg-black/60 p-2.5 rounded-full border border-white/50 text-white shadow-lg">
                <Search size={20} />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-40 md:h-48 justify-center gap-3">
            <div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '1px' }} className="text-3xl md:text-4xl font-normal text-white">{product.price}</span>
                <span className="text-sm font-bold text-gray-400">ج.م</span>
                {product.compareAtPrice && (
                  <span className="text-xs text-gray-600 line-through mr-1">{product.compareAtPrice} ج.م</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                </span>
                <span className="text-[11px] font-bold text-[#22c55e]">{product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر في المخزون" : "غير متوفر"}</span>
              </div>
            </div>

            {product.description && (
              <div className="relative mt-2 flex flex-col justify-end overflow-hidden flex-1">
                <div className="relative flex-1 overflow-hidden">
                  <p className="text-[11px] leading-relaxed text-gray-400 text-right pr-1" style={{fontFamily:"Tajawal,sans-serif"}}>
                    {shortDescription}
                  </p>
                  <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent pointer-events-none"></div>
                </div>
                <button 
                  onClick={() => setDescModalOpen(true)}
                  className="text-white text-[10px] font-bold flex items-center gap-1 hover:underline underline-offset-4 w-fit pt-1 pr-1 transition-colors hover:text-[#F5C518]"
                >
                  <Info size={12} />
                  عرض تفاصيل المنتج والخامات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* مساحات تنفس أكبر بين الأقسام */}
        <div className="mt-10 space-y-10 border-t border-[#333]/50 pt-8">
          
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-5">
                <div className="w-1 h-4 bg-[#F5C518] rounded-sm self-center shadow-[0_0_8px_rgba(245,197,24,0.4)]" />
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase" style={{fontFamily:"Cairo,sans-serif"}}>
                  {safeColors.length > 1 ? "اختر اللون :" : "اللون :"}
                </span>
                {selectedColor && <span className="text-white text-[13px] font-bold capitalize ml-1" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
              </div>
              <div ref={colorsRef} className="flex flex-wrap gap-4">
                {safeColors.map((ci, i) => {
                  const name  = typeof ci === "string" ? ci : ci.name;
                  const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
                  const isImg = hi.startsWith("http") || hi.includes("/");
                  const isSel = selectedColor === name;
                  return (
                    <button key={i} onClick={() => { setSelectedColor(name); if (isImg) { setActiveImage(hi); setActiveIdx(0); } }} title={name} className="flex flex-col items-center group/c transition-all duration-300 ease-out">
                      <div className={`w-11 h-11 rounded-[10px] overflow-hidden transition-all duration-300 ease-out ${isSel ? "ring-2 ring-white ring-offset-2 ring-offset-[#121212] shadow-[0_4px_16px_rgba(255,255,255,0.2)] scale-[1.08]" : "ring-1 ring-white/10 hover:ring-white/30 hover:shadow-[0_4px_10px_rgba(255,255,255,0.08)] hover:-translate-y-1"}`}>
                        {isImg ? <Image src={hi} alt={name} width={60} height={80} quality={75} className="w-full h-full object-cover" /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {safeSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-baseline gap-2">
                  <div className="w-1 h-4 bg-[#F5C518] rounded-sm self-center shadow-[0_0_8px_rgba(245,197,24,0.4)]" />
                  <span className="text-xs font-bold text-gray-400 tracking-widest uppercase" style={{fontFamily:"Cairo,sans-serif"}}>
                    {safeSizes.length > 1 ? "اختر المقاس :" : "المقاس :"}
                  </span>
                  {selectedSize && <span className="text-white text-[13px] font-bold capitalize ml-1" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
                </div>
                <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-white font-bold flex items-center gap-1.5 border border-white/20 hover:border-white/60 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all" style={{fontFamily:"Cairo,sans-serif"}}>
                  <Info size={13} /> دليل القياسات
                </button>
              </div>
              {safeSizes.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {safeSizes.map(sz => (
                    <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[58px] h-10 text-sm font-black rounded-xl border transition-all duration-200 capitalize ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105" : "bg-[#1a1a1a] text-gray-400 border-[#333] hover:border-white/40 hover:text-gray-200 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-6">
            <div className="flex gap-3">
              <button onClick={() => addToCart({...product, selectedSize, selectedColor, image: getImageUrl(activeImage), qty: quantity})} className="pay-btn flex-1 text-black font-black text-base py-4 rounded-[8px] flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,197,24,0.15)] transition-all group/cta tracking-wide" style={{fontFamily:"Cairo,sans-serif"}}>
                <ShoppingBag size={18} className="transition-transform group-hover/cta:-translate-y-0.5" />
                أضف إلي السلة — {(product.price * quantity)} ج.م
              </button>
              
              <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-[8px] px-1 w-[80px] shrink-0 transition-colors hover:border-[#F5C518]/40">
                <button onClick={() => setQuantity(q => q + 1)} className="text-gray-400 hover:text-[#F5C518] p-1.5 transition-colors"><Plus size={16} /></button>
                <span className="text-white font-bold text-sm" style={{fontFamily:"Cairo,sans-serif"}}>{quantity}</span>
                <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="text-gray-400 hover:text-[#F5C518] p-1.5 transition-colors"><Minus size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* شريط الثقة النحيف والأنيق (Slim Banner) */}
        <div className="mt-8 flex justify-between items-center bg-[#1a1a1a]/50 py-3 px-2 md:px-4 rounded-lg border border-[#333] shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <Truck size={14} className="text-[#F5C518]" />
            <span>شحن سريع</span>
          </div>
          <div className="w-px h-4 bg-[#333]"></div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <Eye size={14} className="text-[#F5C518]" />
            <span>معاينة للطلب</span>
          </div>
          <div className="w-px h-4 bg-[#333]"></div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <ShieldCheck size={14} className="text-[#F5C518]" />
            <span>استرجاع سهل</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between bg-[#121212] py-3 px-4 rounded-lg border border-[#333] shadow-sm">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
            <ShieldCheck size={14} className="text-green-500" />
            <span>دفع آمن 100%</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
             <CreditCard size={18} className="hover:text-white transition-colors"/>
             <Banknote size={18} className="hover:text-white transition-colors"/>
             <div className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[9px] border border-[#333] font-bold tracking-wider">INSTAPAY</div>
             <div className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[9px] border border-[#333] font-bold tracking-wider">VISA</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center border-t border-[#333]/50 pt-6 gap-1.5">
          <div className="flex gap-1">
            {[...Array(5)].map((_,i) => <Star key={i} size={16} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-white/20"} fill={i<Math.round(product.rating||5)?"#F5C518":"transparent"} />)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl text-white">{product.rating || "4.9"}</span>
            <span className="text-gray-500 text-xs">/ 5  ({product.reviewsCount || "490K"} تقييم)</span>
          </div>
        </div>

        {product.description && (
          <div className="py-8 border-t border-[#333]/50 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>تفاصيل المنتج</span>
            </div>
            <div className="ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{__html: closedDescriptionHTML}} />
            </div>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="py-8 border-t border-[#333]/50 mt-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-[#F5C518] rounded-sm" />
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight" style={{fontFamily:"Cairo,sans-serif"}}>
                منتجات قد تعجبك
              </h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto hide-scrollbar-horizontal pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
              {relatedProducts.map(rp => (
                <Link 
                  href={`/product/${rp.id}`} 
                  key={rp.id} 
                  className="flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer block transition-all duration-300 hover:shadow-[0_8px_32px_rgba(59,130,246,0.10)] rounded-2xl"
                >
                  <div className="relative aspect-[3/4] bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#333] shadow-lg mb-3 group-hover:border-[#3b82f6]/30 transition-colors duration-300">
                    <img 
                      src={getRelatedImageUrl(rp)} 
                      alt={rp.title} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-[#F5C518] text-black p-2 rounded-full shadow-[0_0_15px_rgba(245,197,24,0.4)]">
                        <ShoppingBag size={16} />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xs md:text-sm text-gray-300 font-bold truncate mb-1.5 transition-colors group-hover:text-white" style={{fontFamily:"Cairo,sans-serif"}}>
                    {rp.title}
                  </h3>
                  <div className="flex items-end gap-1">
                    <span className="text-white font-black text-sm md:text-base" style={{fontFamily:"Impact, sans-serif", letterSpacing:"1px"}}>
                      {rp.price}
                    </span>
                    <span className="text-gray-400 text-[10px] md:text-xs font-bold mb-0.5">ج.م</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {isGalleryOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex flex-col gallery-enter backdrop-blur-md"
          onClick={() => setGalleryOpen(false)} 
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-5 bg-[#3b82f6] rounded-sm" />
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
            onClick={e => e.stopPropagation()} 
          >
            <img 
              key={galleryIdx} 
              src={getImageUrl(gallery[galleryIdx])} 
              alt="" 
              onClick={() => setIsZoomed(!isZoomed)}
              className={`max-h-full max-w-full object-contain gallery-img-enter transition-transform duration-300 ${isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`} 
            />
            
            {!isZoomed && (
              <>
                <button onClick={galleryPrev} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#3b82f6]/40 text-white/60 hover:text-[#3b82f6] p-3 rounded-full transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]"><ChevronRight size={22} strokeWidth={1.5} /></button>
                <button onClick={galleryNext} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#3b82f6]/40 text-white/60 hover:text-[#3b82f6] p-3 rounded-full transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]"><ChevronLeft size={22} strokeWidth={1.5} /></button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none items-center">
              {gallery.map((_,i) => <span key={i} className={`rounded-full bg-[#F5C518] transition-all duration-400 ease-out ${galleryIdx===i ? "w-5 h-1.5 opacity-100" : "w-1.5 h-1.5 opacity-25"}`} />)}
            </div>
          </div>
        </div>
      )}

      {isImageZoomModalOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setImageZoomModalOpen(false)}
        >
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <Image src={getImageUrl(currentColorImage())} fill quality={85} sizes="(max-width: 768px) 100vw, 500px" className="object-cover" alt="Zoomed Color" />
            <button 
              onClick={() => setImageZoomModalOpen(false)} 
              className="absolute top-4 left-4 bg-black/60 hover:bg-black p-2 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm border border-white/20"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#3b82f6]/40">
              <span className="text-white font-bold text-sm">{selectedColor}</span>
            </div>
          </div>
        </div>
      )}

      {isDescModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#121212] w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a] sticky top-0 z-10">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#3b82f6] rounded-full"></div>
                معلومات المنتج والتفاصيل
              </h3>
              <button onClick={() => setDescModalOpen(false)} className="bg-[#242424] hover:bg-[#333] p-1.5 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{ __html: closedDescriptionHTML }} />
            </div>
          </div>
        </div>
      )}

      <SizeChartModal isOpen={isSizeGuideOpen} onClose={() => setSizeGuideOpen(false)} product={product} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes galleryIn { from{opacity:0} to{opacity:1} }
        @keyframes imgIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }

        @keyframes kenBurns {
          0%   { transform: scale(1);    transform-origin: center top; }
          100% { transform: scale(1.06); transform-origin: center top; }
        }
        .hero-ken-burns {
          animation: kenBurns 8s ease-out forwards;
        }

        @keyframes shineContinuous {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .gallery-enter { animation: galleryIn 0.25s ease-out }
        .gallery-img-enter { animation: imgIn 0.3s cubic-bezier(0.25,1,0.5,1) }
        
        .hide-scrollbar-horizontal::-webkit-scrollbar { height: 0px; background: transparent; }
        .hide-scrollbar-horizontal { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar-vertical::-webkit-scrollbar { width: 0px; background: transparent; }
        .hide-scrollbar-vertical { -ms-overflow-style: none; scrollbar-width: none; }

        .thumb-item { transition: width 0.35s cubic-bezier(0.25,1,0.5,1), height 0.35s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .thumb-inactive:hover { opacity: 0.85 !important; border-color: rgba(59,130,246,0.25) !important; }

        .poster-card { transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .poster-card:hover { transform: scale(1.03) translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 24px rgba(59,130,246,0.15); }
        .poster-card:hover .poster-img { transform: scale(1.08); }
        .poster-img { transition: transform 0.7s cubic-bezier(0.25,1,0.5,1); }

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
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%);
          background-size: 250% auto;
          animation: shineContinuous 2.5s linear infinite;
        }
        .pay-btn:hover { background: #e6b800; }

        .dark-wind-tabs .wind-tabs-container { background:transparent!important }
        .dark-wind-tabs .wind-tabs-container details { background:#161616!important; border-bottom:1px solid #1e1e1e!important; border-radius:10px; margin-bottom:8px; padding:0 16px!important; transition:all .3s }
        .dark-wind-tabs .wind-tabs-container details[open] { border-color:#3b82f6!important; background:#181818!important }
        .dark-wind-tabs .wind-tabs-container summary { color:#e5e7eb!important; border:none!important; padding:14px 0!important; font-family:'Cairo',sans-serif; font-weight:700 }
        .dark-wind-tabs .wind-tabs-container summary::-webkit-details-marker { display:none }
        .dark-wind-tabs .wind-tabs-container summary svg path { stroke:#3b82f6!important }
        .dark-wind-tabs .wind-tabs-container div { color:#9ca3af!important; font-family:'Tajawal',sans-serif; line-height:1.8 }
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color:#3b82f6!important }
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom:1px solid #1e1e1e!important }
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"], .dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color:#f3f4f6!important }
        .dark-wind-tabs .wind-tabs-container button, .dark-wind-tabs .wind-tabs-container .read-more-wrapper summary { color:#3b82f6!important }
        .dark-wind-tabs .wind-tabs-container summary:hover { background-color:transparent!important }
        
        .ql-editor-display ul { list-style-type:disc!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display ol { list-style-type:decimal!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display strong { font-weight:900; color:#f9fafb }
        .ql-editor-display p { margin-bottom:8px; line-height:1.75; color:#9ca3af; font-family:'Tajawal',sans-serif }
      `}</style>
    </div>
  );
}