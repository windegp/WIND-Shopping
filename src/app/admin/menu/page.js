"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext"; 
import { db } from "../../lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { X, ShoppingBag, ChevronLeft, ArrowRight, ArrowLeft } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState({ id: 'main', items: [], title: 'WIND MENU' });
  const [history, setHistory] = useState([]); // لتخزين مسار الرجوع
  const { cartItems = [], toggleCart } = useCart() || {};
  const [categories, setCategories] = useState([]);

  // --- تجهيز الداتا ---
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
      title: String(item.title || "قسم"),
      link: formatLink(item.link),
      children: sanitizeMenuItems(item.children || [])
    }));
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().menuItems) {
        const cleanData = sanitizeMenuItems(docSnap.data().menuItems);
        setCategories(cleanData);
        // التحديث الأولي للطبقة الرئيسية
        setActiveLayer({ id: 'main', items: cleanData, title: 'WIND MENU' });
      }
    });
    return () => unsub();
  }, []);

  // --- محرك الطبقات (Layer Engine) ---
  const goToLayer = (item) => {
    setHistory([...history, activeLayer]);
    setActiveLayer({ id: item.id, items: item.children, title: item.title });
  };

  const goBack = () => {
    const lastLayer = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setActiveLayer(lastLayer);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      setHistory([]);
      setActiveLayer({ id: 'main', items: categories, title: 'WIND MENU' });
    }, 500);
  };

  return (
    <>
      {/* 1. النافبار الأساسية (حافظنا على الأيقونة كما هي) */}
      <nav className="bg-black border-b border-white/5 sticky top-0 z-[100] h-20 w-full shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          <button onClick={() => setIsMenuOpen(true)} className="group flex items-center gap-3 text-white/70 hover:text-[#F5C518] transition-all">
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="w-8 h-[2px] bg-current"></span>
              <span className="w-5 h-[2px] bg-current transition-all group-hover:w-8"></span>
            </div>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/"><img src="/logo.jpg" alt="WIND" className="h-12 md:h-14 w-auto object-contain" /></Link>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={toggleCart} className="relative group p-2 text-white/70 hover:text-[#F5C518]">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5C518] text-black text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{cartItems.length}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. المنيو السينمائي الجديد (Layered Catalog) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] overflow-hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={closeMenu}></div>
          
          <div className="absolute top-0 right-0 w-full max-w-[400px] h-full bg-[#0a0a0a] shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col animate-catalog-slide">
            
            {/* هيدر الطبقة - يظهر زر الرجوع لو مش في الرئيسية */}
            <div className="p-8 flex items-center justify-between border-b border-white/5 bg-[#0f0f0f]">
              {history.length > 0 ? (
                <button onClick={goBack} className="flex items-center gap-2 text-[#F5C518] font-black text-xs uppercase tracking-widest animate-fade-in">
                  <ArrowRight size={20} /> رجوع
                </button>
              ) : (
                <span className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase">Catalogue</span>
              )}
              <button onClick={closeMenu} className="text-white/40 hover:text-white transition-all"><X size={28} strokeWidth={1}/></button>
            </div>

            {/* عنوان الطبقة الحالية */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-4xl font-black text-white italic tracking-tighter animate-fade-up">{activeLayer.title}</h2>
              <div className="h-1 w-12 bg-[#F5C518] mt-4"></div>
            </div>

            {/* قائمة العناصر - سريعة جداً */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-2">
                {activeLayer.items.map((item, i) => (
                  <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    {item.children?.length > 0 ? (
                      <button 
                        onClick={() => goToLayer(item)}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-[#F5C518] group transition-all duration-500"
                      >
                        <span className="text-xl font-black text-white group-hover:text-black transition-colors italic">{item.title}</span>
                        <ChevronLeft className="text-[#F5C518] group-hover:text-black transition-all group-hover:-translate-x-2" size={24} />
                      </button>
                    ) : (
                      <Link 
                        href={item.link} 
                        onClick={closeMenu}
                        className="block p-5 rounded-2xl border border-white/5 hover:border-[#F5C518]/30 group transition-all"
                      >
                        <span className="text-xl font-black text-white/50 group-hover:text-white transition-all italic">{item.title}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* فوتر المنيو */}
            <div className="p-8 border-t border-white/5 flex flex-col gap-4">
              <div className="flex justify-around opacity-30 text-[9px] font-black uppercase tracking-widest">
                <span>Instagram</span><span>Facebook</span><span>Tiktok</span>
              </div>
              <p className="text-center text-[8px] text-white/5 font-black uppercase tracking-[1em]">WIND PREMIUM</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes catalog-slide { 
          from { transform: translateX(100%); } 
          to { transform: translateX(0); } 
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-up { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-catalog-slide { animation: catalog-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-fade-up { animation: fade-up 0.5s ease-out forwards; }
      `}</style>
    </>
  );
}