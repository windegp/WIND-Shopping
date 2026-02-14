"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { products } from "../../../lib/products";
import Link from "next/link";
// 1. استدعاء الـ Hook الخاص بالسلة
import { useCart } from "../../../context/CartContext";

export default function ProductPage() {
  const { id } = useParams();
  const product = products.find((p) => p.id === parseInt(id));

  // 2. استخدام دالة الإضافة للسلة
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (product) {
      setActiveImage(`/images/products/${product.folderName}/${product.mainImage}`);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white text-right" dir="rtl">
        <h1 className="text-2xl font-black mb-4">عذراً، هذا المنتج غير متوفر حالياً</h1>
        <Link href="/" className="text-[#F5C518] underline font-bold">العودة للمتجر</Link>
      </div>
    );
  }

  const extraImages = Array.from({ length: product.imagesCount || 0 }, (_, i) => `${i + 1}.webp`);

  // دالة التعامل مع إضافة المنتج
  const handleAddToCart = () => {
    addToCart({
      ...product,
      selectedSize // إرسال المقاس المختار مع بيانات المنتج
    });
    // يمكنك إضافة تنبيه بسيط هنا أو فتح السلة تلقائياً
    alert("تمت إضافة القطعة إلى حقيبتك بنجاح!");
  };

  return (
    <div className="min-h-screen bg-[#121212] py-8 md:py-16 text-right" dir="rtl">
      <div className="max-w-[1280px] mx-auto px-4">
        
        <Link href="/" className="text-gray-500 hover:text-[#F5C518] transition mb-6 inline-block font-bold">
          ← العودة للرئيسية
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">{product.title}</h1>
          <div className="flex items-center justify-start gap-4 text-gray-400 text-sm font-bold">
             <span className="bg-[#333] text-[10px] px-2 py-0.5 rounded text-white tracking-widest uppercase">
              {product.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="text-[#F5C518]">★</span> {product.rating || "4.9"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* الجانب الأيمن: معرض الصور */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-lg overflow-hidden border border-[#333] shadow-2xl bg-[#1a1a1a] aspect-[2/3]">
                {activeImage ? (
                  <img 
                    src={activeImage} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">جاري التحميل...</div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div 
                  onClick={() => setActiveImage(`/images/products/${product.folderName}/${product.mainImage}`)}
                  className={`aspect-square rounded border-2 cursor-pointer transition-all overflow-hidden ${activeImage.includes(product.mainImage) ? 'border-[#F5C518]' : 'border-transparent opacity-50'}`}
                >
                  <img src={`/images/products/${product.folderName}/${product.mainImage}`} className="w-full h-full object-cover" alt="thumbnail" />
                </div>

                {extraImages.map((imgName, index) => {
                  const fullPath = `/images/products/${product.folderName}/${imgName}`;
                  return (
                    <div 
                      key={index}
                      onClick={() => setActiveImage(fullPath)}
                      className={`aspect-square rounded border-2 cursor-pointer transition-all overflow-hidden ${activeImage === fullPath ? 'border-[#F5C518]' : 'border-transparent opacity-50'}`}
                    >
                      <img src={fullPath} className="w-full h-full object-cover" alt={`extra-${index}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* الجانب الأيسر: التفاصيل والطلب */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1f1f1f] p-6 rounded-lg border border-[#333]">
              <h3 className="text-[#F5C518] font-black mb-4 flex items-center gap-2 text-xl">
                <span className="w-1.5 h-6 bg-[#F5C518]"></span> القصة والخامات
              </h3>
              <p className="text-gray-200 leading-relaxed text-lg font-medium">
                {product.description}
              </p>
            </div>

            {product.sizes && (
              <div>
                <h3 className="text-white font-black mb-4 text-lg">اختر المقاس:</h3>
                <div className="flex gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-md border-2 font-black transition-all duration-300 ${selectedSize === size ? 'bg-[#F5C518] border-[#F5C518] text-black shadow-[0_0_15px_rgba(245,197,24,0.4)]' : 'border-[#333] text-white hover:border-[#F5C518]/50'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#1f1f1f] p-8 rounded-xl border-2 border-[#F5C518]/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="text-center md:text-right">
                <span className="text-gray-400 block mb-1 font-bold">السعر النهائي</span>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black text-[#F5C518] tracking-tighter">
                    {product.price} <small className="text-lg font-bold">EGP</small>
                  </span>
                  {product.oldPrice && (
                    <span className="text-gray-500 line-through text-xl font-bold">{product.oldPrice} EGP</span>
                  )}
                </div>
              </div>
              
              {/* تفعيل زر الإضافة للسلة */}
              <button 
                onClick={handleAddToCart}
                className="w-full md:w-auto bg-[#F5C518] hover:bg-white text-black font-black px-14 py-5 rounded-lg text-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(245,197,24,0.2)]"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                أضف إلى حقيبة التسوق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}