"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from "@/components/SizeChartModal";
import { Plus, Star, Info, Share2, Heart, ChevronDown, X, Truck, Eye, ShieldCheck, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const { addToCart }             = useCart();

  const [activeImage, setActiveImage]           = useState("");
  const [activeIdx, setActiveIdx]               = useState(0);
  const [selectedSize, setSelectedSize]         = useState("");
  const [selectedColor, setSelectedColor]       = useState("");
  const [isSizeGuideOpen, setSizeGuideOpen]     = useState(false);
  const [isWishlisted, setIsWishlisted]         = useState(false);
  const [isDescOpen, setDescOpen]               = useState(false);
  const [isZoomOpen, setZoomOpen]               = useState(false);

  const colorsRef = useRef(null);

  // ── DATA FETCHING (unchanged) ─────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const staticProduct = staticProducts.find(p => p.id.toString() === id.toString());
      if (staticProduct) {
        setProduct(staticProduct);
        setActiveImage(staticProduct.mainImage);
        if (staticProduct.sizes?.length  > 0) setSelectedSize(staticProduct.sizes[0]);
        if (staticProduct.colors?.length > 0) setSelectedColor(staticProduct.colors[0].name || staticProduct.colors[0]);
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fb   = { id: docSnap.id, ...data };
          setProduct(fb);
          setActiveImage(fb.images?.[0] || fb.mainImageUrl || fb.image);
          let initSize = "", initColor = "";
          if (fb.options && Array.isArray(fb.options)) {
            fb.options.forEach(opt => {
              const n = (opt.name || "").toLowerCase();
              if ((n.includes("size") || n === "المقاس" || n === "مقاس") && opt.values) initSize  = opt.values.split(",")[0].trim();
              if ((n.includes("color")|| n === "اللون"  || n === "لون")   && opt.values) initColor = opt.values.split(",")[0].trim();
            });
          }
          if (initSize)  setSelectedSize(initSize);
          else { const a = fb.options?.sizes || fb.sizes; if (Array.isArray(a) && a.length) setSelectedSize(a[0]); }
          if (initColor) setSelectedColor(initColor);
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
    <div className="bg-[#0D0D0D] min-h-screen flex items-center justify-center text-gray-500" style={{fontFamily:"Cairo,sans-serif"}}>
      المنتج غير موجود
    </div>
  );

  // ── HELPERS (unchanged) ───────────────────────────────────
  const getImageUrl = img => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `/images/products/${product.folderName}/${img}`;
  };

  const gallery = product.images || [
    product.mainImage,
    ...Array.from({length: product.imagesCount || 0}, (_, i) => `${i+1}.webp`)
  ];

  const goTo = idx => {
    const safe = (idx + gallery.length) % gallery.length;
    setActiveImage(gallery[safe]);
    setActiveIdx(safe);
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

  const stripHtml = html => {
    if (!html) return "";
    let c = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    const d = new DOMParser().parseFromString(c, "text/html");
    let t = d.body.textContent || "";
    [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i].forEach(r => { t = t.replace(r, ""); });
    return t.trim();
  };

  const fullDesc  = stripHtml(product.description);
  const shortDesc = fullDesc.substring(0, 160);
  const hasMore   = fullDesc.length > 160;
  const isInStock = product?.quantity > 0 || product?.sellOutOfStock === "Yes";
  const discountPct = product.compareAtPrice ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100) : null;

  // shared props
  const infoProps = {
    product, gallery, activeImage, safeSizes, safeColors,
    selectedSize, selectedColor, setSelectedSize, setSelectedColor,
    setActiveImage, isWishlisted, setIsWishlisted,
    isInStock, discountPct, shortDesc, hasMore, fullDesc,
    setDescOpen, setSizeGuideOpen, currentColorImage, getImageUrl, addToCart, colorsRef, goTo, activeIdx
  };

  return (
    <div className="wp bg-[#0D0D0D] min-h-screen text-white selection:bg-[#F5C518] selection:text-black">

      {/* ══════════════════════════════════════
          DESKTOP — split screen
      ══════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[80px_1fr_420px] h-screen sticky top-0" dir="ltr">

        {/* thumbnail strip */}
        <div className="overflow-y-auto py-5 px-2 bg-[#0D0D0D] border-r border-[#171717] scrollbar-hide flex flex-col gap-2">
          {gallery.filter(Boolean).map((img, i) => (
            <button key={i} onClick={() => goTo(i)} className={`relative w-full aspect-[2/3] flex-shrink-0 overflow-hidden rounded transition-all duration-200 ${activeIdx===i ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D]" : "ring-1 ring-white/5 opacity-40 hover:opacity-80"}`}>
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>

        {/* main image */}
        <div className="relative bg-[#111] overflow-hidden group">
          <img src={getImageUrl(activeImage)} alt={product.title} className="w-full h-full object-cover object-top transition-opacity duration-500" />
          <button onClick={() => goTo(activeIdx-1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button onClick={() => goTo(activeIdx+1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
          <button onClick={() => setZoomOpen(true)} className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 hover:border-[#F5C518]/40 text-white/60 hover:text-[#F5C518] p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
            <ZoomIn size={16} />
          </button>
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] text-gray-500 border border-white/8" style={{fontFamily:"Cairo,sans-serif"}}>
            {activeIdx+1} / {gallery.length}
          </div>
        </div>

        {/* info panel */}
        <div className="overflow-y-auto bg-[#0D0D0D] border-l border-[#171717] scrollbar-hide">
          <DesktopInfo {...infoProps} />
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE layout
      ══════════════════════════════════════ */}
      <div className="md:hidden">

        {/* image slider */}
        <div className="relative w-full aspect-[3/4] bg-[#111] overflow-hidden group">
          <img src={getImageUrl(activeImage)} alt={product.title} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0D0D0D] to-transparent pointer-events-none" />
          <button onClick={() => goTo(activeIdx-1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/10 p-2 rounded-full text-white/70 z-10">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
          <button onClick={() => goTo(activeIdx+1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/10 p-2 rounded-full text-white/70 z-10">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button onClick={() => setIsWishlisted(!isWishlisted)} className="bg-black/50 backdrop-blur-sm border border-white/10 p-2 rounded-full">
              <Heart size={17} fill={isWishlisted?"#F5C518":"none"} color={isWishlisted?"#F5C518":"white"} />
            </button>
            <button className="bg-black/50 backdrop-blur-sm border border-white/10 p-2 rounded-full">
              <Share2 size={17} className="text-white" />
            </button>
          </div>
          {discountPct && (
            <div className="absolute top-4 right-4 bg-[#F5C518] text-black text-[10px] font-black px-2.5 py-1 z-10" style={{fontFamily:"Cairo,sans-serif"}}>-{discountPct}%</div>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {gallery.slice(0,8).map((_,i) => (
              <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all duration-300 ${activeIdx===i ? "w-4 h-1.5 bg-[#F5C518]" : "w-1.5 h-1.5 bg-white/30"}`} />
            ))}
          </div>
        </div>

        {/* thumbnails row */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide bg-[#0D0D0D] border-b border-[#171717]">
          {gallery.filter(Boolean).map((img, i) => (
            <button key={i} onClick={() => goTo(i)} className={`flex-shrink-0 w-12 h-16 overflow-hidden rounded transition-all ${activeIdx===i ? "ring-2 ring-[#F5C518] ring-offset-1 ring-offset-[#0D0D0D]" : "ring-1 ring-white/5 opacity-40"}`}>
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>

        {/* mobile info */}
        <div className="px-4 pt-5 pb-36" dir="rtl">
          <MobileInfo {...infoProps} />
        </div>

        {/* sticky CTA */}
        <div className="fixed bottom-0 inset-x-0 z-50 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent pt-6 pb-5 px-4">
          <div className="flex gap-2">
            <button onClick={() => addToCart({...product, selectedSize, selectedColor, image: getImageUrl(activeImage)})} className="flex-1 bg-[#F5C518] hover:bg-[#ffd23f] active:scale-[0.98] text-black font-black py-4 rounded flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(245,197,24,0.2)] transition-all text-sm" style={{fontFamily:"Cairo,sans-serif"}}>
              <Plus size={18} /> أضف للحقيبة — {product.price} ج.م
            </button>
            <button className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded text-white">
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Zoom modal ── */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[120] bg-black/98 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
          <div className="relative max-w-2xl w-full aspect-[3/4] rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(activeImage)} className="w-full h-full object-contain" alt="zoom" />
            <button onClick={() => setZoomOpen(false)} className="absolute top-4 right-4 bg-black/70 p-2 rounded-full text-white/70 border border-white/10"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* ── Description modal ── */}
      {isDescOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111] w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-[#1e1e1e] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] desc-enter">
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex justify-between items-center bg-[#141414] sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                <h3 className="font-black text-white text-base" style={{fontFamily:"Cairo,sans-serif"}}>معلومات المنتج</h3>
              </div>
              <button onClick={() => setDescOpen(false)} className="bg-[#1e1e1e] hover:bg-[#2a2a2a] p-1.5 rounded-full text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{__html: product.description}} />
            </div>
          </div>
        </div>
      )}

      <SizeChartModal isOpen={isSizeGuideOpen} onClose={() => setSizeGuideOpen(false)} product={product} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');
        .wp { font-family: 'Tajawal', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        @keyframes descUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        .desc-enter { animation: descUp 0.35s cubic-bezier(0.25,1,0.5,1); }
        .dark-wind-tabs .wind-tabs-container { background:transparent!important }
        .dark-wind-tabs .wind-tabs-container details { background:#1a1a1a!important; border-bottom:1px solid #222!important; border-radius:8px; margin-bottom:8px; padding:0 15px!important; transition:all .3s }
        .dark-wind-tabs .wind-tabs-container details[open] { border-color:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container summary { color:#fff!important; border:none!important }
        .dark-wind-tabs .wind-tabs-container summary svg path { stroke:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container div { color:#a1a1aa!important }
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color:#F5C518!important }
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom:1px solid #222!important }
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"],.dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color:#e5e7eb!important }
        .dark-wind-tabs .wind-tabs-container button,.dark-wind-tabs .wind-tabs-container .read-more-wrapper summary { color:#F5C518!important }
        .ql-editor-display ul { list-style-type:disc!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display ol { list-style-type:decimal!important; padding-right:20px!important; margin-bottom:10px }
        .ql-editor-display strong { font-weight:900; color:#fff }
      `}</style>
    </div>
  );
}

// ============================================================
// DESKTOP INFO PANEL
// ============================================================
function DesktopInfo({ product, safeSizes, safeColors, selectedSize, selectedColor, setSelectedSize, setSelectedColor, setActiveImage, isWishlisted, setIsWishlisted, isInStock, discountPct, shortDesc, hasMore, setDescOpen, setSizeGuideOpen, currentColorImage, getImageUrl, addToCart, activeImage, colorsRef }) {
  return (
    <div className="px-7 py-8" dir="rtl">

      <p className="text-[10px] text-gray-600 tracking-[0.25em] uppercase mb-5" style={{fontFamily:"Tajawal,sans-serif"}}>
        WIND Originals &nbsp;/&nbsp; {product.category || "أزياء"}
      </p>

      <h1 className="text-[22px] font-black text-white leading-tight mb-3" style={{fontFamily:"Cairo,sans-serif", letterSpacing:"-0.5px"}}>{product.title}</h1>

      {/* rating */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_,i) => <Star key={i} size={11} className={i < Math.round(product.rating||5) ? "text-[#F5C518]" : "text-[#2a2a2a]"} fill={i < Math.round(product.rating||5) ? "#F5C518" : "#2a2a2a"} />)}
        </div>
        <span className="text-white text-xs font-bold" style={{fontFamily:"Cairo,sans-serif"}}>{product.rating||"4.9"}</span>
        <span className="text-gray-600 text-xs" style={{fontFamily:"Tajawal,sans-serif"}}>({product.reviewsCount||"490K"})</span>
      </div>

      {/* price */}
      <div className="flex items-end gap-3 mb-2">
        <span className="text-[38px] font-black text-white leading-none" style={{fontFamily:"Cairo,sans-serif", letterSpacing:"-1.5px"}}>{product.price}</span>
        <span className="text-sm font-semibold text-[#F5C518] mb-1" style={{fontFamily:"Tajawal,sans-serif"}}>ج.م</span>
        {product.compareAtPrice && <span className="text-sm text-gray-600 line-through mb-1" style={{fontFamily:"Tajawal,sans-serif"}}>{product.compareAtPrice} ج.م</span>}
        {discountPct && <span className="mb-1 bg-[#F5C518] text-black text-[10px] font-black px-2 py-0.5" style={{fontFamily:"Cairo,sans-serif"}}>-{discountPct}%</span>}
      </div>

      {/* stock */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? "bg-green-500" : "bg-red-500"}`} />
        <span className={`text-xs ${isInStock ? "text-green-400" : "text-red-400"}`} style={{fontFamily:"Tajawal,sans-serif"}}>{isInStock ? "متوفر في المخزون" : "غير متوفر"}</span>
      </div>

      <div className="h-px bg-[#171717] mb-6" />

      {/* ── Color: preview card + swatches ── */}
      {safeColors.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اللون</span>
            {selectedColor && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#222] px-2 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
          </div>

          {/* preview card (البوستر المصغر) + swatches جنبه */}
          <div className="flex gap-4 items-start">
            <div className="w-[72px] h-[104px] flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-white/8 relative group/cp">
              <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover group-hover/cp:scale-110 transition-transform duration-500" alt={selectedColor} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1.5 inset-x-0 text-center text-[8px] font-bold text-white/80 truncate px-1" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>
            </div>
            <div ref={colorsRef} className="flex flex-wrap gap-2 content-start">
              {safeColors.map((ci, i) => {
                const name  = typeof ci === "string" ? ci : ci.name;
                const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
                const isImg = hi.startsWith("http") || hi.includes("/");
                const isSel = selectedColor === name;
                return (
                  <button key={i} onClick={() => { setSelectedColor(name); if (isImg) setActiveImage(hi); }} title={name} className={`w-9 h-9 rounded-full transition-all duration-200 ${isSel ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D] scale-110" : "ring-1 ring-white/8 hover:ring-white/25"}`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {isImg ? <img src={hi} className="w-full h-full object-cover" alt={name} /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sizes ── */}
      {safeSizes.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>المقاس</span>
              {selectedSize && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#222] px-2 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
            </div>
            <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-[#F5C518] flex items-center gap-1 border border-[#F5C518]/20 hover:border-[#F5C518]/50 px-3 py-1.5 rounded-full transition-colors" style={{fontFamily:"Cairo,sans-serif"}}>
              <Info size={11} /> دليل القياسات
            </button>
          </div>
          {safeSizes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {safeSizes.map(sz => (
                <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[52px] h-10 text-sm font-black rounded border transition-all ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105" : "bg-[#141414] text-gray-400 border-[#222] hover:border-[#F5C518]/30"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Description ── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>الوصف</span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed" style={{fontFamily:"Tajawal,sans-serif"}}>{shortDesc}{hasMore && "..."}</p>
        {hasMore && (
          <button onClick={() => setDescOpen(true)} className="text-[#F5C518] text-xs font-bold mt-2 flex items-center gap-1 hover:underline" style={{fontFamily:"Cairo,sans-serif"}}>
            قراءة التفاصيل الكاملة
            <span className="w-3.5 h-3.5 rounded-full border border-[#F5C518] flex items-center justify-center text-[9px] font-black">!</span>
          </button>
        )}
      </div>

      {/* ── Fabric + Fit ── */}
      <div className="mb-7 space-y-2 text-sm border-r-2 border-[#1e1e1e] pr-3" style={{fontFamily:"Tajawal,sans-serif"}}>
        <div><span className="text-gray-600">الخامة: </span><span className="text-gray-300">{product.metafields?.fabric || "قطن 100% معالج ضد الانكماش"}</span></div>
        <div><span className="text-gray-600">القصّة: </span><span className="text-gray-300">{product.metafields?.fit || "Relaxed Fit — مناسب للجنسين"}</span></div>
      </div>

      <div className="h-px bg-[#171717] mb-6" />

      {/* ── Trust badges ── */}
      <div className="grid grid-cols-3 gap-2 mb-7">
        {[{icon:<Truck size={14}/>,l:"شحن سريع"},{icon:<Eye size={14}/>,l:"معاينة"},{icon:<ShieldCheck size={14}/>,l:"دفع آمن"}].map(({icon,l}) => (
          <div key={l} className="flex flex-col items-center gap-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg py-3">
            <span className="text-[#F5C518]">{icon}</span>
            <span className="text-[10px] text-gray-600" style={{fontFamily:"Tajawal,sans-serif"}}>{l}</span>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div className="flex gap-2">
        <button onClick={() => addToCart({...product, selectedSize, selectedColor, image: getImageUrl(activeImage)})} className="flex-1 bg-[#F5C518] hover:bg-[#ffd23f] active:scale-[0.98] text-black font-black py-4 rounded flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,197,24,0.12)] transition-all" style={{fontFamily:"Cairo,sans-serif"}}>
          <Plus size={17} /> أضف للحقيبة
        </button>
        <button onClick={() => setIsWishlisted(!isWishlisted)} className={`p-4 rounded border transition-all ${isWishlisted ? "bg-[#F5C518]/10 border-[#F5C518]/40 text-[#F5C518]" : "bg-[#141414] border-[#222] text-gray-500 hover:border-[#F5C518]/20"}`}>
          <Heart size={17} fill={isWishlisted?"#F5C518":"none"} />
        </button>
        <button className="bg-[#141414] border border-[#222] hover:border-[#F5C518]/20 p-4 rounded text-gray-500 transition-all">
          <ChevronDown size={17} />
        </button>
      </div>

      <p className="text-[10px] text-gray-700 text-center mt-3" style={{fontFamily:"Tajawal,sans-serif"}}>يتم احتساب مصاريف الشحن عند الدفع</p>
    </div>
  );
}

// ============================================================
// MOBILE INFO PANEL
// ============================================================
function MobileInfo({ product, safeSizes, safeColors, selectedSize, selectedColor, setSelectedSize, setSelectedColor, setActiveImage, isInStock, discountPct, shortDesc, hasMore, setDescOpen, setSizeGuideOpen, currentColorImage, getImageUrl, colorsRef }) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 tracking-[0.2em] uppercase mb-3" style={{fontFamily:"Tajawal,sans-serif"}}>WIND Originals / {product.category||"أزياء"}</p>
      <h1 className="text-xl font-black text-white leading-tight mb-2" style={{fontFamily:"Cairo,sans-serif", letterSpacing:"-0.5px"}}>{product.title}</h1>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} size={10} className={i<Math.round(product.rating||5)?"text-[#F5C518]":"text-[#2a2a2a]"} fill={i<Math.round(product.rating||5)?"#F5C518":"#2a2a2a"} />)}</div>
        <span className="text-white text-xs font-bold" style={{fontFamily:"Cairo,sans-serif"}}>{product.rating||"4.9"}</span>
        <span className="text-gray-600 text-xs" style={{fontFamily:"Tajawal,sans-serif"}}>({product.reviewsCount||"490K"})</span>
      </div>

      <div className="flex items-end gap-2 mb-1.5">
        <span className="text-[32px] font-black text-white leading-none" style={{fontFamily:"Cairo,sans-serif",letterSpacing:"-1px"}}>{product.price}</span>
        <span className="text-sm font-semibold text-[#F5C518] mb-1" style={{fontFamily:"Tajawal,sans-serif"}}>ج.م</span>
        {product.compareAtPrice && <span className="text-sm text-gray-600 line-through mb-1" style={{fontFamily:"Tajawal,sans-serif"}}>{product.compareAtPrice} ج.م</span>}
        {discountPct && <span className="mb-1 bg-[#F5C518] text-black text-[10px] font-black px-2 py-0.5" style={{fontFamily:"Cairo,sans-serif"}}>-{discountPct}%</span>}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className={`w-1.5 h-1.5 rounded-full ${isInStock?"bg-green-500":"bg-red-500"}`} />
        <span className={`text-xs ${isInStock?"text-green-400":"text-red-400"}`} style={{fontFamily:"Tajawal,sans-serif"}}>{isInStock?"متوفر في المخزون":"غير متوفر"}</span>
      </div>

      <div className="h-px bg-[#171717] mb-5" />

      {/* colors */}
      {safeColors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>اللون</span>
            {selectedColor && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#222] px-2 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedColor}</span>}
          </div>
          <div className="flex gap-3 items-start">
            {/* البوستر المصغر */}
            <div className="w-16 h-[88px] flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-white/8 relative">
              <img src={getImageUrl(currentColorImage())} className="w-full h-full object-cover" alt={selectedColor} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div ref={colorsRef} className="flex flex-wrap gap-2">
              {safeColors.map((ci, i) => {
                const name  = typeof ci === "string" ? ci : ci.name;
                const hi    = product.colorSwatches?.[name] || (typeof ci === "object" ? ci.swatch : "#333");
                const isImg = hi.startsWith("http") || hi.includes("/");
                const isSel = selectedColor === name;
                return (
                  <button key={i} onClick={() => { setSelectedColor(name); if (isImg) setActiveImage(hi); }} title={name} className={`w-9 h-9 rounded-full transition-all ${isSel ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D] scale-110" : "ring-1 ring-white/8"}`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {isImg ? <img src={hi} className="w-full h-full object-cover" alt={name} /> : <div style={{backgroundColor:hi}} className="w-full h-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* sizes */}
      {safeSizes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>المقاس</span>
              {selectedSize && <span className="text-[#F5C518] text-[11px] bg-[#141414] border border-[#222] px-2 py-0.5 rounded" style={{fontFamily:"Tajawal,sans-serif"}}>{selectedSize}</span>}
            </div>
            <button onClick={() => setSizeGuideOpen(true)} className="text-[11px] text-[#F5C518] flex items-center gap-1 border border-[#F5C518]/20 px-3 py-1.5 rounded-full" style={{fontFamily:"Cairo,sans-serif"}}>
              <Info size={11} /> دليل القياسات
            </button>
          </div>
          {safeSizes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {safeSizes.map(sz => (
                <button key={sz} onClick={() => setSelectedSize(sz)} className={`min-w-[52px] h-10 text-sm font-black rounded border transition-all ${selectedSize===sz ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105" : "bg-[#141414] text-gray-400 border-[#222]"}`} style={{fontFamily:"Cairo,sans-serif"}}>{sz}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* description */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-[3px] h-4 bg-[#F5C518] rounded-sm" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest" style={{fontFamily:"Cairo,sans-serif"}}>الوصف</span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed" style={{fontFamily:"Tajawal,sans-serif"}}>{shortDesc}{hasMore && "..."}</p>
        {hasMore && (
          <button onClick={() => setDescOpen(true)} className="text-[#F5C518] text-xs font-bold mt-2 flex items-center gap-1" style={{fontFamily:"Cairo,sans-serif"}}>
            قراءة التفاصيل <span className="w-3.5 h-3.5 rounded-full border border-[#F5C518] flex items-center justify-center text-[9px] font-black">!</span>
          </button>
        )}
      </div>

      {/* fabric + fit */}
      <div className="mb-5 space-y-1.5 text-sm border-r-2 border-[#1e1e1e] pr-3" style={{fontFamily:"Tajawal,sans-serif"}}>
        <div><span className="text-gray-600">الخامة: </span><span className="text-gray-300">{product.metafields?.fabric||"قطن 100% معالج ضد الانكماش"}</span></div>
        <div><span className="text-gray-600">القصّة: </span><span className="text-gray-300">{product.metafields?.fit||"Relaxed Fit — مناسب للجنسين"}</span></div>
      </div>

      {/* trust */}
      <div className="grid grid-cols-3 gap-2">
        {[{icon:<Truck size={13}/>,l:"شحن سريع"},{icon:<Eye size={13}/>,l:"معاينة"},{icon:<ShieldCheck size={13}/>,l:"دفع آمن"}].map(({icon,l}) => (
          <div key={l} className="flex flex-col items-center gap-1 bg-[#111] border border-[#1a1a1a] rounded-lg py-2.5">
            <span className="text-[#F5C518]">{icon}</span>
            <span className="text-[10px] text-gray-600" style={{fontFamily:"Tajawal,sans-serif"}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}