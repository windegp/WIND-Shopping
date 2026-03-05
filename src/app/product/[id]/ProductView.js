"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore"; 
import SizeChartModal from "@/components/SizeChartModal";
import { Plus, Minus, Star, Info, Share2, Heart, ImageIcon, X, Truck, Eye, ShieldCheck, ChevronLeft, ChevronRight, Search, ShoppingBag, CreditCard, Banknote } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [loadingDot, setLoadingDot]         = useState(0);
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
  const [isZoomed, setIsZoomed]             = useState(false); 
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false); 
  const [isDescModalOpen, setDescModalOpen] = useState(false); 
  const [heroLoaded, setHeroLoaded]         = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState([]);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const colorsRef   = useRef(null);

  // Loading dots animation
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setLoadingDot(d => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, [loading]);

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
    fetchProduct();
  }, [id]);

  const shortDescription = useMemo(() => {
    if (!product?.description) return "";
    let clean = product.description.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    let text = doc.body.textContent || "";
    const keywordsToRemove = [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i];
    keywordsToRemove.forEach(regex => { text = text.replace(regex, ""); });
    return text.trim().substring(0, 140) + "...";
  }, [product?.description]);

  const closedDescriptionHTML = useMemo(() => {
    if (!product?.description) return "";
    return product.description.replace(/<details\s+open[^>]*>/gi, '<details>');
  }, [product?.description]);

  if (loading) return (
    <div className="h-screen bg-[#0e0e0e] flex flex-col items-center justify-center text-[#F5C518] gap-5">
      {/* Enhanced spinner — thinner, larger, more elegant */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-[2px] border-[#F5C518]/10"></div>
        <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-[#F5C518] animate-spin"></div>
        <div className="absolute inset-[5px] rounded-full border-[1px] border-transparent border-t-[#F5C518]/40 animate-spin" style={{animationDuration:"1.5s", animationDirection:"reverse"}}></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-black tracking-[0.3em] text-sm text-[#F5C518]" style={{fontFamily:"Cairo,sans-serif"}}>WIND ORIGINALS</span>
        {/* Animated loading text — fades in after 500ms */}
        <span className="text-[11px] text-gray-500 tracking-widest animate-pulse" style={{fontFamily:"Tajawal,sans-serif"}}>
          جارٍ تحميل المنتج{'.'.repeat(loadingDot)}
        </span>
      </div>
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

  const displayCategory = (Array.isArray(product.categories) ? product.categories[0] : product.categories) || (Array.isArray(product.collections) ? product.collections[0] : product.collections) || product.type || 'المنتجات';

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-10 selection:bg-[#F5C518] selection:text-black">

      {/* ✅ Breadcrumb — مطابق للنافبار تماماً: bg-black/95 + backdrop-blur-xl + border-b border-white/5 */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="pt-3 pb-3 px-4 max-w-4xl mx-auto text-[10px] md:text-xs text-gray-500 flex items-center gap-2 overflow-x-auto hide-scrollbar-horizontal whitespace-nowrap" dir="rtl" style={{fontFamily:"Cairo,sans-serif"}}>
          <Link href="/" className="hover:text-white cursor-pointer transition-colors">الرئيسية</Link>
          <span className="text-white/20">/</span>
          {/* ✅ الرابط يوجه للقسم الفعلي للمنتج */}
          <Link href={`/collections/${encodeURIComponent(displayCategory)}`} className="hover:text-[#F5C518] cursor-pointer transition-colors">{displayCategory}</Link>
          <span className="text-white/20">/</span>
          <span className="text-[#F5C518] truncate max-w-[160px]">{product.title}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
           HERO — Full-bleed cinematic image
           Pattern: Nike / Allbirds / HOKA mobile
      ══════════════════════════════════════════ */}
      <div className="relative w-full bg-black overflow-hidden" style={{aspectRatio:"3/4", maxHeight:"92vh"}}>

        {/* الصورة الرئيسية */}
        <img
          src={getImageUrl(activeImage)}
          alt={product.title}
          decoding="async"
          onLoad={() => setHeroLoaded(true)}
          onClick={() => openGallery(activeIdx)}
          className={`absolute inset-0 w-full h-full object-cover object-top cursor-pointer select-none transition-opacity duration-500 ${heroLoaded ? "opacity-100 hero-ken-burns" : "opacity-0"}`}
        />

        {/* Vignette رفيع من الأسفل فقط — يخلي الألوان تتنفس */}
        <div className="absolute inset-0 pointer-events-none"
          style={{background:"linear-gradient(to top, rgba(18,18,18,0.72) 0%, rgba(18,18,18,0.18) 28%, transparent 55%)"}}
        />

        {/* Glow ذهبي ناعم في الزاوية العليا اليمنى */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full pointer-events-none opacity-60"
          style={{background:"radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)"}}
        />

        {/* ── أيقونات الزاوية اليمنى العليا ── */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/35 backdrop-blur-md border border-white/10 hover:border-[#F5C518]/50 transition-all"
          >
            <Heart size={15} fill={isWishlisted?"#F5C518":"none"} color={isWishlisted?"#F5C518":"rgba(255,255,255,0.75)"} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center bg-black/35 backdrop-blur-md border border-white/10 hover:border-[#F5C518]/50 transition-all group/sh">
            <Share2 size={15} className="text-white/75 group-hover/sh:text-[#F5C518] transition-colors" />
          </button>
        </div>

        {/* ── عداد الصور — زاوية يسرى عليا ── */}
        <button
          onClick={() => openGallery(activeIdx)}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-md border border-white/10 hover:border-[#F5C518]/30 px-2.5 py-1.5 rounded-full transition-all group/cnt"
        >
          <ImageIcon size={12} className="text-white/60 group-hover/cnt:text-[#F5C518] transition-colors" />
          <span className="text-white/70 text-[10px] font-black leading-none group-hover/cnt:text-[#F5C518] transition-colors">{activeIdx+1}/{gallery.length}</span>
        </button>

        {/* ── اسم المنتج + تقييم فوق الـ thumbnail strip ── */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-3.5" dir="rtl">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[#F5C518] text-[8px] font-black tracking-[0.22em] uppercase">WIND</span>
              <span className="text-white/20 text-[9px]">·</span>
              <span className="text-white/45 text-[8px] font-bold">{displayCategory}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_,i)=>(
                <Star key={i} size={9} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-white/15"} fill={i<Math.round(product.rating||5)?"#F5C518":"transparent"} />
              ))}
              <span className="text-white/35 text-[8px] font-bold mr-0.5">{product.rating||"4.9"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
           THUMBNAIL STRIP — منفصل تماماً تحت الصورة
           Pattern: Nike PDP thumbnail row
      ══════════════════════════════════════════ */}
      <div className="bg-[#0e0e0e] border-b border-white/5 px-3 py-3" dir="rtl">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar-horizontal items-stretch">
          {gallery.filter(Boolean).map((img, idx) => {
            const isActive = activeImage === img;
            return (
              <button
                key={idx}
                onClick={() => { setActiveImage(img); setActiveIdx(idx); }}
                className="relative flex-shrink-0 overflow-hidden transition-all duration-300 focus:outline-none"
                style={{
                  width:        isActive ? "58px" : "48px",
                  height:       isActive ? "76px" : "64px",
                  borderRadius: "8px",
                  border:       isActive ? "2px solid #F5C518" : "1.5px solid rgba(255,255,255,0.07)",
                  opacity:      isActive ? 1       : 0.5,
                  boxShadow:    isActive ? "0 0 0 2px rgba(245,197,24,0.12), 0 4px 16px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
                  transition:   "width .3s cubic-bezier(.25,1,.5,1), height .3s cubic-bezier(.25,1,.5,1), opacity .25s, border-color .25s, box-shadow .25s",
                }}
              >
                <img
                  src={getImageUrl(img)}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                  alt={`لقطة ${idx+1}`}
                  style={{transition:"transform .5s cubic-bezier(.25,1,.5,1)"}}
                />
                {/* شريط ذهبي أسفل الـ active */}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#F5C518]" />
                )}
              </button>
            );
          })}

          {/* زر "كل الصور" */}
          <button
            onClick={() => openGallery(0)}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-white/7 bg-white/3 hover:border-[#F5C518]/30 hover:bg-white/5 transition-all"
            style={{width:"48px", height:"64px", minWidth:"48px"}}
          >
            <div className="grid grid-cols-2 gap-[3px]">
              {[0,1,2,3].map(i=>(
                <div key={i} className="w-[7px] h-[7px] rounded-[2px] bg-white/20" />
              ))}
            </div>
            <span className="text-[7px] font-black text-white/30 tracking-wider">ALL</span>
          </button>
        </div>
      </div>
      <div className="px-4 py-4 max-w-4xl mx-auto" dir="rtl">
        
        <div className="mb-4 pt-2">
          <h1 className="text-xl md:text-2xl leading-tight font-black text-white mb-2 tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_,i) => <Star key={i} size={14} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-white/20"} fill={i<Math.round(product.rating||5)?"#F5C518":"transparent"} />)}
            </div>
            <span style={{fontFamily:"Tajawal,sans-serif"}}>{product.rating || "4.9"} ({product.reviewsCount || "490K"} تقييم)</span>
          </div>
        </div>

        {/* ✅ Poster + Info — تصميم جديد كلياً */}
        <div className="border-t border-[#1e1e1e] pt-5 mt-1">

          {/* ── الصف العلوي: الـ poster + بيانات السعر ── */}
          <div className="flex gap-0 items-stretch">

            {/* الـ Poster — أكبر، نسبة portrait احترافية، مع لافتة اللون */}
            <div
              className="relative flex-shrink-0 cursor-pointer overflow-hidden poster-card"
              style={{width:"110px", minWidth:"110px", borderRadius:"14px"}}
              onClick={() => setImageZoomModalOpen(true)}
            >
              {/* الصورة */}
              <img
                src={getImageUrl(currentColorImage())}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top transition-transform duration-700 poster-img"
                alt="poster"
                style={{minHeight:"160px"}}
              />

              {/* gradient overlay من الأسفل */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none rounded-[14px]"></div>

              {/* اللون المحدد في الأسفل */}
              {selectedColor && (
                <div className="absolute bottom-2 inset-x-1.5 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white/80 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 truncate max-w-full" style={{fontFamily:"Cairo,sans-serif"}}>
                    {selectedColor}
                  </span>
                </div>
              )}

              {/* أيقونة تكبير — top right */}
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full p-1 opacity-70 hover:opacity-100 hover:border-[#F5C518]/40 transition-all">
                <Search size={11} className="text-white" />
              </div>
            </div>

            {/* ── كارت المعلومات — تصميم panel مميز ── */}
            <div className="flex-1 mr-3 flex flex-col justify-between bg-[#161616] border border-[#1f1f1f] rounded-2xl px-4 py-3.5 overflow-hidden relative">

              {/* خط ذهبي رفيع في الأعلى */}
              <div className="absolute top-0 right-0 left-0 h-[2px] rounded-t-2xl" style={{background:"linear-gradient(90deg,transparent,#F5C518 40%,#F5C518 60%,transparent)"}}></div>

              {/* الـ badges */}
              <div className="flex items-center flex-wrap gap-1.5 mb-2">
                <span className="text-[#F5C518] text-[8px] font-black tracking-[0.18em] uppercase">WIND</span>
                <span className="text-white/15 text-[9px]">|</span>
                <span className="text-gray-400 text-[9px] font-bold">{displayCategory}</span>
                <span className="mr-auto border border-[#2a2a2a] rounded-md px-1.5 py-0.5 text-[8px] font-black text-white/30 bg-[#111] tracking-widest">W-24</span>
              </div>

              {/* السعر — المحور الرئيسي */}
              <div className="flex items-baseline gap-1 my-1">
                <span
                  className="text-white leading-none"
                  style={{fontFamily:"Impact,sans-serif", fontSize:"2.6rem", letterSpacing:"1px"}}
                >
                  {product.price}
                </span>
                <div className="flex flex-col items-start mr-0.5">
                  <span className="text-[#F5C518] text-xs font-black leading-none">ج.م</span>
                  {product.compareAtPrice && (
                    <span className="text-[10px] text-white/30 line-through leading-none mt-0.5">{product.compareAtPrice}</span>
                  )}
                </div>
              </div>

              {/* الخصم لو موجود */}
              {product.compareAtPrice && (
                <div className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 mb-2 w-fit">
                  <span className="text-green-400 text-[9px] font-black">
                    وفّر {product.compareAtPrice - product.price} ج.م
                  </span>
                </div>
              )}

              {/* الفاصل */}
              <div className="w-full h-px bg-white/5 my-2"></div>

              {/* المخزون + الوصف */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-400" style={{fontFamily:"Cairo,sans-serif"}}>
                  {product?.quantity > 0 || product?.sellOutOfStock === "Yes" ? "متوفر" : "غير متوفر"}
                </span>
              </div>

              {product.description && (
                <div className="relative overflow-hidden flex-1 min-h-0">
                  <p className="text-[10px] leading-relaxed text-white/35 text-right line-clamp-2" style={{fontFamily:"Tajawal,sans-serif"}}>
                    {shortDescription}
                  </p>
                  <button
                    onClick={() => setDescModalOpen(true)}
                    className="text-[#F5C518]/80 hover:text-[#F5C518] text-[9px] font-black flex items-center gap-1 mt-1 transition-colors"
                  >
                    <Info size={10} />
                    التفاصيل والخامات
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6 border-t border-[#333]/50 pt-5">
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>
                  {safeColors.length > 1 ? "اختر اللون" : "اللون"}
                </span>
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
                      <div className={`w-11 h-11 rounded-[10px] overflow-hidden transition-all duration-300 ease-out ${isSel ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#121212] shadow-[0_4px_16px_rgba(245,197,24,0.35)] scale-[1.08]" : "ring-1 ring-white/10 hover:ring-white/30 hover:shadow-[0_4px_10px_rgba(255,255,255,0.08)] hover:-translate-y-1"}`}>
                        {isImg ? <img src={hi} className="w-full h-full object-cover" alt={name} /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {safeSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>
                    {safeSizes.length > 1 ? "اختر المقاس" : "المقاس"}
                  </span>
                  {selectedSize && <span className="text-[#F5C518] text-[11px] bg-[#1a1a1a] border border-[#333] px-2.5 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
                </div>
                <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-[#F5C518] flex items-center gap-1.5 border border-[#F5C518]/20 hover:border-[#F5C518]/50 hover:bg-[#F5C518]/10 px-3 py-1.5 rounded-full transition-all" style={{fontFamily:"Cairo,sans-serif"}}>
                  <Info size={12} /> دليل القياسات
                </button>
              </div>
              {safeSizes.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {/* ✅ Sizes — rounded-xl + selected glow */}
                  {safeSizes.map(sz => (
                    <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[58px] h-11 text-sm font-black rounded-xl border transition-all duration-200 ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_22px_rgba(255,255,255,0.18)] scale-105" : "bg-[#1a1a1a] text-gray-400 border-[#333] hover:border-[#F5C518]/30 hover:text-gray-200 hover:shadow-[0_0_10px_rgba(245,197,24,0.1)]"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <div className="flex gap-2">
              {/* ✅ Add to cart — continuous shimmer + larger padding */}
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

        {/* ✅ Trust strip — dividers between items + bigger icons */}
        <div className="mt-5 flex justify-between items-center bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <Truck size={16} className="text-[#F5C518] flex-shrink-0" /> شحن سريع
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <Eye size={16} className="text-[#F5C518] flex-shrink-0" /> معاينة قبل الاستلام
          </div>
          <div className="w-px h-5 bg-[#333]"></div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-300 font-bold flex-1 justify-center">
            <ShieldCheck size={16} className="text-[#F5C518] flex-shrink-0" /> استرجاع سهل
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center justify-center bg-[#121212] p-4 rounded-lg border border-[#333] gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <ShieldCheck size={14} className="text-green-500" />
            <span>تسوق بأمان - طرق دفع موثوقة ومحميّة 100%</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
             <CreditCard size={24} className="hover:text-white transition-colors"/>
             <Banknote size={24} className="hover:text-white transition-colors"/>
             <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded text-[10px] border border-[#333] font-bold tracking-wider">INSTAPAY</div>
             <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded text-[10px] border border-[#333] font-bold tracking-wider">VISA</div>
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
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>تفاصيل المنتج</span>
            </div>
            <div className="ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{__html: closedDescriptionHTML}} />
            </div>
          </div>
        )}

        {/* ✅ Related Products — rounded-2xl + card hover glow */}
        {relatedProducts.length > 0 && (
          <div className="py-8 border-t border-[#333]/50 mt-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-[3px] h-6 bg-[#F5C518] rounded-sm" />
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight" style={{fontFamily:"Cairo,sans-serif"}}>
                منتجات قد تعجبك
              </h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto hide-scrollbar-horizontal pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
              {relatedProducts.map(rp => (
                <Link 
                  href={`/product/${rp.id}`} 
                  key={rp.id} 
                  className="flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer block transition-all duration-300 hover:shadow-[0_8px_32px_rgba(245,197,24,0.10)] rounded-2xl"
                >
                  <div className="relative aspect-[3/4] bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#333] shadow-lg mb-3 group-hover:border-[#F5C518]/20 transition-colors duration-300">
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
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-sm md:text-base" style={{fontFamily:"Impact, sans-serif", letterSpacing:"1px"}}>
                      {rp.price}
                    </span>
                    <span className="text-[#F5C518] text-[10px] md:text-xs font-bold">ج.م</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ✅ Gallery Modal — smoother dots indicator */}
      {isGalleryOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex flex-col gallery-enter backdrop-blur-md"
          onClick={() => setGalleryOpen(false)} 
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
                <button onClick={galleryPrev} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all hover:shadow-[0_0_12px_rgba(245,197,24,0.2)]"><ChevronRight size={22} strokeWidth={1.5} /></button>
                <button onClick={galleryNext} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all hover:shadow-[0_0_12px_rgba(245,197,24,0.2)]"><ChevronLeft size={22} strokeWidth={1.5} /></button>
              </>
            )}
            
            {/* ✅ Smoother dots — use transition-[width] for pill animation */}
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

      {isDescModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#121212] w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a] sticky top-0 z-10">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#F5C518] rounded-full"></div>
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

        /* ✅ Ken Burns — subtle slow zoom */
        @keyframes kenBurns {
          0%   { transform: scale(1);    transform-origin: center top; }
          100% { transform: scale(1.06); transform-origin: center top; }
        }
        .hero-ken-burns {
          animation: kenBurns 8s ease-out forwards;
        }

        /* ✅ Continuous shimmer on pay button */
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

        /* ✅ Thumbnail cinematic transitions */
        .thumb-item { transition: width 0.35s cubic-bezier(0.25,1,0.5,1), height 0.35s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .thumb-inactive:hover { opacity: 0.85 !important; border-color: rgba(245,197,24,0.25) !important; }

        /* ✅ Poster card hover effect */
        .poster-card { transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .poster-card:hover { transform: scale(1.03) translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 24px rgba(245,197,24,0.12); }
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