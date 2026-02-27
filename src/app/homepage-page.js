"use client";
import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { DESIGN_REGISTRY } from "@/lib/designRegistry"; 

export default function Home() {
  const [layout, setLayout] = useState([]); 
  const [heroData, setHeroData] = useState({ slides: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLayout = onSnapshot(doc(db, "homepage", "layout_config"), (docSnap) => {
      if (docSnap.exists()) {
        setLayout(docSnap.data().sections || []);
      }
      setLoading(false);
    });

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

  if (loading) {
    return (
      // bg-[#121212] → bg-[#f5f5f0]
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center text-[#F5C518] font-bold text-xl">
        جاري تحميل WIND...
      </div>
    );
  }

  return (
    // bg-[#121212] → bg-[#f5f5f0]
    <main className="bg-[#f5f5f0] min-h-screen">
      {layout.map((section, index) => {
        const SectionCategory = DESIGN_REGISTRY[section.category];
        const Component = SectionCategory ? SectionCategory[section.designId] : null;
        if (!Component) return null;
        const sectionData = section.category === "HERO_SECTION" ? heroData : section.data;
        return <Component key={index} data={sectionData} />;
      })}
    </main>
  );
}