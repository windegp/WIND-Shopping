"use client";
import { useState } from 'react';
import Link from 'next/link';
// تم تعديل المسار ليخرج خطوتين للوصول لمجلد context
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // استخراج المنتجات ودالة فتح السلة (toggleCart)
  const { cartItems, toggleCart } = useCart();

  const categories = [
    { name: "الرئيسية", link: "/" },
    { name: "وصل حديثاً", link: "/new-arrivals" },
    { name: "الأكثر مبيعاً", link: "/best-sellers" },
    { 
      name: "نسائي", 
      link: "/women",
      sub: ["بلوفرات", "كارديجان", "جاكيتات", "بنطلونات", "إسدال صلاة"] 
    },
    { name: "رجالي", link: "/men" },
    { name: "شالات وأوشحة", link: "/scarves" },
    { name: "تخفيضات %", link: "/sale", highlight: true },
  ];

  return (
    <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100]">
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* الجزء الأيمن: القائمة واللوجو */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-[#1f1f1f] rounded text-white transition lg:hidden outline-none"
            aria-label="قائمة التنقل"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link href="/" className="flex items-center group">
            <div className="border border-[#F5C518]/30 group-hover:border-[#F5C518] transition-all duration-300 p-1 rounded-md bg-[#1a1a1a] shadow-lg flex items-center justify-center">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-6 md:h-8 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-5 mr-4 text-[13px] font-bold text-white">
            {categories.map((cat, i) => (
              <div key={i} className="relative group">
                <Link href={cat.link} className={`hover:text-[#F5C518] cursor-pointer transition flex items-center gap-1 ${cat.highlight ? 'text-[#F5C518]' : ''}`}>
                  {cat.name}
                  {cat.sub && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>}
                </Link>
                
                {cat.sub && (
                  <div className="absolute top-full right-0 bg-[#1f1f1f] border border-[#333] w-48 py-2 mt-2 hidden group-hover:block shadow-2xl text-right animate-in fade-in slide-in-from-top-1">
                    {cat.sub.map((subItem, j) => (
                      <Link key={j} href={`${cat.link}/${subItem}`} className="block px-4 py-2 hover:bg-[#252525] hover:text-[#F5C518] text-xs transition-colors">
                        {subItem}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* الجزء الأوسط: محرك البحث */}
        <div className="hidden sm:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="ابحث عن أناقتك..." 
              className="w-full bg-white text-black px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#F5C518] text-sm text-right font-bold transition-all"
              dir="rtl"
            />
            <button className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* الجزء الأيسر: أيقونة السلة */}
        <div className="flex items-center gap-5">
          <button 
            onClick={toggleCart} 
            className="flex items-center gap-1 cursor-pointer hover:text-[#F5C518] transition font-bold text-sm text-white relative group outline-none"
          >
            <svg className="w-7 h-7 transition-transform group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden md:inline">السلة</span>
            
            {cartItems.length > 0 ? (
              <span className="absolute -top-1 -right-2 bg-[#F5C518] text-black text-[10px] font-black px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-bounce">
                {cartItems.length}
              </span>
            ) : (
              <span className="bg-[#333] text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
                0
              </span>
            )}
          </button>
        </div>
      </div>

      {/* القائمة الجانبية للموبايل */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative bg-[#121212] w-80 h-full p-6 shadow-2xl border-l border-[#333] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <div className="border border-[#F5C518]/30 p-1 rounded bg-[#1a1a1a]">
                  <img src="/logo.jpg" alt="WIND" className="h-8 w-auto object-contain" />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-[#F5C518] p-2 hover:rotate-90 transition-all outline-none">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <ul className="space-y-4 text-right">
                {categories.map((cat, i) => (
                  <li key={i} className="border-b border-[#222] pb-3">
                    <Link 
                      href={cat.link} 
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-lg font-black block hover:text-[#F5C518] transition ${cat.highlight ? 'text-[#F5C518]' : 'text-white'}`}
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