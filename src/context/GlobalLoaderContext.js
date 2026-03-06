"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const GlobalLoaderContext = createContext();

export function GlobalLoaderProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isReceding, setIsReceding] = useState(false);
  const [loaderType, setLoaderType] = useState("standard");
  const pathname = usePathname();

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

  // Handle route changes
  useEffect(() => {
    // Show loader for route change
    setIsVisible(true);
    setIsReceding(false);

    // Detect if navigating to Kashier Payment Gateway
    const isKashierPayment = pathname?.includes("kashier") || pathname?.includes("checkout");
    setLoaderType(isKashierPayment ? "secure-vault" : "standard");

    // Trigger recede motion after content loads
    const timer = setTimeout(() => {
      setIsReceding(true);
      setTimeout(() => setIsVisible(false), 900); // Match recede animation duration
    }, isKashierPayment ? 1200 : 600);

    return () => clearTimeout(timer);
  }, [pathname]);

  const value = {
    isVisible,
    isReceding,
    loaderType,
    setIsReceding,
    setIsVisible,
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
