"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext"; 
import { db } from "../../lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { X, Menu, ShoppingBag, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({}); // يبدأ مغلقاً تماماً
  const { cartItems = [], toggleCart } = useCart() || {};
  const [categories, setCategories] = useState([]);

  // --- دالة معالجة الروابط لضمان التوافق ---
  const formatLink = (link) => {
    if (!link) return "/";
    if (link.startsWith('/') || link.startsWith('http')) return link;
    return `/collections/${link}`;
  };

  // --- دالة تنظيف البيانات "الشجرية" لضمان ظهور كل الفروع ---
  const sanitizeMenuItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      ...item,
      title: typeof item.title === 'string' ? item.title : "قسم",
      link: formatLink(item.link),
      children: sanitizeMenuItems(item.children || []) // تنظيف الفروع بشكل متكرر (Recursive)
    }));
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().menuItems) {
        const cleanData = sanitizeMenuItems(docSnap.data().menuItems);
        setCategories(cleanData);
      }
    });
    return () => unsub();
  }, []);

  const toggleSubMenu = (id) => {
    setOpenSubMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* 1. شريط الإعلانات السينمائي المتحرك */}
      <div className="bg-[#F5C518] text-black h-10 flex items-center overflow-hidden border-b border-black relative z-[110]">
        <div className="whitespace-nowrap flex animate-marquee font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">
          {[1, 2, 3].map((i) => (
            <span key={i} className="flex items-center">
              <span className="mx-10">🚚 شحن مجاني للطلبات فوق 2000 ج.م</span>
              <span className="mx-10">•</span>
              <span className="mx-10">🔥 استعمل كود WIND لخصم إضافي</span>
              <span className="mx-10">•</span>
              <span className="mx-10">✨ جودة مصرية بمقاييس عالمية</span>
              <span className="mx-10">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. النافبار الرئيسية (WIND Premium Header) */}
      <nav className="bg-black/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100] h-20 w-full transition-all duration-500">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* زر القائمة - تصميم مينيمال */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="group flex items-center gap-3 text-white/70 hover:text-[#F5C518] transition-all"
          >
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="w-8 h-[2px] bg-current transition-all group-hover:w-5"></span>
              <span className="w-5 h-[2px] bg-current transition-all group-hover:w-8"></span>
            </div>
            <span className="hidden md:block text-[10px] font-black tracking-widest uppercase">Menu</span>
          </button>

          {/* اللوجو - المركز السينمائي */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-12 md:h-14 w-auto object-contain brightness-110 contrast-125 hover:scale-105 transition-all duration-700" 
              />
            </Link>
          </div>

          {/* السلة والبحث */}
          <div className="flex items-center gap-6">
            <button onClick={toggleCart} className="relative group p-2 text-white/70 hover:text-[#F5C518] transition-all">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5C518] text-black text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 3. القائمة السينمائية (Cinematic Overlay Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] overflow-hidden" dir="rtl">
          {/* خلفية غامضة بتأثير زجاجي (تم تقليل الـ blur لمنع التهنيج) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-[10px] transition-all duration-500"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          <div className="absolute top-0 right-0 w-full max-w-[450px] h-full bg-[#0a0a0a] border-l border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col animate-slide-in">
            
            {/* إغلاق المنيو */}
            <div className="p-8 flex justify-between items-center">
              <span className="text-[10px] font-black text-white/30 tracking-[0.5em] uppercase italic">WIND Catalogue</span>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="text-white/50 hover:text-[#F5C518] hover:rotate-90 transition-all duration-500"
              >
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            {/* محتوى القائمة - تدرج هرمي */}
            <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
              <ul className="space-y-6">
                {categories.map((cat, i) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  const isOpen = openSubMenus[cat.id || i];
                  
                  return (
                    <li key={i} className="group animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-center justify-between py-2">
                        <Link 
                          href={cat.link} 
                          onClick={() => !hasChildren && setIsMenuOpen(false)}
                          className="text-3xl md:text-4xl font-black text-white/40 hover:text-white transition-all hover:pr-4 relative"
                        >
                          <span className="group-hover:text-[#F5C518] transition-colors">{cat.title}</span>
                        </Link>
                        
                        {/* السهم المطور الواضح */}
                        {hasChildren && (
                          <button 
                            onClick={() => toggleSubMenu(cat.id || i)} 
                            className={`w-12 h-12 flex items-center justify-center rounded-full border border-white/5 text-white/30 hover:text-[#F5C518] transition-all ${isOpen ? 'bg-[#F5C518] text-black border-transparent' : ''}`}
                            title={isOpen ? "إغلاق القسم" : "فتح القسم"}
                          >
                            <ChevronDown 
                              size={20} 
                              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                            />
                          </button>
                        )}
                      </div>

                      {/* الأقسام الفرعية - نظام الكتالوج */}
                      {hasChildren && isOpen && (
                        <div className="mt-4 pr-6 space-y-4 border-r border-[#F5C518]/20 animate-expand">
                          {cat.children.map((sub, j) => (
                            <div key={j} className="group/sub">
                              <Link 
                                href={sub.link} 
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-4 text-white/60 hover:text-[#F5C518] transition-all"
                              >
                                <span className="w-2 h-[1px] bg-[#F5C518]/30 group-hover/sub:w-6 transition-all"></span>
                                <span className="text-lg font-bold italic">{sub.title}</span>
                              </Link>
                              
                              {/* فروع الفروع - (Deep Nesting) */}
                              {sub.children?.length > 0 && (
                                <div className="mt-2 pr-6 space-y-2 opacity-60">
                                  {sub.children.map((grand, k) => (
                                    <Link key={k} href={grand.link} onClick={() => setIsMenuOpen(false)} className="block text-xs text-white/40 hover:text-[#F5C518] py-1">
                                      {grand.title}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* فوتر المنيو */}
            <div className="p-10 border-t border-white/5 bg-black/20">
              <div className="flex gap-6 mb-8">
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest hover:text-[#F5C518] cursor-pointer">Instagram</span>
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest hover:text-[#F5C518] cursor-pointer">Facebook</span>
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest hover:text-[#F5C518] cursor-pointer">TikTok</span>
              </div>
              <p className="text-[8px] text-white/10 font-black uppercase tracking-[0.8em]">WIND PREMIUM EGYPTIAN WEAR</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        
        @keyframes slide-in { 
          from { transform: translateX(100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        /* تقليل مدة الأنيميشن وتغيير الـ bezier ليكون أسرع وأخف */
        .animate-slide-in { animation: slide-in 0.4s ease-out; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.4s ease-out forwards; opacity: 0; }

        @keyframes expand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1000px; }
        }
        .animate-expand { animation: expand 0.4s ease-out forwards; overflow: hidden; }

        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F5C518; }
      `}</style>
    </>
  );
}