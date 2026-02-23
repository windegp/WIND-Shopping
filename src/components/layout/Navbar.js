"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext"; 
import { db } from "../../lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const { cartItems = [], toggleCart } = useCart() || {};
  
  // الحالة الابتدائية للمنيو (تبدأ بقسم الرئيسية كأمان)
  const [categories, setCategories] = useState([
    { name: "الرئيسية", link: "/", children: [] },
  ]);

  const toggleSubMenu = (index) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // --- ركن التعليم: الـ useEffect هو "المراقب" اللي بيجيب الداتا ---
  useEffect(() => {
    // onSnapshot بتعمل اتصال حي (Live) مع الفايربيس
    const unsubSettings = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      
      if (docSnap.exists() && docSnap.data().menuItems) {
        
        // هنا بنعمل "فلترة" لكل عنصر جاي من قاعدة البيانات لضمان عدم حدوث Error 130
        const menuItemsFromSettings = docSnap.data().menuItems.map(item => {
          
          // 🛡️ فحص الأمان 1: التأكد أن العنوان نص (String)
          const safeTitle = typeof item.title === 'string' ? item.title : "قسم";
          
          // 🛡️ فحص الأمان 2: التأكد أن الرابط نص (String)
          const safeLink = typeof item.link === 'string' ? item.link : "/";
          
          let finalLink = safeLink;

          // منطق الربط: لو الرابط مش بيبدأ بسلاش (/) ومش رابط خارجي، ضيف له /collections/
          if (!finalLink.startsWith('/') && !finalLink.startsWith('http')) {
            finalLink = `/collections/${finalLink}`; 
          }

          return {
            name: safeTitle,
            title: safeTitle,
            link: finalLink,
            highlight: !!item.highlight, // علامة الـ !! تضمن تحويل القيمة لـ true أو false
            // 🛡️ فحص الأمان 3: التأكد أن الأبناء (Children) مصفوفة سليمة
            children: Array.isArray(item.children) ? item.children.map(child => ({
              ...child,
              title: typeof child.title === 'string' ? child.title : "فرعي",
              link: typeof child.link === 'string' ? child.link : "/"
            })) : []
          };
        });
        
        setCategories(menuItemsFromSettings);
      }
    });

    return () => unsubSettings(); // تنظيف الاتصال عند مغادرة الصفحة
  }, []);

  return (
    <>
      {/* ركن التصميم (CSS) */}
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; white-space: nowrap; display: inline-block; will-change: transform; }
        .marquee-container:hover .animate-marquee { animation-play-state: paused; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        body { overflow-x: hidden; }
      `}</style>

      {/* 1. الشريط العلوي (Marquee) */}
      <div className="bg-[#F5C518] text-black text-xs md:text-sm font-black py-2 overflow-hidden relative z-[50] marquee-container border-b border-black w-full">
        <div className="animate-marquee w-full text-center tracking-widest uppercase">
          <span className="mx-8">🚚 توصيل سريع لجميع محافظات مصر</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔥 خصم 10% بكود: <span className="bg-black text-[#F5C518] px-1 italic">WIND10</span></span>
          <span className="mx-8">•</span>
          <span className="mx-8">✨ تشكيلة الشتاء الجديدة متاحة الآن</span>
        </div>
      </div>

      {/* 2. النافبار الرئيسية */}
      <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100] h-20 w-full shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between relative">
          
          {/* زر القائمة للموبايل والديسكتوب */}
          <button onClick={() => setIsMenuOpen(true)} className="text-white p-2 hover:text-[#F5C518] transition-colors z-20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* اللوجو (في المنتصف) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Link href="/">
              <img src="/logo.jpg" alt="WIND" className="h-14 md:h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" />
            </Link>
          </div>

          {/* أيقونة السلة */}
          <div className="flex items-center gap-4 z-20">
            <button onClick={toggleCart} className="relative p-2 group">
              <svg className="w-8 h-8 text-white group-hover:text-[#F5C518] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItems?.length > 0 && (
                <span className="absolute top-1 right-0 bg-[#F5C518] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-black shadow-lg">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. المنيو الجانبية (Sidebar Menu) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[200] flex" dir="rtl">
            {/* الخلفية المظلمة */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
            
            {/* محتوى المنيو */}
            <div className="relative bg-[#1a1a1a] w-[85%] max-w-[320px] h-full shadow-2xl flex flex-col border-l border-[#333] animate-[slideInRight_0.3s_ease-out]">
              
              {/* هيدر المنيو */}
              <div className="p-6 bg-[#222] border-b border-[#333] flex justify-between items-center">
                <h3 className="text-[#F5C518] font-black text-xl italic uppercase tracking-tighter">WIND MENU</h3>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* قائمة الأقسام */}
              <div className="flex-1 overflow-y-auto py-6">
                <ul className="space-y-2 px-4">
                  {categories.map((cat, i) => (
                    <li key={i} className="flex flex-col group">
                      <div className="flex items-center w-full bg-[#252525] rounded-xl overflow-hidden border border-transparent hover:border-[#333] transition-all">
                        <Link 
                          href={cat.link || "/"} 
                          onClick={() => !cat.children?.length && setIsMenuOpen(false)}
                          className={`flex-1 p-4 font-black transition-colors ${cat.highlight ? 'bg-[#F5C518] text-black' : 'text-gray-200 hover:text-[#F5C518]'}`}
                        >
                          {cat.name}
                        </Link>
                        {cat.children?.length > 0 && (
                          <button onClick={() => toggleSubMenu(i)} className="p-4 text-[#F5C518] border-r border-[#333] hover:bg-black/20">
                            <svg className={`w-5 h-5 transition-transform ${openSubMenus[i] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* الأقسام الفرعية */}
                      {cat.children?.length > 0 && openSubMenus[i] && (
                        <ul className="mt-2 pr-4 space-y-1 border-r-2 border-[#F5C518]/30">
                          {cat.children.map((sub, j) => (
                            <li key={j}>
                              <Link href={sub.link || "#"} onClick={() => setIsMenuOpen(false)} className="block p-3 text-sm text-gray-400 hover:text-[#F5C518] font-bold border-b border-[#333]/10">
                                {sub.title || sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* فوتر المنيو */}
              <div className="p-6 border-t border-[#333] text-center">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">WIND Egyptian Wear © 2026</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}