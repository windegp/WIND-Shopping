"use client";
import { useEffect } from "react";
import { useGlobalLoader } from "@/context/GlobalLoaderContext";

export default function GlobalLoader() {
  const { isVisible, isReceding, loaderType } = useGlobalLoader();

  // [تعديل جراحي] إزالة الحاجز الأسود فوراً بمجرد تفعيل الرياكت، ليستلم اللودر القيادة بسلاسة
  useEffect(() => {
    const preloader = document.getElementById("ssr-preloader");
    if (preloader) preloader.remove();
  }, []);

  if (!isVisible) return null;

  if (loaderType === "secure-vault") {
    return (
      <div 
        className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center ${
          isReceding ? "receding-vault" : ""
        }`}
      >
        <div className="relative flex flex-col items-center gap-6">
          {/* Secure Shield/Lock Icon with Pulsing Animation */}
          <div className="relative w-24 h-24 md:w-28 md:h-28">
            <div className={`absolute inset-0 bg-[#F5C518]/20 rounded-full ${isReceding ? "" : "animate-pulse-ring"}`}></div>
            
            {/* Shield Icon */}
            <svg 
              className={`w-full h-full text-[#F5C518] ${isReceding ? "" : "animate-pulse-shield"}`}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>

            {/* Inner Lock Icon */}
            <svg 
              className="absolute inset-0 w-8 h-8 md:w-10 md:h-10 text-[#F5C518] m-auto animate-bounce-lock"
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>

          {/* Secure Gateway Text */}
          <div className="text-center">
            <p className="text-[#F5C518] text-sm md:text-base font-bold tracking-wider animate-pulse-text">
              جاري تأمين اتصالك...
            </p>
            <p className="text-gray-400 text-xs md:text-sm mt-2 leading-relaxed max-w-xs">
              يتم الآن تجهيز بوابة دفع مشفرة لحماية بياناتك
            </p>
          </div>

          {/* Security Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-[#F5C518] ${isReceding ? "" : "animate-pulse"}`}></div>
            <span className="text-gray-400 text-xs">اتصال آمن</span>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse-ring {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 197, 24, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(245, 197, 24, 0); }
          }
          
          @keyframes pulse-shield {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes bounce-lock {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          
          @keyframes pulse-text {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          .animate-pulse-ring {
            animation: pulse-ring 2s infinite;
          }
          
          .animate-pulse-shield {
            animation: pulse-shield 2s infinite;
          }
          
          .animate-bounce-lock {
            animation: bounce-lock 1s infinite;
          }
          
          .animate-pulse-text {
            animation: pulse-text 1.5s infinite;
          }
          
          .receding-vault {
            animation: vault-recede 900ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          
          @keyframes vault-recede {
            0% { 
              opacity: 1; 
              transform: scale(1);
            }
            100% { 
              opacity: 0; 
              transform: scale(0.9);
            }
          }
        `}</style>
      </div>
    );
  }

  // Standard WIND Shopping Loader
  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#121212] flex items-center justify-center ${
        isReceding ? "receding-standard" : ""
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* اللوجو الخاص بـ WIND */}
        <img 
          src="/logo.jpg" 
          alt="WIND" 
          className={`h-24 md:h-28 w-auto object-contain ${isReceding ? "" : "animate-pulse"}`}
        />
        
        {/* شريط تحميل ناعم باللون الأصفر المميّز */}
        <div className="mt-8 w-32 h-[1px] bg-[#333] relative overflow-hidden rounded-full">
          <div className={`absolute inset-0 bg-[#F5C518] ${isReceding ? "" : "animate-loading"}`}></div>
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
        
        .receding-standard {
          animation: loader-recede 900ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        
        @keyframes loader-recede {
          0% { 
            opacity: 1; 
            transform: scale(1);
          }
          100% { 
            opacity: 0; 
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}