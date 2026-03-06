"use client";
import Link from "next/link";
import Image from "next/image";
// استيراد السلة
import { useCart } from "../../context/CartContext";

export default function ProductCard({ id, handle, title, price, oldPrice, compareAtPrice, rating, category, productCategory, type, folderName, mainImage, image, images, variants }) {
  
  const { addToCart } = useCart() || {};

  // --- دعم الطريقة الجديدة (Shopify) والطريقة القديمة ---
  // 1. تحديد السعر (من الـ variants أولاً، ثم المباشر)
  const displayPrice = variants && variants.length > 0 && variants[0].price ? variants[0].price : price;
  const displayOldPrice = variants && variants.length > 0 && variants[0].compareAtPrice ? variants[0].compareAtPrice : (compareAtPrice || oldPrice);
  
  // 2. حساب الخصم
  const discount = displayOldPrice && displayOldPrice > displayPrice 
    ? Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100) 
    : null;

  // 3. تحديد الصورة (من مصفوفة صور الطريقة الجديدة أولاً)
  const productImage = (images && images.length > 0) ? images[0] : (image || `/images/products/${folderName}/${mainImage}`);

  // 4. تحديد القسم المعروض
  const displayCategory = type || productCategory || category || "";

  // 5. رابط المنتج (استخدام الـ handle للـ SEO إذا وجد، وإلا الـ id)
  const productLink = handle ? `/product/${handle}` : `/product/${id}`;

  // دالة الإضافة للسلة
  const handleAddToCart = (e) => {
    e.preventDefault(); // منع الانتقال لصفحة المنتج عند الضغط على الزر
    if (addToCart) {
      addToCart({
        id: handle || id, // نستخدم الـ handle كـ id لتسهيل الربط
        title,
        price: displayPrice,
        image: productImage,
        quantity: 1
      });
    }
  };

  return (
    <div className="block group h-full relative">
      <div className="bg-[#1A1A1A] rounded-[4px] overflow-hidden flex flex-col h-full shadow-md hover:shadow-[#F5C518]/10 transition-shadow border border-[#333]">
        
        {/* رابط صفحة المنتج يغلف الصورة والعنوان فقط */}
        <Link href={productLink} className="cursor-pointer">
          {/* منطقة الصورة */}
          <div className="relative aspect-[2/3] bg-[#222]">
            {discount && (
              <div className="absolute top-0 left-0 bg-[#F5C518] text-black text-[10px] font-black px-2 py-0.5 z-10">
                %{discount}
              </div>
            )}
            <Image 
              src={productImage} 
              alt={title}
              width={300}
              height={450}
              quality={75}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              loading="lazy"
            />
          </div>
        </Link>

        {/* تفاصيل الكارت */}
        <div className="p-3 flex flex-col flex-grow">
          
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[#F5C518] text-[10px]">★</span>
            <span className="text-gray-400 text-[10px]">{rating || "4.8"}</span>
            <span className="text-gray-600 text-[10px] px-1">•</span>
            <span className="text-gray-500 text-[9px] truncate">{displayCategory}</span>
          </div>

          <Link href={productLink}>
            <h3 className="text-white text-[13px] font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.2em] hover:text-[#5799ef] transition-colors">
              {title}
            </h3>
          </Link>

          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white font-bold text-sm">{displayPrice} <span className="text-[9px] font-normal text-gray-400">EGP</span></span>
              {displayOldPrice && (
                <span className="text-gray-600 text-[10px] line-through">{displayOldPrice}</span>
              )}
            </div>

            {/* زر "أضف إلى السلة" بستايل WIND كما هو */}
            <button 
              onClick={handleAddToCart}
              className="w-full bg-[#2C2C2C] hover:bg-[#F5C518] text-[#5799ef] hover:text-black text-[11px] font-black py-2 rounded-[4px] border-none transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              أضف إلى السلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}