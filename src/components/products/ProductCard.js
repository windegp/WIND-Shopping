"use client";
import Link from "next/link";

export default function ProductCard({ id, title, price, oldPrice, rating, category, folderName, mainImage }) {
  
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    <Link href={`/product/${id}`} className="block group h-full">
      {/* كارت بستايل IMDb: خلفية رمادية داكنة، حواف دائرية بسيطة */}
      <div className="bg-[#1A1A1A] rounded-[4px] overflow-hidden flex flex-col h-full shadow-md hover:shadow-[#F5C518]/10 transition-shadow border border-[#333]">
        
        {/* منطقة الصورة - نسبة 2:3 مثل بوسترات الأفلام */}
        <div className="relative aspect-[2/3] bg-[#222]">
          {discount && (
            <div className="absolute top-0 left-0 bg-[#F5C518] text-black text-[10px] font-bold px-2 py-0.5 z-10">
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

        {/* تفاصيل الكارت - مضغوطة جداً */}
        <div className="p-3 flex flex-col flex-grow">
          
          {/* التقييم + الفئة */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[#F5C518] text-[10px]">★</span>
            <span className="text-gray-400 text-[10px]">{rating || "4.8"}</span>
            <span className="text-gray-600 text-[10px] px-1">•</span>
            <span className="text-gray-500 text-[9px] truncate">{category}</span>
          </div>

          {/* العنوان - خط صغير وكثيف */}
          <h3 className="text-white text-[13px] font-semibold leading-tight mb-2 line-clamp-2 min-h-[2.2em]">
            {title}
          </h3>

          {/* السعر والزر في الأسفل */}
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-white font-bold text-sm">{price} <span className="text-[9px] font-normal text-gray-400">EGP</span></span>
              {oldPrice && (
                <span className="text-gray-600 text-[10px] line-through">{oldPrice}</span>
              )}
            </div>

            {/* زر يحاكي زر "Watchlist" أو "Trailer" */}
            <button className="w-full bg-[#2C2C2C] hover:bg-[#333] text-[#5799ef] hover:text-white text-[11px] font-bold py-1.5 rounded-[4px] border-none transition-colors">
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}