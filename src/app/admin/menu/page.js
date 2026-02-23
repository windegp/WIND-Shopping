"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// تأكد من مسار الـ CartContext والـ Firebase حسب مشروعك
import { useCart } from "@/context/CartContext"; 
import { db } from "@/lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { X, ShoppingBag, ChevronLeft, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems = [], toggleCart } = useCart() || {};
  
  // داتا المنيو الأصلية
  const [categories, setCategories] = useState([]);
  
  // نظام الطبقات: تخزين المكان الحالي والتاريخ (عشان زرار الرجوع)
  const [activeMenu, setActiveMenu] = useState({ title: "WIND MENU", items: [] });
  const [menuHistory, setMenuHistory] = useState([]);

  // --- معالجة البيانات ---
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
        // تعيين القائمة الرئيسية كبداية
        setActiveMenu({ title: "WIND MENU", items: cleanData });
      }
    });
    return () => unsub();
  }, []);

  // --- محرك التنقل بين الأقسام (Drill-down Engine) ---
  const goToSubMenu = (item) => {
    // حفظ القائمة الحالية في التاريخ عشان نقدر نرجعلها
    setMenuHistory([...menuHistory, activeMenu]);
    // عرض القائمة الفرعية الجديدة
    setActiveMenu({ title: item.title, items: item.children });
  };

  const goBack = () => {
    if (menuHistory.length === 0) return;
    const previousMenu = menuHistory[menuHistory.length - 1];
    // إزالة آخر قائمة من التاريخ
    setMenuHistory(menuHistory.slice(0, -1));
    setActiveMenu(previousMenu);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    // تصفير المنيو بعد ما يتقفل عشان يفتح على الرئيسية المرة الجاية
    setTimeout(() => {
      setMenuHistory([]);
      setActiveMenu({ title: "WIND MENU", items: categories });
    }, 300);
  };

  return (
    <>
      {/* ستايلات حركية خفيفة جداً لمنع التهنيج */}
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; white-space: nowrap; display: inline-block; will-change: transform; }
        .marquee-container:hover .animate-marquee { animation-play-state: paused; }
        
        @keyframes fastFadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .layer-animate { animation: fastFadeIn 0.25s ease-out forwards; }
      `}</style>

      {/* 1. الشريط العلوي الأصلي الخاص بك (لم يتم تغييره) */}
      <div className="bg-[#F5C518] text-black text-xs md:text-sm font-black py-2 overflow-hidden relative z-[50] marquee-container border-b border-black w-full">
        <div className="animate-marquee w-full text-center tracking-widest uppercase">
          <span className="mx-8">🚚 توصيل سريع لجميع محافظات مصر</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔥 خصم 10% بكود: <span className="bg-black text-[#F5C518] px-1 italic">WIND10</span></span>
          <span className="mx-8">•</span>
          <span className="mx-8">✨ تشكيلة الشتاء الجديدة متاحة الآن</span>
        </div>
      </div>

      {/* 2. النافبار الأساسية (بحجم اللوجو الأصلي وأيقونة المنيو الأصلية) */}
      <nav className="bg-[#121212] border-b border-[#333] sticky top-0 z-[100] h-20 w-full shadow-xl">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between relative">
          
          {/* أيقونة المنيو الاحترافية */}
          <button onClick={() => setIsMenuOpen(true)} className="group flex items-center gap-3 text-white hover:text-[#F5C518] transition-all z-20 p-2">
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="w-8 h-[2px] bg-current transition-all"></span>
              <span className="w-5 h-[2px] bg-current transition-all group-hover:w-8"></span>
            </div>
          </button>

          {/* اللوجو (تم إرجاع الحجم الأصلي الخاص بك) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Link href="/">
              <img src="/logo.jpg" alt="WIND" className="h-14 md:h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" />
            </Link>
          </div>

          {/* أيقونة السلة */}
          <div className="flex items-center gap-4 z-20">
            <button onClick={toggleCart} className="relative p-2 group text-white hover:text-[#F5C518] transition-colors">
              <ShoppingBag size={28} strokeWidth={1.5} />
              {cartItems?.length > 0 && (
                <span className="absolute top-1 right-0 bg-[#F5C518] text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-black shadow-lg">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 3. المنيو الجانبي (نظام الطبقات السريع والخالي من التهنيج) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] flex" dir="rtl">
          {/* خلفية معتمة سريعة جداً (بدون Blur لمنع التقل) */}
          <div className="absolute inset-0 bg-black/80 transition-opacity" onClick={closeMenu}></div>
          
          {/* جسم المنيو */}
          <div className="relative bg-[#111] w-[85%] max-w-[380px] h-full shadow-2xl flex flex-col border-l border-[#333] animate-[slideInRtl_0.3s_ease-out]">
            
            {/* هيدر المنيو (زر الرجوع المطور والواضح جداً) */}
            <div className="p-5 bg-[#1a1a1a] border-b border-[#333] flex justify-between items-center min-h-[80px]">
              {menuHistory.length > 0 ? (
                // زر رجوع واضح ومميز
                <button 
                  onClick={goBack} 
                  className="flex items-center gap-2 text-black bg-[#F5C518] px-4 py-2 rounded-xl hover:bg-white transition-colors active:scale-95"
                >
                  <ArrowRight size={20} strokeWidth={2.5} />
                  <span className="font-black text-sm">رجوع</span>
                </button>
              ) : (
                <h3 className="text-[#F5C518] font-black text-2xl italic uppercase tracking-tighter">WIND MENU</h3>
              )}
              
              <button onClick={closeMenu} className="text-gray-400 hover:text-white bg-[#222] p-2 rounded-full transition-colors">
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* عنوان القسم الحالي (يظهر فقط داخل الفروع لتوضيح مكان الزبون) */}
            {menuHistory.length > 0 && (
              <div className="px-6 pt-6 pb-2 bg-[#111]">
                <h4 className="text-white text-xl font-black">{activeMenu.title}</h4>
                <div className="h-1 w-10 bg-[#F5C518] mt-3"></div>
              </div>
            )}

            {/* قائمة العناصر */}
            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
              <ul className="space-y-3 layer-animate" key={activeMenu.title}>
                {activeMenu.items.map((item, i) => (
                  <li key={item.id || i}>
                    {/* لو العنصر له فروع (يظهر زر عليه سهم لليسار) */}
                    {item.children?.length > 0 ? (
                      <button 
                        onClick={() => goToSubMenu(item)} 
                        className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#222] rounded-xl hover:border-[#F5C518] transition-all duration-200"
                      >
                        <span className="text-white font-black text-lg">{item.title}</span>
                        {/* مربع صغير يميز السهم عشان يكون واضح للمستخدم إنه هيدخل قسم تاني */}
                        <div className="bg-[#222] p-1.5 rounded-lg text-[#F5C518]">
                          <ChevronLeft size={20} />
                        </div>
                      </button>
                    ) : (
                      /* لو العنصر نهائي (ملوش فروع)، يظهر كرابط عادي */
                      <Link 
                        href={item.link} 
                        onClick={closeMenu} 
                        className="flex items-center p-4 bg-transparent border border-[#333] rounded-xl text-gray-300 hover:text-[#F5C518] hover:border-[#F5C518] font-bold text-lg transition-all duration-200"
                      >
                        {item.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* فوتر المنيو */}
            <div className="p-6 border-t border-[#333] bg-[#1a1a1a] text-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WIND Egyptian Wear © 2026</p>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}