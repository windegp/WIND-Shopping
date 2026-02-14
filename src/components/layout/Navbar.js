"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems = [], toggleCart } = useCart() || {};

  const categories = [
    { name: "الرئيسية", link: "/" },
    { name: "وصل حديثاً", link: "/new-arrivals" },
    { name: "الأكثر مبيعاً", link: "/best-sellers" },
    { name: "تخفيضات", link: "/sale", highlight: true },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          white-space: nowrap;
          display: inline-block;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* 1. الشريط العلوي المتحرك */}
      <div className="bg-[#F5C518] text-black text-xs md:text-sm font-black py-2 overflow-hidden relative z-[50] marquee-container border-b border-black">
        <div className="animate-marquee w-full text-center tracking-widest">
          <span className="mx-8">🚚 توصيل سريع لجميع محافظات مصر</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔥 خصم حصري 10% على طلبك الأول: استخدم كود <span className="bg-black text-[#F5C518] px-1">WIND10</span></span>
          <span className="mx-8">•</span>
          <span className="mx-8">✨ تشكيلة الشتاء الجديدة متاحة الآن</span>
        </div>
      </div>

      {/* 2. النافبار الرئيسية - تم ضبط الارتفاع ليكون متوازناً (h-20) */}
      <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100] h-20 w-full shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between relative">
          
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="text-white p-2 hover:bg-[#222] rounded-full transition-colors z-20"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* اللوجو - تم تصغيره ليناسب "البار" تماماً ويكون مريحاً للعين */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Link href="/" className="block">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" 
              />
            </Link>
          </div>

          <div className="flex items-center gap-4 z-20">
            <button className="text-white p-2 hover:text-[#F5C518] transition-colors hidden md:block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            <button onClick={toggleCart} className="relative p-2 group">
              <svg className="w-7 h-7 text-white group-hover:text-[#F5C518] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItems?.length > 0 && (
                <span className="absolute top-1 right-0 bg-[#F5C518] text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* المنيو الجانبية (Mobile Menu) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[200] flex" dir="rtl">
            {/* الخلفية المظلمة - جعلتها أقل قتامة قليلاً لراحة العين */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
            
            <div className="relative bg-[#1a1a1a] w-[80%] max-w-[300px] h-full shadow-2xl flex flex-col border-l border-[#333] animate-[slideInRight_0.3s_ease-out]">
              
              {/* ترويسة القائمة - تم ضبط المسافات لتبدأ من تحت شريط المتصفح مباشرة */}
              <div className="p-6 pt-10 bg-[#222] border-b border-[#333] flex justify-between items-center">
                <h3 className="text-[#F5C518] font-black text-xl tracking-tighter">القائمة</h3>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-4">
                  {categories.map((cat, i) => (
                    <li key={i}>
                      <Link 
                        href={cat.link} 
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between p-4 rounded-sm transition-all duration-200 
                          ${cat.highlight 
                            ? 'bg-[#F5C518] text-black font-black' 
                            : 'text-gray-200 hover:bg-[#252525] hover:text-[#F5C518] font-bold border-b border-[#333]/30'
                          }`}
                      >
                        <span className="text-base">{cat.name}</span>
                        {!cat.highlight && <span className="text-gray-600">›</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 border-t border-[#333] bg-[#222]">
                 <p className="text-gray-500 text-[10px] text-center uppercase tracking-widest font-bold">WIND © 2026</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}