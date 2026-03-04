"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { products as staticProducts } from "../../../lib/products";
import { useCart } from "../../../context/CartContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import SizeChartModal from '@/components/SizeChartModal';
import {
  Plus, Star, Info, Share2, Heart,
  ImageIcon, ChevronDown, X, Truck,
  Eye, ShieldCheck, ChevronLeft, Search, ChevronRight
} from "lucide-react";

// ==========================================================================
// LUXURY PRODUCT PAGE — متسقة مع الصفحة الرئيسية
// ✅ كل المنطق والـ props والـ Firebase محفوظين بالكامل
// ✅ خط Cairo للعناوين + Tajawal للفرعي
// ✅ ألوان #F5C518 و #5799ef الأصلية
// ✅ كل العناصر المميزة محفوظة في أماكن أنسب
// ==========================================================================

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct]                   = useState(null);
  const [loading, setLoading]                   = useState(true);
  const { addToCart }                           = useCart();

  const [activeImage, setActiveImage]           = useState("");
  const [selectedSize, setSelectedSize]         = useState("");
  const [selectedColor, setSelectedColor]       = useState("");
  const [isSizeGuideOpen, setSizeGuideOpen]     = useState(false);
  const [isWishlisted, setIsWishlisted]         = useState(false);
  const [isDescModalOpen, setDescModalOpen]     = useState(false);
  const [isImageZoomModalOpen, setImageZoomModalOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex]   = useState(0);

  const colorsScrollRef = useRef(null);

  // =========================================================
  // DATA FETCHING — محفوظ بالكامل بدون أي تغيير
  // =========================================================
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const staticProduct = staticProducts.find(
        (p) => p.id.toString() === id.toString()
      );

      if (staticProduct) {
        setProduct(staticProduct);
        setActiveImage(staticProduct.mainImage);
        if (staticProduct.sizes?.length > 0) setSelectedSize(staticProduct.sizes[0]);
        if (staticProduct.colors?.length > 0)
          setSelectedColor(staticProduct.colors[0].name || staticProduct.colors[0]);
        setLoading(false);
      } else {
        try {
          const docRef  = doc(db, "products", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data      = docSnap.data();
            const fbProduct = { id: docSnap.id, ...data };
            setProduct(fbProduct);

            const firstImg = fbProduct.images?.[0] || fbProduct.mainImageUrl || fbProduct.image;
            setActiveImage(firstImg);

            let initialSize  = "";
            let initialColor = "";

            if (fbProduct.options && Array.isArray(fbProduct.options)) {
              fbProduct.options.forEach((opt) => {
                const optName = (opt.name || "").toLowerCase();
                if ((optName.includes("size") || optName === "المقاس" || optName === "مقاس") && opt.values)
                  initialSize = opt.values.split(",")[0].trim();
                if ((optName.includes("color") || optName === "اللون" || optName === "لون") && opt.values)
                  initialColor = opt.values.split(",")[0].trim();
              });
            }

            if (initialSize) {
              setSelectedSize(initialSize);
            } else {
              const sizesArray = fbProduct.options?.sizes || fbProduct.sizes;
              if (Array.isArray(sizesArray) && sizesArray.length > 0)
                setSelectedSize(sizesArray[0]);
            }

            if (initialColor) {
              setSelectedColor(initialColor);
            } else {
              const colorsArray = fbProduct.options?.colors;
              if (Array.isArray(colorsArray) && colorsArray.length > 0)
                setSelectedColor(colorsArray[0].name || colorsArray[0]);
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

  // =========================================================
  // LOADING & NOT FOUND
  // =========================================================
  if (loading)
    return (
      <div className="h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
        <span
          className="text-[#F5C518] text-xs tracking-[0.3em] uppercase animate-pulse"
          style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
        >
          WIND ORIGINALS...
        </span>
      </div>
    );

  if (!product)
    return (
      <div className="text-white text-center py-20 bg-[#0D0D0D] min-h-screen"
           style={{ fontFamily: "Cairo, sans-serif" }}>
        المنتج غير موجود
      </div>
    );

  // =========================================================
  // HELPERS — محفوظة بالكامل
  // =========================================================
  const getImageUrl = (imgName) => {
    if (!imgName) return "";
    if (imgName.startsWith("http")) return imgName;
    return `/images/products/${product.folderName}/${imgName}`;
  };

  const gallery = product.images || [
    product.mainImage,
    ...Array.from({ length: product.imagesCount || 0 }, (_, i) => `${i + 1}.webp`),
  ];

  const handleNextImage = () => {
    const next = (gallery.indexOf(activeImage) + 1) % gallery.length;
    setActiveImage(gallery[next]);
    setActiveGalleryIndex(next);
  };

  const handlePrevImage = () => {
    const prev = (gallery.indexOf(activeImage) - 1 + gallery.length) % gallery.length;
    setActiveImage(gallery[prev]);
    setActiveGalleryIndex(prev);
  };

  // معالجة الألوان والمقاسات — محفوظة بالكامل
  let safeSizes  = [];
  let safeColors = [];

  if (product.options && Array.isArray(product.options)) {
    product.options.forEach((opt) => {
      const optName = (opt.name || "").toLowerCase();
      if (optName.includes("size") || optName === "المقاس" || optName === "مقاس")
        safeSizes = opt.values.split(",").map((s) => s.trim()).filter(Boolean);
      if (optName.includes("color") || optName === "اللون" || optName === "لون")
        safeColors = opt.values.split(",").map((c) => c.trim()).filter(Boolean);
    });
  }

  if (safeSizes.length === 0)
    safeSizes = Array.isArray(product.options?.sizes)
      ? product.options.sizes
      : Array.isArray(product.sizes) ? product.sizes : [];

  if (safeColors.length === 0)
    safeColors = Array.isArray(product.options?.colors) ? product.options.colors : [];

  const currentColorImage = () => {
    if (!selectedColor) return gallery[1] || activeImage;
    const hexOrImage = product.colorSwatches?.[selectedColor];
    if (hexOrImage && (hexOrImage.startsWith("http") || hexOrImage.includes("/")))
      return hexOrImage;
    return gallery[1] || activeImage;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    let clean = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "");
    const d   = new DOMParser().parseFromString(clean, "text/html");
    let text  = d.body.textContent || "";
    [/^\s*عن المنتج\s*[:\-\s]*/i, /^\s*الوصف\s*[:\-\s]*/i, /^\s*وصف المنتج\s*[:\-\s]*/i]
      .forEach((r) => { text = text.replace(r, ""); });
    return text.trim();
  };

  const shortDescription = stripHtml(product.description).substring(0, 120) + "...";
  const currentIndex     = gallery.indexOf(activeImage);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="product-page bg-[#0D0D0D] min-h-screen text-white pb-32 selection:bg-[#F5C518] selection:text-black">

      {/* =====================================================
          1. HERO — صورة سينمائية كاملة العرض
      ===================================================== */}
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-black group overflow-hidden">

        {/* الصورة الرئيسية */}
        <img
          src={getImageUrl(activeImage)}
          alt={product.title}
          className="w-full h-full object-cover object-top opacity-85 transition-all duration-700"
        />

        {/* Gradient سينمائي طبقتين */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

        {/* --- أيقونات التفاعل الطولية (يمين الصورة) --- */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-10">
          {/* عدد الصور */}
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/btn">
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/15 group-hover/btn:border-[#F5C518]/40 transition-colors">
              <ImageIcon size={18} />
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{ fontFamily: "Cairo, sans-serif" }}>
              {gallery.length} صور
            </span>
          </button>

          {/* Wishlist */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/btn"
          >
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/15 group-hover/btn:border-[#F5C518]/40 transition-colors">
              <Heart
                size={18}
                fill={isWishlisted ? "#F5C518" : "none"}
                color={isWishlisted ? "#F5C518" : "currentColor"}
              />
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{ fontFamily: "Cairo, sans-serif" }}>
              {product.likes || "1.2K"}
            </span>
          </button>

          {/* مشاركة */}
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-[#F5C518] transition-colors group/btn">
            <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/15 group-hover/btn:border-[#F5C518]/40 transition-colors">
              <Share2 size={18} />
            </div>
            <span className="text-[9px] font-bold tracking-wider drop-shadow-lg" style={{ fontFamily: "Cairo, sans-serif" }}>
              مشاركة
            </span>
          </button>
        </div>

        {/* --- سهم التقليب التالي (يسار) --- */}
        <button
          onClick={handleNextImage}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 p-2.5 rounded-full backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ChevronLeft size={32} strokeWidth={1.5} />
        </button>

        {/* --- سهم التقليب السابق (يمين اختياري) --- */}
        <button
          onClick={handlePrevImage}
          className="absolute right-20 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 p-2.5 rounded-full backdrop-blur-sm border border-white/10 hover:border-[#F5C518]/30 text-white/60 hover:text-[#F5C518] opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ChevronRight size={32} strokeWidth={1.5} />
        </button>

        {/* --- مؤشر رقم الصورة (أسفل الصورة) --- */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {gallery.slice(0, 6).map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveImage(gallery[i]); setActiveGalleryIndex(i); }}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === i
                  ? "w-5 h-1.5 bg-[#F5C518]"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* --- اسم المنتج فوق الـ gradient أسفل الصورة --- */}
        <div className="absolute bottom-0 right-0 left-0 px-5 pb-6 pt-20 pointer-events-none">
          <div className="max-w-4xl mx-auto" dir="rtl">
            <p className="text-[#F5C518] text-[10px] tracking-[0.25em] uppercase mb-1 opacity-80"
               style={{ fontFamily: "Tajawal, sans-serif" }}>
              {product.category || product.type || "WIND Originals"}
            </p>
            <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-tight pointer-events-auto"
                style={{ fontFamily: "Cairo, sans-serif" }}>
              {product.title}
            </h1>
          </div>
        </div>
      </div>

      {/* =====================================================
          2. BODY — كل المعلومات والخيارات
      ===================================================== */}
      <div className="px-4 pt-6 pb-2 max-w-4xl mx-auto" dir="rtl">

        {/* ---- Meta row: WIND Series + category + tag ---- */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5"
             style={{ fontFamily: "Tajawal, sans-serif" }}>
          <span className="text-[#F5C518] font-semibold">WIND Series</span>
          <span className="text-[#333]">•</span>
          <span>{product.category || product.type || "أزياء"}</span>
          <span className="text-[#333]">•</span>
          <span className="border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 rounded text-[10px] text-gray-500">
            WIND-24
          </span>
        </div>

        {/* ---- التقييم ---- */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < Math.round(product.rating || 5) ? "text-[#F5C518]" : "text-[#333]"}
                fill={i < Math.round(product.rating || 5) ? "#F5C518" : "#333"}
              />
            ))}
          </div>
          <span className="text-white font-black text-sm" style={{ fontFamily: "Cairo, sans-serif" }}>
            {product.rating || "4.9"}
          </span>
          <span className="text-gray-500 text-xs" style={{ fontFamily: "Tajawal, sans-serif" }}>
            ({product.reviewsCount || "490K"} تقييم)
          </span>
        </div>

        {/* ======================================================
            MAIN ROW: البوستر المصغر + السعر والبيانات
        ====================================================== */}
        <div className="flex gap-4 items-start mb-7">

          {/* --- البوستر المصغر المرتبط باللون --- */}
          <div className="w-28 h-40 flex-shrink-0 relative rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl group/poster">
            <img
              src={getImageUrl(currentColorImage())}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
              alt="poster"
            />
            {/* Plus icon */}
            <div className="absolute top-0 right-0 bg-black/70 p-1 rounded-bl-lg">
              <Plus size={13} className="text-white" />
            </div>
            {/* عدسة التكبير */}
            <button
              onClick={() => setImageZoomModalOpen(true)}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <div className="bg-black/70 p-2 rounded-full border border-[#F5C518]/40 text-white hover:text-[#F5C518] transition-colors">
                <Search size={18} />
              </div>
            </button>
          </div>

          {/* --- السعر والبيانات --- */}
          <div className="flex-1 flex flex-col justify-between min-h-[160px]">

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="border border-[#2a2a2a] rounded-full px-2.5 py-0.5 text-[10px] font-medium text-gray-500 bg-[#1a1a1a]"
                    style={{ fontFamily: "Tajawal, sans-serif" }}>
                Premium
              </span>
              <span className="border border-[#2a2a2a] rounded-full px-2.5 py-0.5 text-[10px] font-medium text-gray-500 bg-[#1a1a1a]"
                    style={{ fontFamily: "Tajawal, sans-serif" }}>
                Oversized
              </span>
            </div>

            {/* السعر */}
            <div className="flex items-end gap-2 mb-2">
              <span className="text-[40px] font-black text-white leading-none"
                    style={{ fontFamily: "Cairo, sans-serif", letterSpacing: "-1px" }}>
                {product.price}
              </span>
              <span className="text-sm font-semibold text-[#F5C518] mb-1.5"
                    style={{ fontFamily: "Tajawal, sans-serif" }}>
                ج.م
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-gray-600 line-through mb-1.5"
                      style={{ fontFamily: "Tajawal, sans-serif" }}>
                  {product.compareAtPrice} ج.م
                </span>
              )}
            </div>

            {/* حالة المخزون */}
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-semibold text-green-400"
                    style={{ fontFamily: "Tajawal, sans-serif" }}>
                {product?.quantity > 0 || product?.sellOutOfStock === "Yes"
                  ? "متوفر في المخزون"
                  : "غير متوفر"}
              </span>
            </div>

            {/* ملاحظة الشحن */}
            <p className="text-[10px] text-gray-600 mb-3" style={{ fontFamily: "Tajawal, sans-serif" }}>
              يتم احتساب مصاريف الشحن عند الدفع
            </p>

            {/* Trust badges */}
            <div className="flex items-center justify-between gap-1 bg-[#141414] border border-[#222] rounded-lg p-2.5">
              {[
                { icon: <Truck size={13} />, label: "شحن سريع" },
                { icon: <Eye size={13} />, label: "معاينة" },
                { icon: <ShieldCheck size={13} />, label: "دفع آمن" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400"
                     style={{ fontFamily: "Tajawal, sans-serif" }}>
                  <span className="text-[#F5C518]">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- الوصف المختصر ---- */}
        <div className="mb-7 border-r-2 border-[#F5C518]/20 pr-4 py-1">
          <span className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "Tajawal, sans-serif" }}>
            {shortDescription}
          </span>
          <button
            onClick={() => setDescModalOpen(true)}
            className="inline-flex items-center gap-1 text-[#F5C518] text-sm font-bold mr-1 hover:underline decoration-1 underline-offset-4 whitespace-nowrap"
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            المزيد
            <span className="w-3.5 h-3.5 rounded-full border border-[#F5C518] flex items-center justify-center text-[9px] font-black">!</span>
          </button>
        </div>

        {/* ======================================================
            خيارات اللون والمقاس
        ====================================================== */}
        <div className="space-y-7 border-t border-[#1e1e1e] pt-6">

          {/* --- الألوان --- */}
          {safeColors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest flex items-center gap-2"
                    style={{ fontFamily: "Cairo, sans-serif" }}>
                  اللون
                </h3>
                {selectedColor && (
                  <span className="text-[#F5C518] text-[11px] bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-0.5 rounded"
                        style={{ fontFamily: "Tajawal, sans-serif" }}>
                    {selectedColor}
                  </span>
                )}
              </div>

              <div className="relative w-full">
                <div
                  ref={colorsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory hide-scrollbar-horizontal pr-1"
                >
                  {safeColors.map((colorItem, idx) => {
                    const colorName    = typeof colorItem === "string" ? colorItem : colorItem.name;
                    const hexOrImage   = product.colorSwatches?.[colorName] || (typeof colorItem === "object" ? colorItem.swatch : "#333333");
                    const isImage      = hexOrImage.startsWith("http") || hexOrImage.includes("/");
                    const isSelected   = selectedColor === colorName;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(colorName);
                          if (isImage) setActiveImage(hexOrImage);
                        }}
                        className="flex flex-col items-center gap-2 group/c shrink-0 snap-start"
                      >
                        <div className={`w-13 h-13 rounded-full p-0.5 transition-all duration-300 ${
                          isSelected
                            ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D] scale-105"
                            : "ring-1 ring-white/10 hover:ring-white/30"
                        }`}>
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {isImage ? (
                              <img src={hexOrImage} className="w-full h-full object-cover" alt={colorName} />
                            ) : (
                              <div style={{ backgroundColor: hexOrImage }} className="w-full h-full border border-[#222]" />
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                          isSelected ? "text-[#F5C518]" : "text-gray-500 group-hover/c:text-gray-300"
                        }`} style={{ fontFamily: "Tajawal, sans-serif" }}>
                          {colorName}
                        </span>
                      </button>
                    );
                  })}
                  {safeColors.length > 4 && <div className="w-4 shrink-0" />}
                </div>

                {safeColors.length > 4 && (
                  <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-[#0D0D0D] to-transparent flex items-center justify-start pointer-events-none">
                    <ChevronLeft size={14} className="text-gray-600 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- المقاسات --- */}
          {safeSizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest"
                      style={{ fontFamily: "Cairo, sans-serif" }}>
                    المقاس
                  </h3>
                  {selectedSize && (
                    <span className="text-[#F5C518] text-[11px] bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-0.5 rounded"
                          style={{ fontFamily: "Tajawal, sans-serif" }}>
                      {selectedSize}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-[#F5C518] flex items-center gap-1.5 hover:bg-[#F5C518]/8 transition-all px-3 py-1.5 rounded-full border border-[#F5C518]/25 hover:border-[#F5C518]/50"
                  style={{ fontFamily: "Cairo, sans-serif" }}
                >
                  <Info size={13} /> دليل القياسات
                </button>
              </div>

              {safeSizes.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {safeSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[58px] h-11 flex items-center justify-center
                                  text-sm font-black rounded-md border
                                  transition-all duration-200
                                  ${selectedSize === size
                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105"
                                    : "bg-[#141414] text-gray-400 border-[#2a2a2a] hover:border-[#F5C518]/30 hover:text-gray-200"
                                  }`}
                      style={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- الخامات والـ Fit ---- */}
        <div className="mt-7 border-t border-[#1e1e1e] pt-5 space-y-3">
          <div className="text-sm" style={{ fontFamily: "Tajawal, sans-serif" }}>
            <span className="text-gray-500">الخامة الأساسية: </span>
            <span className="text-gray-200">{product.metafields?.fabric || "قطن 100% معالج ضد الانكماش"}</span>
          </div>
          <div className="text-sm" style={{ fontFamily: "Tajawal, sans-serif" }}>
            <span className="text-gray-500">القصّة (Fit): </span>
            <span className="text-gray-200">{product.metafields?.fit || "مريح (Relaxed Fit) - مناسب للجنسين"}</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          3. معرض الصور الكامل
      ===================================================== */}
      <div className="mt-4 border-t border-[#1e1e1e] pt-6">
        <div className="px-4 max-w-4xl mx-auto mb-4 flex items-center gap-3" dir="rtl">
          <div className="w-[3px] h-5 bg-[#F5C518] rounded-sm" />
          <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest"
              style={{ fontFamily: "Cairo, sans-serif" }}>
            معرض الصور
          </h3>
          <span className="text-gray-600 text-xs" style={{ fontFamily: "Tajawal, sans-serif" }}>
            {gallery.length} لقطة
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto px-4 pb-4 scrollbar-hide" dir="rtl">
          {gallery.filter((img) => img).map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveImage(img); setActiveGalleryIndex(idx); }}
              className={`flex-shrink-0 relative w-28 h-40 overflow-hidden transition-all duration-300 rounded-lg ${
                activeImage === img
                  ? "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0D0D0D] scale-105"
                  : "ring-1 ring-white/5 opacity-50 hover:opacity-90 hover:ring-white/20"
              }`}
            >
              <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
              {/* رقم الصورة */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-300"
                   style={{ fontFamily: "Cairo, sans-serif" }}>
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          4. زر الإضافة للسلة (ثابت أسفل الشاشة)
      ===================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/98 to-transparent pt-8 pb-5 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3" dir="rtl">
          <button
            onClick={() =>
              addToCart({
                ...product,
                selectedSize,
                selectedColor,
                image: getImageUrl(activeImage),
              })
            }
            className="flex-1 bg-[#F5C518] hover:bg-[#ffd23f] active:scale-[0.98] text-black font-black text-base py-4 rounded shadow-[0_0_30px_rgba(245,197,24,0.25)] transition-all duration-200 flex justify-center items-center gap-2 group"
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            <Plus size={20} className="transition-transform group-hover:scale-125" />
            أضف إلى حقيبتك — {product.price} ج.م
          </button>

          {/* Dropdown */}
          <button
            className="bg-[#1a1a1a] hover:bg-[#222] active:scale-95 p-4 rounded border border-[#2a2a2a] hover:border-[#F5C518]/20 text-white transition-all"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* =====================================================
          MODAL: تكبير صورة اللون
      ===================================================== */}
      {isImageZoomModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setImageZoomModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(currentColorImage())}
              className="w-full h-full object-cover"
              alt="Zoomed"
            />
            <button
              onClick={() => setImageZoomModalOpen(false)}
              className="absolute top-3 left-3 bg-black/60 hover:bg-black/90 p-2 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm border border-white/15"
            >
              <X size={20} />
            </button>
            {selectedColor && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#F5C518]/25">
                <span className="text-[#F5C518] font-semibold text-sm"
                      style={{ fontFamily: "Tajawal, sans-serif" }}>
                  {selectedColor}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: وصف المنتج الكامل
      ===================================================== */}
      {isDescModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111] w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-[#1e1e1e] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-[slideUp_0.35s_cubic-bezier(0.25,1,0.5,1)]">

            {/* رأس المودال */}
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex justify-between items-center bg-[#141414] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-6 bg-[#F5C518] rounded-sm" />
                <h3 className="font-black text-white text-base"
                    style={{ fontFamily: "Cairo, sans-serif" }}>
                  معلومات المنتج
                </h3>
              </div>
              <button
                onClick={() => setDescModalOpen(false)}
                className="bg-[#1e1e1e] hover:bg-[#2a2a2a] p-1.5 rounded-full text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* المحتوى */}
            <div className="p-5 overflow-y-auto ql-editor-display dark-wind-tabs" dir="rtl">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        product={product}
      />

      {/* =====================================================
          GLOBAL STYLES
      ===================================================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@300;400;500;700&display=swap');

        .product-page { font-family: 'Tajawal', sans-serif; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* scrollbars */
        .hide-scrollbar-horizontal::-webkit-scrollbar { height: 0; background: transparent; }
        .hide-scrollbar-horizontal { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* dark modal styles — محفوظة بالكامل */
        .dark-wind-tabs .wind-tabs-container { background: transparent !important; }
        .dark-wind-tabs .wind-tabs-container details {
          background: #1a1a1a !important;
          border-bottom: 1px solid #222 !important;
          border-radius: 8px;
          margin-bottom: 8px;
          padding: 0 15px !important;
          transition: all 0.3s ease;
        }
        .dark-wind-tabs .wind-tabs-container details[open] { border-color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container summary { color: #fff !important; border: none !important; }
        .dark-wind-tabs .wind-tabs-container summary svg path { stroke: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container div { color: #a1a1aa !important; }
        .dark-wind-tabs .wind-tabs-container span[style*="color: #800020"] { color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container div[style*="border-bottom: 1px solid #f3f4f6"] { border-bottom: 1px solid #222 !important; }
        .dark-wind-tabs .wind-tabs-container div[style*="color: #111827"],
        .dark-wind-tabs .wind-tabs-container strong[style*="color: #111827"] { color: #e5e7eb !important; }
        .dark-wind-tabs .wind-tabs-container button,
        .dark-wind-tabs .wind-tabs-container .read-more-wrapper summary { color: #F5C518 !important; }
        .dark-wind-tabs .wind-tabs-container summary:hover { background-color: transparent !important; }

        /* quill editor */
        .ql-editor-display ul  { list-style-type: disc !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display ol  { list-style-type: decimal !important; padding-right: 20px !important; margin-bottom: 10px; }
        .ql-editor-display strong { font-weight: 900; color: #fff; }
      `}</style>
    </div>
  );
}