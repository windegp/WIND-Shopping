"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { usePageReady, useGlobalLoader } from "@/context/GlobalLoaderContext";
import { DESIGN_REGISTRY } from "@/lib/designRegistry";

export default function Home() {
  const pathname = usePathname();
  const [layout, setLayout] = useState([]); 
  const [heroData, setHeroData] = useState({ slides: [], categories: [] });
  const [dataReady, setDataReady] = useState(false);
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderActive } = useGlobalLoader();

  // --- 1. جلب البيانات (المحرك الذكي) ---
  useEffect(() => {
    // أ. جلب ترتيب الأقسام والمحتوى
    const unsubLayout = onSnapshot(doc(db, "homepage", "layout_config"), (docSnap) => {
      if (docSnap.exists()) {
        setLayout(docSnap.data().sections || []);
        setDataReady(true);
      }
    });

    // ب. جلب بيانات قسم الهيرو
    const unsubHero = onSnapshot(doc(db, "homepage", "main-hero"), (docSnap) => {
      if (docSnap.exists()) {
        setHeroData(docSnap.data());
      }
    });

    return () => { 
      unsubLayout(); 
      unsubHero(); 
    };
  }, []);

 // Signal readiness when critical data loads (FIX: wait for both layout and hero data)
  useEffect(() => {
    const isHeroReady = heroData && heroData.slides && heroData.slides.length > 0;
    
    // لن يتم سحب اللودر إلا عندما تكتمل بيانات الـ layout وبيانات الـ Hero معاً
    if (dataReady && layout.length > 0 && isHeroReady) {
      // تأخير بسيط 50ms لضمان رسم المتصفح للعناصر قبل سحب اللودر
      setTimeout(() => signalPageReady(), 50); 
    }
  }, [dataReady, layout, heroData, pathname, signalPageReady]);

  return (
    <main className="bg-[#121212] min-h-screen">
      {/* --- 2. محرك العرض الديناميكي (Loop) --- */}
      {layout.map((section, index) => {
        const SectionCategory = DESIGN_REGISTRY[section.category];
        const Component = SectionCategory ? SectionCategory[section.designId] : null;
        
        // لو التصميم مش موجود لسبب ما، نتجاهله عشان الصفحة متضربش
        if (!Component) return null;

        // تحديد البيانات اللي هتتبعت للتصميم 
        // (لو القسم هيرو نبعتله بيانات الهيرو، لو غيره نبعتله بياناته الخاصة اللي جياله من لوحة التحكم)
        const sectionData = section.category === "HERO_SECTION" ? heroData : section.data;

        return (
          <Component 
            key={index} 
            data={sectionData} 
          />
        );
      })}
    </main>
  );
}