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

  // Handle initial page load
  useEffect(() => {
    const handleInitialLoad = () => {
      if (document.readyState === "complete") {
        // Page already loaded before component mounted
        setIsReceding(true);
        setTimeout(() => setIsVisible(false), 900);
        return;
      }
    };

    handleInitialLoad();
    window.addEventListener("load", handleInitialLoad);
    return () => window.removeEventListener("load", handleInitialLoad);
  }, []);

  // Handle route changes: Reset state and scroll to top
  useEffect(() => {
    // Scroll to top immediately on route change (before loader animation)
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    // Reset loader state for new route
    setIsVisible(true);
    setIsReceding(false);
    setPageReady(false);

    // Detect if navigating to Kashier Payment Gateway
    const isKashierPayment = pathname?.includes("kashier") || pathname?.includes("checkout");
    setLoaderType(isKashierPayment ? "secure-vault" : "standard");

    // Fail-safe timeout: Force recede after 8 seconds regardless of pageReady
    const timeoutTimer = setTimeout(() => {
      setIsReceding(true);
      setTimeout(() => setIsVisible(false), 900);
    }, MAX_LOADER_TIME);

    return () => clearTimeout(timeoutTimer);
  }, [pathname]);

  // Handle page readiness: Trigger recede only when page is ready OR timeout expires
  useEffect(() => {
    if (pageReady && isVisible && !isReceding) {
      // Page has signaled it's ready - start recede animation
      const recededTimer = setTimeout(() => {
        setIsReceding(true);
        setTimeout(() => setIsVisible(false), 900);
      }, loaderType === "secure-vault" ? 1200 : 600); // Minimum display time

      return () => clearTimeout(recededTimer);
    }
  }, [pageReady, isVisible, isReceding, loaderType]);

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
