"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// تأكد من المسارات حسب مشروعك
import { useCart } from "@/context/CartContext"; 
import { db } from "@/lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { X, ShoppingBag, ChevronLeft, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems = [], toggleCart } = useCart() || {};
  
  // داتا المنيو الكاملة
  const [categories, setCategories] = useState([]);
  
  // نظام الطبقات: الطبقة الحالية + تاريخ التصفح للرجوع
  const [activeLayer, setActiveLayer] = useState({ title: "الرئيسية", items: [] });
  const [history, setHistory] = useState([]);

  // --- دوال المعالجة ---
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
        // تهيئة الطبقة الأولى
        setActiveLayer({ title: "WIND Catalogue", items: cleanData });
      }
    });
    return () => unsub();
  }, []);

  // --- محرك التنقل (Drill-down Logic) ---
  const openSubMenu = (item) => {
    // 1. نحفظ الطبقة الحالية في التاريخ
    setHistory([...history, activeLayer]);
    // 2. ندخل الطبقة الجديدة
    setActiveLayer({ title: item.title, items: item.children });
  };

  const goBack = () => {
    if (history.length === 0) return;
    // 1. نجيب آخر طبقة كنا فيها
    const previousLayer = history[history.length - 1];
    // 2. نحذفها من التاريخ
    setHistory(history.slice(0, -1));
    // 3. نعرضها
    setActiveLayer(previousLayer);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    // تصفير المنيو بعد 300 مللي ثانية (وقت الانيميشن)
    setTimeout(() => {
      setHistory([]);
      setActiveLayer({ title: "WIND Catalogue", items: categories });
    }, 300);
  };

  return (
    <>
      {/* 1. الشريط العلوي (نفس كودك بالظبط) */}
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

      {/* 2. النافبار (نفس كودك بالظبط للحفاظ على اللوجو والأيقونة) */}
      <nav className="bg-black/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100] h-20 w-full transition-all duration-500">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* زر القائمة - (نفس تصميمك) */}
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

          {/* اللوجو - (نفس كودك) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/">
              <img 
                src="/logo.jpg" 
                alt="WIND" 
                className="h-12 md:h-14 w-auto object-contain brightness-110 contrast-125 hover:scale-105 transition-all duration-700" 
              />
            </Link>
          </div>

          {/* السلة - (نفس كودك) */}
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

      {/* 3. المنيو الداخلي (التعديل الجذري هنا للأداء والرجوع) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] overflow-hidden" dir="rtl">
          
          {/* الخلفية: شلنا البلور التقيل وخليناها لون نصف شفاف للأداء السريع */}
          <div 
            className="absolute inset-0 bg-black/80 transition-opacity duration-300"
            onClick={closeMenu}
          ></div>
          
          <div className="absolute top-0 right-0 w-full max-w-[400px] h-full bg-[#0a0a0a] border-l border-white/5 shadow-2xl flex flex-col animate-slide-in">
            
            {/* رأس المنيو: هنا بيظهر زر الرجوع */}
            <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center min-h-[80px]">
              {history.length > 0 ? (
                // --- زر الرجوع الجديد والواضح ---
                <button 
                  onClick={goBack}
                  className="flex items-center gap-2 bg-[#F5C518] text-black px-4 py-2 rounded-lg font-black text-xs hover:bg-white transition-colors"
                >
                  <ArrowRight size={16} strokeWidth={3} />
                  <span>رجوع</span>
                </button>
              ) : (
                <span className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase italic">
                  WIND Shopping Catalogue
                </span>
              )}

              <button 
                onClick={closeMenu} 
                className="text-white/50 hover:text-red-500 transition-colors p-2 bg-[#1a1a1a] rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* عنوان القسم الحالي */}
            <div className="px-8 pt-6">
              <h2 className="text-3xl font-black text-white italic animate-fade-in">{activeLayer.title}</h2>
              <div className="h-1 w-12 bg-[#F5C518] mt-2 mb-4"></div>
            </div>

            {/* محتوى القائمة (سريع جداً بدون تهنيج) */}
            <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
              <ul className="space-y-3">
                {activeLayer.items.map((item, i) => (
                  <li key={item.id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    
                    {item.children?.length > 0 ? (
                      // --- زر للدخول في قسم فرعي ---
                      <button 
                        onClick={() => openSubMenu(item)}
                        className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#222] rounded-xl hover:border-[#F5C518] hover:bg-[#222] group transition-all"
                      >
                        <span className="text-lg font-bold text-gray-200 group-hover:text-white">{item.title}</span>
                        <div className="flex items-center text-[#F5C518]">
                          <span className="text-[10px] mr-2 opacity-0 group-hover:opacity-100 transition-opacity">تصفح</span>
                          <ChevronLeft size={20} />
                        </div>
                      </button>
                    ) : (
                      // --- رابط مباشر ---
                      <Link 
                        href={item.link} 
                        onClick={closeMenu}
                        className="block p-4 border-b border-white/5 text-lg font-bold text-gray-400 hover:text-[#F5C518] hover:pl-2 transition-all"
                      >
                        {item.title}
                      </Link>
                    )}

                  </li>
                ))}
              </ul>
            </div>

            {/* الفوتر */}
            <div className="p-6 border-t border-white/5 bg-[#0f0f0f] text-center">
              <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.5em]">WIND PREMIUM WEAR</p>
            </div>
          </div>
        </div>
      )}

      {/* الستايلات والأنيميشن المخففة للأداء */}
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </>
  );
}