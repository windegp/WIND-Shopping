"use client";
import Link from "next/link";
// استيراد السلة
import { useCart } from "../../context/CartContext";

export default function ProductCard({ id, title, price, oldPrice, rating, category, folderName, mainImage }) {
  
  const { addToCart } = useCart() || {};
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  // دالة الإضافة للسلة
  const handleAddToCart = (e) => {
    e.preventDefault(); // منع الانتقال لصفحة المنتج عند الضغط على الزر
    if (addToCart) {
      addToCart({
        id,
        title,
        price,
        image: `/images/products/${folderName}/${mainImage}`,
        quantity: 1
      });
      // يمكنك هنا إضافة Notification بسيط إذا أردت
    }
  };

  return (
    <div className="block group h-full relative">
      <div className="bg-[#1A1A1A] rounded-[4px] overflow-hidden flex flex-col h-full shadow-md hover:shadow-[#F5C518]/10 transition-shadow border border-[#333]">
        
        {/* رابط صفحة المنتج يغلف الصورة والعنوان فقط */}
        <Link href={`/product/${id}`} className="cursor-pointer">
          {/* منطقة الصورة */}
          <div className="relative aspect-[2/3] bg-[#222]">
            {discount && (
              <div className="absolute top-0 left-0 bg-[#F5C518] text-black text-[10px] font-black px-2 py-0.5 z-10">
                %{discount}
              </div>
            )}
            <img 
              src={`/images/products/${folderName}/${mainImage}`} 
              alt={title}
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
            <span className="text-gray-500 text-[9px] truncate">{category}</span>
          </div>

          <Link href={`/product/${id}`}>
            <h3 className="text-white text-[13px] font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.2em] hover:text-[#5799ef] transition-colors">
              {title}
            </h3>
          </Link>

          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white font-bold text-sm">{price} <span className="text-[9px] font-normal text-gray-400">EGP</span></span>
              {oldPrice && (
                <span className="text-gray-600 text-[10px] line-through">{oldPrice}</span>
              )}
            </div>

            {/* زر "أضف إلى السلة" الجديد بستايل WIND */}
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