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
      {/* ستايل الأنيميشن للشريط المتحرك */}
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
        /* توقف الحركة عند وقوف الماوس عليها للقراءة */
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. الشريط العلوي المتحرك (Top Bar) */}
      <div className="bg-[#F5C518] text-black text-xs md:text-sm font-black py-2 overflow-hidden relative z-[101] marquee-container border-b-2 border-black">
        <div className="animate-marquee w-full text-center tracking-widest">
          <span className="mx-8">🚚 توصيل سريع لجميع محافظات مصر</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔥 خصم حصري 10% على طلبك الأول: استخدم كود <span className="bg-black text-[#F5C518] px-1">WIND10</span></span>
          <span className="mx-8">•</span>
          <span className="mx-8">✨ تشكيلة الشتاء الجديدة متاحة الآن</span>
        </div>
      </div>

      {/* 2. النافبار الرئيسية */}
      <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100] h-20 w-full shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between relative">
          
          {/* زر القائمة الجانبية (يمين الشاشة بالعربي) */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="text-white p-2 hover:bg-[#222] rounded-full transition-colors z-20"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* اللوجو - تكبير وتوسط هندسي دقيق */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Link href="/" className="block">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-14 md:h-16 w-auto object-contain hover:opacity-90 transition-opacity drop-shadow-lg" 
              />
            </Link>
          </div>

          {/* أيقونات البحث والسلة (يسار الشاشة بالعربي) */}
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
                <span className="absolute top-1 right-0 bg-[#F5C518] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#121212]">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* المنيو الجانبية (Mobile Menu) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[150] flex" dir="rtl">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
            
            <div className="relative bg-[#1a1a1a] w-[85%] max-w-[320px] h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col border-l border-[#333] animate-[slideInRight_0.3s_ease-out]">
              
              {/* ترويسة القائمة */}
              <div className="p-6 bg-[#222] border-b border-[#333] flex justify-between items-center">
                <h3 className="text-[#F5C518] font-black text-xl tracking-wider">القائمة</h3>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* روابط القائمة */}
              <div className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-2 px-4">
                  {categories.map((cat, i) => (
                    <li key={i}>
                      <Link 
                        href={cat.link} 
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between p-4 rounded-sm transition-all duration-200 
                          ${cat.highlight 
                            ? 'bg-[#F5C518] text-black font-black hover:bg-[#ffdb4d]' 
                            : 'text-gray-200 hover:bg-[#252525] hover:text-[#F5C518] font-bold border-b border-[#333]'
                          }`}
                      >
                        {cat.name}
                        {!cat.highlight && <span className="text-xl">›</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* تذييل القائمة */}
              <div className="p-6 border-t border-[#333] bg-[#222]">
                 <p className="text-gray-500 text-xs text-center">© 2026 WIND Collection</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}