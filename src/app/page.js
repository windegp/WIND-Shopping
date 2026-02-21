"use client";
import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
// تأكد إن المسار ده متطابق مع مكان ملف سجل التصميمات عندك
import { DESIGN_REGISTRY } from "@/lib/designRegistry"; 

export default function Home() {
  const [layout, setLayout] = useState([]); 
  const [heroData, setHeroData] = useState({ slides: [], categories: [] });
  const [loading, setLoading] = useState(true);

  // --- 1. جلب البيانات (المحرك الذكي) ---
  useEffect(() => {
    // أ. جلب ترتيب الأقسام والمحتوى (المميز اليوم، وأي قسم هنضيفه مستقبلاً)
    const unsubLayout = onSnapshot(doc(db, "homepage", "layout_config"), (docSnap) => {
      if (docSnap.exists()) {
        setLayout(docSnap.data().sections || []);
      }
      setLoading(false);
    });

    // ب. جلب بيانات قسم الهيرو (لأنه محفوظ في ملف منفصل في الداتابيز)
    const unsubHero = onSnapshot(doc(db, "homepage", "main-hero"), (docSnap) => {
      if (docSnap.exists()) {
        setHeroData(docSnap.data());
      }
    });

    // إغلاق الاتصال بقاعدة البيانات عند خروج العميل من الصفحة
    return () => { 
      unsubLayout(); 
      unsubHero(); 
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#F5C518] font-bold text-xl">
        جاري تحميل WIND...
      </div>
    );
  }

  return (
    <main className="bg-[#121212] min-h-screen">
      {/* --- 2. محرك العرض الديناميكي (Loop) --- */}
      {layout.map((section, index) => {
        // البحث عن التصميم المطلوب في سجل التصميمات
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