"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems, toggleCart } = useCart();

  const categories = [
    { name: "الرئيسية", link: "/" },
    { name: "وصل حديثاً", link: "/new-arrivals" },
    { name: "الأكثر مبيعاً", link: "/best-sellers" },
    { name: "تخفيضات", link: "/sale", highlight: true },
  ];

  return (
    // ارتفاع 56px فقط (h-14) مثل تطبيقات الموبايل القياسية
    <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100] h-14">
      <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
        
        {/* زر القائمة - صغير وبسيط */}
        <button onClick={() => setIsMenuOpen(true)} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* اللوجو - حجم مضغوط */}
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-[#F5C518] text-black font-black px-2 py-0.5 rounded-[4px] text-sm tracking-tighter">
            WIND
          </div>
        </Link>

        {/* أيقونة السلة والبحث */}
        <div className="flex items-center gap-3">
          <button className="text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button onClick={toggleCart} className="relative p-1">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F5C518] text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* القائمة الجانبية (تم تصغير الخطوط فيها أيضاً) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] flex" dir="rtl">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative bg-[#1a1a1a] w-3/4 max-w-[300px] h-full shadow-2xl flex flex-col">
            <div className="p-4 bg-[#222] flex justify-between items-center">
              <span className="text-[#F5C518] font-bold text-lg">القائمة</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-white">✕</button>
            </div>
            <ul className="p-4 space-y-1">
              {categories.map((cat, i) => (
                <li key={i}>
                  <Link 
                    href={cat.link} 
                    onClick={() => setIsMenuOpen(false)}
                    className={`block py-3 px-2 text-sm font-medium border-b border-[#333] ${cat.highlight ? 'text-[#F5C518]' : 'text-gray-200'}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}