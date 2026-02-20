"use client";
import { useState, useEffect } from "react";

export default function GlobalLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1. ننتظر تحميل الصفحة وكل الموارد (الصور، الخطوط، الخ)
    const handleLoad = () => {
      // تأخير بسيط 600ms لضمان استقرار الـ Layout تماماً خلف الشاشة السوداء
      setTimeout(() => setIsVisible(false), 600);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#121212] flex items-center justify-center transition-opacity duration-500">
      <div className="relative flex flex-col items-center">
        {/* اللوجو الخاص بـ WIND */}
        <img 
          src="/logo.jpg" 
          alt="WIND" 
          className="h-24 md:h-28 w-auto object-contain animate-pulse" 
        />
        
        {/* شريط تحميل ناعم باللون الأصفر المميّز */}
        <div className="mt-8 w-32 h-[1px] bg-[#333] relative overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-[#F5C518] animate-loading"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-loading {
          animation: loading 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}