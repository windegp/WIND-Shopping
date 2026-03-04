"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from "@/components/SizeChartModal";
import { Plus, Star, Info, Share2, Heart, ChevronDown, X, Truck, Eye, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const { addToCart }                       = useCart();
  const [activeImage, setActiveImage]       = useState("");
  const [activeIdx, setActiveIdx]           = useState(0);
  const [selectedSize, setSelectedSize]     = useState("");
  const [selectedColor, setSelectedColor]   = useState("");
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [isWishlisted, setIsWishlisted]     = useState(false);
  const [isGalleryOpen, setGalleryOpen]     = useState(false);
  const [galleryIdx, setGalleryIdx]         = useState(0);
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
    <div className="h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      <span className="text-[#F5C518] text-[10px] tracking-[0.35em] uppercase" style={{fontFamily:"Cairo,sans-serif",fontWeight:700}}>WIND ORIGINALS</span>
    </div>
  );
  if (!product) return (
    <div className="bg-[#0D0D0D] min-h-screen flex items-center justify-center text-gray-500" style={{fontFamily:"Cairo,sans-serif"}}>المنتج غير موجود</div>
  );

  const getUrl = img => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `/images/products/${product.folderName}/${img}`;
  };

  const gallery = product.images || [product.mainImage, ...Array.from({length: product.imagesCount || 0}, (_, i) => `${i+1}.webp`)];

  const goTo = idx => {
    const s = (idx + gallery.length) % gallery.length;
    setActiveImage(gallery[s]);
    setActiveIdx(s);
  };

  const openGallery = idx => { setGalleryIdx(idx); setGalleryOpen(true); };
  const galleryNext = () => setGalleryIdx(i => (i + 1) % gallery.length);
  const galleryPrev = () => setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length);
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
    if (!selectedColor) return gallery[0];
    const hi = product.colorSwatches?.[selectedColor];
    if (hi && (hi.startsWith("http") || hi.includes("/"))) return hi;
    return gallery[0];
  };

  const isInStock   = product?.quantity > 0 || product?.sellOutOfStock === "Yes";
  const discountPct = product.compareAtPrice ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100) : null;

  return (
    <div className="wp bg-[#0D0D0D] min-h-screen text-white pb-10 selection:bg-[#F5C518] selection:text-black">

      {/* 1. HERO */}
      <div className="relative w-full h-[72vh] md:h-[82vh] bg-black overflow-hidden group">
        <img src={getUrl(activeImage)} alt={product.title} className="w-full h-full object-cover object-top opacity-88 transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />

        {/* كل الصورة قابلة للضغط لفتح الجاليري */}
        <button onClick={() => openGallery(activeIdx)} className="absolute inset-0 z-10 cursor-zoom-in" aria-label="فتح معرض الصور" />

        {/* أيقونات التفاعل */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-20">
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/b">
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/12 group-hover/b:border-[#F5C518]/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" strokeWidth="1.5" /></svg>
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{fontFamily:"Cairo,sans-serif"}}>{gallery.length} صور</span>
          </button>
          <button onClick={e => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }} className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/b z-20">
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/12 group-hover/b:border-[#F5C518]/40 transition-colors">
              <Heart size={18} fill={isWishlisted?"#F5C518":"none"} color={isWishlisted?"#F5C518":"white"} />
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{fontFamily:"Cairo,sans-serif"}}>{product.likes||"1.2K"}</span>
          </button>
          <button onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/b z-20">
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/12 group-hover/b:border-[#F5C518]/40 transition-colors">
              <Share2 size={18} />
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{fontFamily:"Cairo,sans-serif"}}>مشاركة</span>
          </button>
        </div>

        {/* سهم تقليب */}
        <button onClick={e => { e.stopPropagation(); goTo(activeIdx + 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 p-2.5 rounded-full backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] opacity-0 group-hover:opacity-100 transition-all">
          <ChevronLeft size={30} strokeWidth={1.5} />
        </button>

        {discountPct && (
          <div className="absolute top-5 left-5 z-20 bg-[#F5C518] text-black text-[10px] font-black px-3 py-1" style={{fontFamily:"Cairo,sans-serif"}}>-{discountPct}%</div>
        )}

        {/* dots */}
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
          {gallery.slice(0,8).map((_,i) => (
            <span key={i} className={`rounded-full transition-all duration-300 ${activeIdx===i ? "w-5 h-1.5 bg-[#F5C518]" : "w-1.5 h-1.5 bg-white/30"}`} />
          ))}
        </div>

        {/* اسم المنتج داخل الصورة */}
        <div className="absolute bottom-0 right-0 left-0 px-5 pb-5 pt-16 pointer-events-none z-20">
          <div className="max-w-4xl mx-auto" dir="rtl">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <p className="text-[#F5C518] text-[9px] tracking-[0.3em] uppercase mb-1.5 opacity-80" style={{fontFamily:"Tajawal,sans-serif"}}>
                  WIND Series &nbsp;·&nbsp; {product.category || product.type || "أزياء"}
                </p>
                <h1 className="text-white text-[26px] md:text-3xl font-black leading-tight tracking-tight" style={{fontFamily:"Cairo,sans-serif"}}>
                  {product.title}
                </h1>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1 mb-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_,i) => <Star key={i} size={11} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-white/20"} fill={i<Math.round(product.rating||5)?"#F5C518":"transparent"} />)}
                </div>
                <span className="text-white/60 text-[10px]" style={{fontFamily:"Tajawal,sans-serif"}}>{product.reviewsCount||"490K"} تقييم</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BODY */}
      <div className="max-w-4xl mx-auto px-4" dir="rtl">

        {/* السعر + البوستر المصغر */}
        <div className="flex gap-5 items-start pt-6 pb-7 border-b border-[#1a1a1a]">
          <div className="flex-1">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-[44px] leading-none font-black text-white" style={{fontFamily:"Cairo,sans-serif", letterSpacing:"-2px"}}>{product.price}</span>
              <span className="text-base font-bold text-[#F5C518] mb-1" style={{fontFamily:"Cairo,sans-serif"}}>ج.م</span>
              {product.compareAtPrice && <span className="text-sm text-gray-600 line-through mb-1.5" style={{fontFamily:"Tajawal,sans-serif"}}>{product.compareAtPrice} ج.م</span>}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isInStock?"bg-green-400":"bg-red-400"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isInStock?"bg-green-500":"bg-red-500"}`} />
              </span>
              <span className={`text-xs font-semibold ${isInStock?"text-green-400":"text-red-400"}`} style={{fontFamily:"Tajawal,sans-serif"}}>{isInStock?"متوفر في المخزون":"غير متوفر"}</span>
              <span className="text-gray-700 text-[10px]">—</span>
              <span className="text-gray-600 text-[10px]" style={{fontFamily:"Tajawal,sans-serif"}}>الشحن يُحسب عند الدفع</span>
            </div>
            <div className="flex items-center gap-5">
              {[{icon:<Truck size={13}/>,l:"شحن سريع"},{icon:<Eye size={13}/>,l:"معاينة"},{icon:<ShieldCheck size={13}/>,l:"دفع آمن"}].map(({icon,l}) => (
                <div key={l} className="flex items-center gap-1.5 text-[10px] text-gray-500" style={{fontFamily:"Tajawal,sans-serif"}}>
                  <span className="text-[#F5C518]">{icon}</span>{l}
                </div>
              ))}
            </div>
          </div>

          {/* البوستر المصغر */}
          <div className="relative w-24 flex-shrink-0 group/poster cursor-pointer" onClick={() => openGallery(0)}>
            <div className="relative w-24 h-[136px] rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl transition-all duration-500 group-hover/poster:ring-[#F5C518]/40 group-hover/poster:shadow-[0_8px_40px_rgba(245,197,24,0.18)]">
              <img src={getUrl(currentColorImage())} className="w-full h-full object-cover transition-transform duration-700 group-hover/poster:scale-110" alt={selectedColor||"preview"} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute top-0 right-0 bg-black/70 p-1 rounded-bl-lg"><Plus size={12} className="text-white" /></div>
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-black/60 border border-[#F5C518]/50 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
              {selectedColor && <span className="absolute bottom-2 inset-x-1 text-center text-[9px] font-bold text-white/90 truncate" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
            </div>
            <div className="mt-2 flex justify-center gap-1">
              {gallery.slice(0,4).map((img,i) => (
                <div key={i} onClick={e => { e.stopPropagation(); goTo(i); }} className={`w-4 h-6 rounded overflow-hidden cursor-pointer transition-all ${activeIdx===i ? "ring-1 ring-[#F5C518]" : "opacity-40 hover:opacity-70"}`}>
                  <img src={getUrl(img)} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* الألوان — مربعات */}
        {safeColors.length > 0 && (
          <div className="py-6 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اختر اللون</span>
              {selectedColor && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#252525] px-2.5 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
            </div>
            <div ref={colorsRef} className="flex flex-wrap gap-3">
              {safeColors.map((ci, i) => {
                const name  = typeof ci === "string" ? ci : ci.name;
                const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
                const isImg = hi.startsWith("http") || hi.includes("/");
                const isSel = selectedColor === name;
                return (
                  <button key={i} onClick={() => { setSelectedColor(name); if (isImg) { setActiveImage(hi); setActiveIdx(0); } }} title={name} className="flex flex-col items-center gap-1.5 group/c transition-all duration-200">
                    <div className={`w-11 h-11 overflow-hidden transition-all duration-200 ${isSel ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D] scale-105" : "ring-1 ring-white/10 hover:ring-white/30 hover:scale-105"}`}>
                      {isImg ? <img src={hi} className="w-full h-full object-cover" alt={name} /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                    </div>
                    <span className={`text-[9px] font-medium uppercase tracking-wide max-w-[44px] text-center truncate transition-colors ${isSel ? "text-[#F5C518]" : "text-gray-600 group-hover/c:text-gray-400"}`} style={{fontFamily:"Tajawal,sans-serif"}}>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* المقاسات */}
        {safeSizes.length > 0 && (
          <div className="py-6 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اختر المقاس</span>
                {selectedSize && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#252525] px-2.5 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
              </div>
              <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-[#F5C518] flex items-center gap-1.5 border border-[#F5C518]/20 hover:border-[#F5C518]/50 hover:bg-[#F5C518]/5 px-3 py-1.5 rounded-full transition-all" style={{fontFamily:"Cairo,sans-serif"}}>
                <Info size={12} /> دليل القياسات
              </button>
            </div>
            {safeSizes.length > 1 && (
              <div className="flex flex-wrap gap-2.5">
                {safeSizes.map(sz => (
                  <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[58px] h-11 text-sm font-black rounded border transition-all duration-200 ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105" : "bg-[#141414] text-gray-400 border-[#252525] hover:border-[#F5C518]/30 hover:text-gray-200"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* الخامة والـ Fit */}
        <div className="py-5 border-b border-[#1a1a1a] flex flex-wrap gap-x-8 gap-y-2">
          <div className="text-sm" style={{fontFamily:"Tajawal,sans-serif"}}><span className="text-gray-600">الخامة: </span><span className="text-gray-300">{product.metafields?.fabric||"قطن 100% معالج ضد الانكماش"}</span></div>
          <div className="text-sm" style={{fontFamily:"Tajawal,sans-serif"}}><span className="text-gray-600">القصّة: </span><span className="text-gray-300">{product.metafields?.fit||"Relaxed Fit — مناسب للجنسين"}</span></div>
        </div>

        {/* زر أضف للسلة — ظاهر دايماً */}
        <div className="py-6 border-b border-[#1a1a1a]">
          <div className="flex gap-2">
            <button onClick={() => addToCart({...product, selectedSize, selectedColor, image: getUrl(activeImage)})} className="flex-1 bg-[#F5C518] hover:bg-[#ffd23f] active:scale-[0.98] text-black font-black text-base py-4 rounded flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(245,197,24,0.18)] transition-all group/cta" style={{fontFamily:"Cairo,sans-serif"}}>
              <Plus size={19} className="transition-transform group-hover/cta:rotate-90 duration-300" />
              أضف إلى حقيبتك — {product.price} ج.م
            </button>
            <button onClick={() => setIsWishlisted(!isWishlisted)} className={`p-4 rounded border transition-all ${isWishlisted ? "bg-[#F5C518]/10 border-[#F5C518]/40 text-[#F5C518]" : "bg-[#141414] border-[#252525] text-gray-500 hover:border-[#F5C518]/20 hover:text-[#F5C518]"}`}>
              <Heart size={18} fill={isWishlisted?"#F5C518":"none"} />
            </button>
            <button className="bg-[#141414] border border-[#252525] hover:border-[#F5C518]/20 p-4 rounded text-gray-500 transition-all">
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* الوصف الكامل بتنسيقه الداخلي */}
        {product.description && (
          <div className="py-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>تفاصيل المنتج</span>
            </div>
            <div className="ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{__html: product.description}} />
            </div>
          </div>
        )}
      </div>

      {/* GALLERY MODAL */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black/97 flex flex-col gallery-enter">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
              <span className="text-white font-black text-sm" style={{fontFamily:"Cairo,sans-serif"}}>{product.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-xs" style={{fontFamily:"Cairo,sans-serif"}}>{galleryIdx+1} / {gallery.length}</span>
              <button onClick={() => setGalleryOpen(false)} className="bg-[#1a1a1a] hover:bg-[#252525] border border-[#252525] p-2 rounded-full text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <img key={galleryIdx} src={getUrl(gallery[galleryIdx])} alt="" className="max-h-full max-w-full object-contain gallery-img-enter" />
            <button onClick={galleryPrev} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all"><ChevronRight size={22} strokeWidth={1.5} /></button>
            <button onClick={galleryNext} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-3 rounded-full transition-all"><ChevronLeft size={22} strokeWidth={1.5} /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {gallery.map((_,i) => <span key={i} className={`rounded-full transition-all duration-300 ${galleryIdx===i ? "w-5 h-1.5 bg-[#F5C518]" : "w-1.5 h-1.5 bg-white/20"}`} />)}
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] py-3 px-4 bg-[#0D0D0D]">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
              {gallery.filter(Boolean).map((img,i) => (
                <button key={i} onClick={() => setGalleryIdx(i)} className={`flex-shrink-0 w-14 h-20 overflow-hidden rounded-md transition-all duration-200 ${galleryIdx===i ? "ring-2 ring-[#F5C518] ring-offset-1 ring-offset-[#0D0D0D] scale-105" : "ring-1 ring-white/5 opacity-40 hover:opacity-80"}`}>
                  <img src={getUrl(img)} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <SizeChartModal isOpen={isSizeGuideOpen} onClose={() => setSizeGuideOpen(false)} product={product} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');
        .wp { font-family: 'Tajawal', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display:none }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none }
        @keyframes galleryIn { from{opacity:0} to{opacity:1} }
        @keyframes imgIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        .gallery-enter { animation: galleryIn 0.25s ease-out }
        .gallery-img-enter { animation: imgIn 0.3s cubic-bezier(0.25,1,0.5,1) }
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