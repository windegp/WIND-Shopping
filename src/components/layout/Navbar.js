"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from "@/context/CartContext"; 
import { db } from "@/lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { X, ShoppingBag, ChevronLeft, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems = [], toggleCart } = useCart() || {};
  
  const [categories, setCategories] = useState([]);
  
  const [activeLayer, setActiveLayer] = useState({ title: "الرئيسية", items: [] });
  const [history, setHistory] = useState([]);

  const formatLink = (link) => {
    if (!link) return "/";
    if (link.startsWith('/') || link.startsWith('http')) return link;
    return `/collections/${link}`;
  };

  const sanitizeMenuItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: typeof item.title === 'string' ? item.title : "قسم",
      link: formatLink(item.link),
      children: sanitizeMenuItems(item.children || [])
    }));
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().menuItems) {
        const cleanData = sanitizeMenuItems(docSnap.data().menuItems);
        setCategories(cleanData);
        setActiveLayer({ title: "WIND Catalogue", items: cleanData });
      }
    });
    return () => unsub();
  }, []);

  const openSubMenu = (item) => {
    setHistory([...history, activeLayer]);
    setActiveLayer({ title: item.title, items: item.children });
  };

  const goBack = () => {
    if (history.length === 0) return;
    const previousLayer = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setActiveLayer(previousLayer);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      setHistory([]);
      setActiveLayer({ title: "WIND Catalogue", items: categories });
    }, 300);
  };

  return (
    <>
      {/* 1. شريط الماركيه — لم يتغير */}
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

      {/* 2. النافبار — تم تغيير bg-black/95 إلى أبيض */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-[100] h-20 w-full transition-all duration-500">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* زر القائمة — text-white/70 → text-gray-500 */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="group flex items-center gap-3 text-gray-500 hover:text-[#F5C518] transition-all"
          >
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="w-8 h-[2px] bg-current transition-all group-hover:w-5"></span>
              <span className="w-5 h-[2px] bg-current transition-all group-hover:w-8"></span>
            </div>
            <span className="hidden md:block text-[10px] font-black tracking-widest uppercase">Menu</span>
          </button>

          {/* اللوجو — لم يتغير */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-12 md:h-14 w-auto object-contain hover:scale-105 transition-all duration-700" 
              />
            </Link>
          </div>

          {/* السلة — text-white/70 → text-gray-500 ، border-black → border-gray-200 */}
          <div className="flex items-center gap-6">
            <button onClick={toggleCart} className="relative group p-2 text-gray-500 hover:text-[#F5C518] transition-all">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5C518] text-black text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 3. المنيو الداخلي — تم تغيير الألوان الداكنة إلى فاتحة */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] overflow-hidden" dir="rtl">
          
          {/* Overlay — لم يتغير المنطق */}
          <div 
            className="absolute inset-0 bg-black/40 transition-opacity duration-300"
            onClick={closeMenu}
          ></div>
          
          {/* Panel — bg-[#0a0a0a] → bg-white ، border-white/5 → border-gray-200 */}
          <div className="absolute top-0 right-0 w-full max-w-[400px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-slide-in">
            
            {/* رأس المنيو — bg-[#111] → bg-white ، border-white/10 → border-gray-100 */}
            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center min-h-[80px]">
              {history.length > 0 ? (
                <button 
                  onClick={goBack}
                  className="flex items-center gap-2 bg-[#F5C518] text-black px-4 py-2 rounded-lg font-black text-xs hover:bg-[#e6b800] transition-colors"
                >
                  <ArrowRight size={16} strokeWidth={3} />
                  <span>رجوع</span>
                </button>
              ) : (
                /* text-white/30 → text-gray-400 */
                <span className="text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase italic">
                  WIND CATALOGUE
                </span>
              )}

              {/* text-white/50 hover:text-red-500 → text-gray-400 ، bg-[#1a1a1a] → bg-gray-100 */}
              <button 
                onClick={closeMenu} 
                className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* عنوان القسم — text-white → text-gray-900 */}
            <div className="px-8 pt-6">
              <h2 className="text-3xl font-black text-gray-900 italic animate-fade-in">{activeLayer.title}</h2>
              <div className="h-1 w-12 bg-[#F5C518] mt-2 mb-4"></div>
            </div>

            {/* قائمة العناصر */}
            <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
              <ul className="space-y-3">
                {activeLayer.items.map((item, i) => (
                  <li key={item.id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    
                    {item.children?.length > 0 ? (
                      /* bg-[#1a1a1a] → bg-gray-50 ، border-[#222] → border-gray-200 ، text-gray-200 → text-gray-700 */
                      <button 
                        onClick={() => openSubMenu(item)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#F5C518] hover:bg-[#fffef5] group transition-all"
                      >
                        <span className="text-lg font-bold text-gray-700 group-hover:text-gray-900">{item.title}</span>
                        <div className="flex items-center text-[#F5C518]">
                          <span className="text-[10px] mr-2 opacity-0 group-hover:opacity-100 transition-opacity">تصفح</span>
                          <ChevronLeft size={20} />
                        </div>
                      </button>
                    ) : (
                      /* border-white/5 → border-gray-100 ، text-gray-400 → text-gray-500 */
                      <Link 
                        href={item.link} 
                        onClick={closeMenu}
                        className="block p-4 border-b border-gray-100 text-lg font-bold text-gray-500 hover:text-[#F5C518] hover:pl-2 transition-all"
                      >
                        {item.title}
                      </Link>
                    )}

                  </li>
                ))}
              </ul>
            </div>

            {/* الفوتر — bg-[#0f0f0f] → bg-gray-50 ، text-white/20 → text-gray-400 */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.5em]">WIND PREMIUM WEAR</p>
            </div>
          </div>
        </div>
      )}

      {/* الستايلات — لم تتغير */}
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }

        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.2s ease-out forwards; opacity: 0; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }

        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </>
  );
}