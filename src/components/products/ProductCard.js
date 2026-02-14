"use client";
import Link from "next/link"; // الخطوة 1: استدعاء المكون المسؤول عن الروابط

// أضفنا id هنا عشان نستخدمه في رابط الصفحة
export default function ProductCard({ id, title, price, oldPrice, rating, category, folderName, mainImage }) {
  
  const imagePath = `/images/products/${folderName}/${mainImage}`;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    // الخطوة 2: تغليف الكارت بالكامل بـ Link
    // المسار هيروح لـ /product/[id]
    <Link href={`/product/${id}`} className="group block">
      <div className="bg-[#1a1a1a] rounded-sm border border-[#333] overflow-hidden hover:border-[#F5C518]/50 transition-all duration-500 shadow-2xl">
        
        {/* منطقة الصورة */}
        <div className="relative aspect-[2/3] overflow-hidden bg-[#222]">
          
          {discount && (
            <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm shadow-lg animate-pulse">
              خصم {discount}%
            </div>
          )}

          {!discount && category && (
            <div className="absolute top-2 right-2 z-10 bg-[#F5C518] text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">
              {category}
            </div>
          )}

          <button className="absolute top-2 left-2 z-10 text-white/50 hover:text-[#F5C518] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
          </button>

          <img 
            src={imagePath} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* تفاصيل المنتج */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1">
            <span className="text-[#F5C518] text-xs">★</span>
            <span className="text-gray-400 text-[10px] font-bold mt-0.5">{rating || "4.8"}</span>
          </div>

          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#F5C518] transition-colors">
            {title}
          </h3>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[#F5C518] font-black text-lg tracking-tighter">
              {price} <small className="text-[10px] mr-0.5">EGP</small>
            </span>
            
            {oldPrice && (
              <span className="text-gray-500 text-xs line-through decoration-[#F5C518]/40">
                {oldPrice} <small className="text-[10px]">EGP</small>
              </span>
            )}
          </div>

          {/* زر العرض (تم تغيير النص ليكون أكثر منطقية مع الرابط) */}
          <div className="w-full mt-4 bg-[#252525] group-hover:bg-[#F5C518] text-white group-hover:text-black font-black py-2.5 rounded-sm text-[10px] text-center uppercase tracking-widest transition-all duration-300 shadow-lg">
            أضف إلى السلة +
          </div>
        </div>
      </div>
    </Link>
  );
}