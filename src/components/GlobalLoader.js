"use client";
import { useState, useEffect } from "react";

export default function GlobalLoader() {
  const [isRendered, setIsRendered] = useState(true); // هل المكون موجود في الصفحة؟
  const [isFadingOut, setIsFadingOut] = useState(false); // هل بدأ التلاشي؟

  useEffect(() => {
    const handleLoad = () => {
      // 1. ننتظر قليلاً لضمان استقرار الموقع خلف الستار
      setTimeout(() => {
        setIsFadingOut(true); // نبدأ التلاشي (Fade Out)
        
        // 2. ننتظر مدة الانيميشن (500ms) قبل حذف المكون نهائياً
        setTimeout(() => setIsRendered(false), 500); 
      }, 800); // زيادة بسيطة للـ Warmth feeling
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!isRendered) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#121212] flex items-center justify-center transition-all duration-500 ease-in-out ${
        isFadingOut ? "opacity-0 invisible pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* اللوجو الخاص بـ WIND Shopping */}
        <img 
          src="/logo.jpg" 
          alt="WIND Shopping" 
          className="h-24 md:h-28 w-auto object-contain animate-pulse" 
        />
        
        {/* شريط تحميل ناعم باللون الأصفر المميّز لـ Wind */}
        <div className="mt-8 w-32 h-[1px] bg-[#333] relative overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-[#F5C518] animate-loading"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading {
          animation: loading 1.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}