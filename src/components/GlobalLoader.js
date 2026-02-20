"use client";
import { useState, useEffect } from "react";

export default function GlobalLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // بمجرد ما الصفحة تحمل بالكامل، بنشيل شاشة التحميل
    if (document.readyState === "complete") {
      setLoading(false);
    } else {
      window.addEventListener("load", () => setLoading(false));
      return () => window.removeEventListener("load", () => setLoading(false));
    }
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#121212] flex items-center justify-center transition-opacity duration-500">
      <div className="relative flex flex-col items-center">
        {/* اللوجو الخاص بك من المسار اللي حددته */}
        <img 
          src="/logo.jpg" 
          alt="Wind Logo" 
          className="h-24 w-auto object-contain animate-pulse"
        />
        {/* لمسة أناقة: شريط تحميل نحيف باللون الأصفر */}
        <div className="mt-6 w-32 h-[2px] bg-[#222] rounded-full overflow-hidden">
          <div className="h-full bg-[#F5C518] animate-[loading_1.5s_infinite] ease-in-out"></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}