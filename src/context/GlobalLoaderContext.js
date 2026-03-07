"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

const GlobalLoaderContext = createContext();

export function GlobalLoaderProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isReceding, setIsReceding] = useState(false);
  const [loaderType, setLoaderType] = useState("standard");
  const [pageReady, setPageReady] = useState(false); // Data-driven readiness signal
  const pathname = usePathname();

  // Maximum timeout: 8 seconds fail-safe
  const MAX_LOADER_TIME = 8000;

  // [تعديل جراحي] تم إزالة useEffect الخاص بـ document.readyState بالكامل
  // لأنه كان يقوم بسحب اللودر فوراً قبل انتظار بيانات Firebase (وهذا هو سبب ظهور النافبار مبكراً)
  // الاعتماد الآن سيكون 100% على signalPageReady القادم من الصفحة نفسها

  // Handle route changes: Reset state
  useEffect(() => {
    // [تعديل جراحي] تم إزالة window.scrollTo للسماح لـ Next.js بإدارة السكرول بذكاء
    // (الذهاب للأعلى في الروابط الجديدة، والعودة لنفس المكان عند الضغط على زر الرجوع)

    // Reset loader state for new route
    setIsVisible(true);
    setIsReceding(false);
    
    // Use a timeout to reset pageReady AFTER the component tree has time to detect the pathname change
    // This prevents the race condition where setPageReady(false) overwrites signalPageReady() calls
    const resetReadyTimer = setTimeout(() => {
      setPageReady(false);
    }, 0);

    // Detect if navigating to Kashier Payment Gateway
    const isKashierPayment = pathname?.includes("kashier") || pathname?.includes("checkout");
    setLoaderType(isKashierPayment ? "secure-vault" : "standard");

    // Fail-safe timeout: Force recede after 8 seconds regardless of pageReady
    const timeoutTimer = setTimeout(() => {
      setIsReceding(true);
      setTimeout(() => setIsVisible(false), 900);
    }, MAX_LOADER_TIME);

    return () => {
      clearTimeout(resetReadyTimer);
      clearTimeout(timeoutTimer);
    };
  }, [pathname]);

  // [تعديل جراحي 1] حساس الروابط: للتفريق بين النقر على رابط وبين سهم الرجوع
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLinkClick = (e) => {
      // لو العميل ضغط على أي رابط (a tag)، سجل إن دي "زيارة جديدة" مش رجوع
      const target = e.target.closest('a');
      if (target && target.href) {
        sessionStorage.setItem('wind_nav_type', 'link_click');
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  // [تعديل جراحي 2] مدير السكرول الذكي: حفظ مكان العميل في كل صفحة بصمت
  useEffect(() => {
    if (typeof window === "undefined") return;
    let scrollTimeout;
    
    const handleScroll = () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        sessionStorage.setItem(`wind_scroll_${pathname}`, window.scrollY);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    };
  }, [pathname]);

  // Handle page readiness: Trigger recede strictly AFTER DOM has painted
  useEffect(() => {
    if (pageReady && isVisible && !isReceding) {
      
      // [تعديل جراحي جذري] إعطاء المتصفح 50 ملي ثانية ليرسم المنتجات ويأخذ الارتفاع الفعلي
      // هذا يمنع اللجلجة ويضمن دقة السكرول 100% لأن الصفحة ستكون مكتملة البناء تحت اللودر
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const navType = sessionStorage.getItem('wind_nav_type');
          const savedScroll = sessionStorage.getItem(`wind_scroll_${pathname}`);

          if (navType === 'link_click') {
            window.scrollTo({ top: 0, behavior: "instant" });
            sessionStorage.removeItem('wind_nav_type');
          } else if (savedScroll !== null) {
            window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" });
          } else {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }

        // بعد استقرار السكرول تماماً، نأمر اللودر بالانسحاب الناعم
        setIsReceding(true);
        setTimeout(() => setIsVisible(false), 900);
      }, 50); // هدنة الرسم (50ms)
    }
  }, [pageReady, isVisible, isReceding, pathname]);

  // Expose setPageReady for pages to signal data readiness
  const signalPageReady = useCallback(() => {
    setPageReady(true);
  }, []);

  const value = {
    isVisible,
    isReceding,
    loaderType,
    pageReady,
    setPageReady,
    signalPageReady, // Public API for pages to use
  };

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within GlobalLoaderProvider");
  }
  return context;
}

/**
 * Custom hook for pages to signal they're ready to be displayed.
 * Call this after critical data and initial images are loaded.
 * 
 * @example
 * const { signalPageReady } = usePageReady();
 * 
 * useEffect(() => {
 *   if (products.length > 0 && imagesLoaded) {
 *     signalPageReady(); // Tell GlobalLoader to start receding
 *   }
 * }, [products, imagesLoaded]);
 */
export function usePageReady() {
  const { signalPageReady } = useGlobalLoader();
  return { signalPageReady };
}
