"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- خريطة الأقسام الأساسية فقط ---
const SECTION_TYPES = {
  HERO_SECTION: { label: "الهيرو الرئيسي", designId: "MODERN_SLIDER" },
  FEATURED_SECTION: { label: "المميز (Featured Today)", designId: "IMDB_STYLE", hasTitle: true, hasSubTitle: true, hasFeaturedCards: true },
  TOP_TEN_SECTION: { label: "أفضل 10 منتجات", designId: "TOP_TEN_LIST", hasTitle: true, hasFeaturedCards: true, hasViewAllLink: true }
};

export default function HomeManagerPage() {
  // --- 1. التبويب النشط ---
  const [activeTab, setActiveTab] = useState('layout');

  // --- 2. حالات قسم الهيرو والأقسام السفلية ---
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- 3. حالة محرك الترتيب الديناميكي ---
  const [layoutSections, setLayoutSections] = useState([]);

  // --- 4. حالة واجهة المستخدم (الأكورديون) ---
  const [expandedSections, setExpandedSections] = useState({});
  
  // --- 5. الأقسام الديناميكية المتاحة ---
  const [availableCollections, setAvailableCollections] = useState([]);

  // حالات التحميل والحفظ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب جميع البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const colsSnap = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          slug: doc.data().slug
        })));
      } catch (error) { console.error("Error fetching collections:", error); }
    };
    fetchCollections();

    const fetchCurrentData = async () => {
      try {
        const layoutRef = doc(db, "homepage", "layout_config");
        const layoutSnap = await getDoc(layoutRef);
        let currentLayout = [];
        if (layoutSnap.exists()) {
          currentLayout = layoutSnap.data().sections || [];
          setLayoutSections(currentLayout);
        }

        const heroRef = doc(db, "homepage", "main-hero");
        const heroSnap = await getDoc(heroRef);
        if (heroSnap.exists()) {
          setSlides(heroSnap.data().slides || []);
          setCategories(heroSnap.data().categories || []);
        } else {
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
          setCategories([{ title: "", link: "" }]);
        }

        const featRef = doc(db, "homepage", "featured-section");
        const featSnap = await getDoc(featRef);
        if (featSnap.exists() && currentLayout.length === 0) {
          const oldFeatData = featSnap.data();
          setLayoutSections([
            { category: "FEATURED_SECTION", designId: "IMDB_STYLE", data: { title: oldFeatData.title, cards: oldFeatData.cards } }
          ]);
        }

      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentData();
  }, []);

  // ==========================================
  // --- دوال محرك الترتيب والتأسيس الذكي للمحتوى ---
  // ==========================================

  const handleLayoutCategoryChange = (index, newCategory) => {
    const updated = [...layoutSections];
    updated[index].category = newCategory;
    updated[index].designId = SECTION_TYPES[newCategory]?.designId || "";

    const config = SECTION_TYPES[newCategory];
    let initialData = {};

    if (config.hasTitle) initialData.title = config.label || "";
    if (config.hasSubTitle) initialData.subTitle = "";
    if (config.hasFeaturedCards) {
      initialData.cards = [];
      initialData.dataSource = "manual"; // افتراضي يدوي
      initialData.collectionSlug = "";   // فارغ في البداية
    }
    if (config.hasViewAllLink) initialData.viewAllLink = "";

    updated[index].data = initialData;
    setLayoutSections(updated);
  };

  const handleLayoutDataChange = (index, field, value) => {
    const updated = [...layoutSections];
    if (!updated[index].data) updated[index].data = {};
    updated[index].data[field] = value;
    setLayoutSections(updated);
  };

  const addNewSection = () => {
    const defaultCategory = "FEATURED_SECTION";
    setLayoutSections([...layoutSections, {
      category: defaultCategory,
      designId: SECTION_TYPES[defaultCategory].designId,
      data: { title: "المميز اليوم", subTitle: "", cards: [], dataSource: "manual", collectionSlug: "" }
    }]);
    setExpandedSections(prev => ({ ...prev, [layoutSections.length]: true }));
  };

  const removeSection = (index) => {
    setLayoutSections(layoutSections.filter((_, i) => i !== index));
  };

  const moveSection = (index, direction) => {
    const updated = [...layoutSections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < updated.length) {
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      setLayoutSections(updated);

      const newExpanded = { ...expandedSections };
      const temp = newExpanded[index];
      newExpanded[index] = newExpanded[newIndex];
      newExpanded[newIndex] = temp;
      setExpandedSections(newExpanded);
    }
  };

  // --- دوال التحكم في مصفوفات البطاقات ---
  const addArrayItem = (sectionIndex, arrayName, emptyTemplate) => {
    const updated = [...layoutSections];
    if (!updated[sectionIndex].data[arrayName]) updated[sectionIndex].data[arrayName] = [];
    updated[sectionIndex].data[arrayName].push(emptyTemplate);
    setLayoutSections(updated);
  };

  const updateArrayItem = (sectionIndex, arrayName, itemIndex, field, value) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data[arrayName][itemIndex][field] = value;
    setLayoutSections(updated);
  };

  const removeArrayItem = (sectionIndex, arrayName, itemIndex) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data[arrayName].splice(itemIndex, 1);
    setLayoutSections(updated);
  };

  // --- دوال التحكم في البطاقات الفرعية ---
  const addSubCard = (sectionIndex, cardIndex) => {
    const updated = [...layoutSections];
    if (!updated[sectionIndex].data.cards[cardIndex].subCards) {
      updated[sectionIndex].data.cards[cardIndex].subCards = [];
    }
    updated[sectionIndex].data.cards[cardIndex].subCards.push({ image: "", mainTitle: "", linkText: "", linkUrl: "" });
    setLayoutSections(updated);
  };

  const updateSubCard = (sectionIndex, cardIndex, subIndex, field, value) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data.cards[cardIndex].subCards[subIndex][field] = value;
    setLayoutSections(updated);
  };

  const removeSubCard = (sectionIndex, cardIndex, subIndex) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data.cards[cardIndex].subCards.splice(subIndex, 1);
    setLayoutSections(updated);
  };

  const toggleAccordion = (index) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // ==========================================
  // --- دوال قسم الهيرو ---
  // ==========================================
  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index][field] = value;
    setSlides(updatedSlides);
  };
  const addNewSlide = () => {
    setSlides([...slides, { image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
  };
  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };
  const addNewCategory = () => {
    setCategories([...categories, { title: "", link: "" }]);
  };
  const removeCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  // ==========================================
  // --- دالة الحفظ الشاملة ---
  // ==========================================
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "homepage", "layout_config"), { sections: layoutSections });
      const dataToSaveHero = { slides: slides, categories: categories };
      await setDoc(doc(db, "homepage", "main-hero"), dataToSaveHero);

      alert("تم حفظ التحديثات بنجاح! الموقع سيعرض الأقسام والتعديلات فوراً.");
    } catch (error) {
      console.error("حدث خطأ أثناء الحفظ: ", error);
      alert("عذراً، حدث خطأ أثناء الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-10 text-center text-[#F5C518] font-bold text-xl bg-[#121212] min-h-screen">جاري تحميل لوحة تحكم WIND...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 font-sans relative">
      <div className="max-w-6xl mx-auto bg-[#1a1a1a] rounded-xl shadow-2xl text-white border border-[#333] overflow-hidden" dir="rtl">

        {/* هيدر اللوحة */}
        <div className="p-6 border-b border-[#333] flex flex-col md:flex-row justify-between items-center sticky top-0 bg-[#1a1a1a] z-40">
          <div>
            <h1 className="text-3xl font-black mb-1 text-[#F5C518] tracking-tight">إدارة واجهة WIND</h1>
            <p className="text-gray-400 text-xs">تحكم شامل في ترتيب ومحتوى الصفحة الرئيسية</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`mt-4 md:mt-0 font-black py-3 px-10 rounded shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all duration-300 ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#F5C518] hover:bg-[#ffdb4d] text-black hover:scale-105'}`}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}
          </button>
        </div>

        {/* أزرار التبويبات */}
        <div className="flex flex-wrap bg-[#121212] border-b border-[#333]">
          <button onClick={() => setActiveTab('layout')} className={`flex-1 min-w-[150px] py-4 font-bold transition-all text-sm md:text-base ${activeTab === 'layout' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>1. هيكلة وترتيب الصفحة</button>
          <button onClick={() => setActiveTab('hero')} className={`flex-1 min-w-[150px] py-4 font-bold transition-all text-sm md:text-base ${activeTab === 'hero' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>2. محتوى الهيرو</button>
          <button onClick={() => setActiveTab('featured')} className={`flex-1 min-w-[150px] py-4 font-bold transition-all text-sm md:text-base ${activeTab === 'featured' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>3. محتوى الأقسام المُضافة</button>
        </div>

        <div className="p-4 md:p-8">

          {/* ========================================= */}
          {/* === التبويب الأول: محرك الترتيب الذكي === */}
          {/* ========================================= */}
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <h2 className="text-2xl font-black">هيكلة وترتيب الصفحة (Layout)</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">أضف الأقسام ورتبها. التصميم (Design ID) سيتم ضبطه تلقائياً حسب نوع القسم.</p>

              <div className="space-y-4">
                {layoutSections.map((section, index) => (
                  <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-[#242424] border border-[#444] rounded-xl group relative hover:border-[#F5C518]/50 transition-colors shadow-sm">

                    <div className="flex md:flex-col gap-2 w-full md:w-auto justify-center">
                      <button onClick={() => moveSection(index, 'up')} className="bg-[#121212] p-2 rounded text-gray-500 hover:text-[#F5C518] transition-colors">▲</button>
                      <button onClick={() => moveSection(index, 'down')} className="bg-[#121212] p-2 rounded text-gray-500 hover:text-[#F5C518] transition-colors">▼</button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div>
                        <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">نوع القسم</label>
                        <select
                          value={section.category}
                          onChange={(e) => handleLayoutCategoryChange(index, e.target.value)}
                          className="w-full bg-[#121212] border border-[#555] p-3 rounded text-sm text-white focus:border-[#F5C518] outline-none"
                        >
                          {Object.keys(SECTION_TYPES).map(key => (
                            <option key={key} value={key}>{SECTION_TYPES[key].label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1 font-bold">التصميم المرتبط (تلقائي)</label>
                        <input
                          type="text" value={section.designId} readOnly
                          className="w-full bg-[#121212]/50 border border-[#333] p-3 rounded text-sm text-gray-500 cursor-not-allowed" dir="ltr"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeSection(index)}
                      className="bg-red-900/20 text-red-500 hover:bg-red-900/50 p-3 rounded-lg border border-red-900/50 transition-colors w-full md:w-auto font-bold"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addNewSection}
                className="w-full py-4 border-2 border-dashed border-[#555] text-gray-400 hover:border-[#F5C518] hover:text-[#F5C518] rounded-xl transition-all font-bold bg-[#1a1a1a]"
              >
                + إضافة قسم جديد للصفحة
              </button>
            </div>
          )}

          {/* ========================================= */}
          {/* === التبويب الثاني: الهيرو === */}
          {/* ========================================= */}
          {activeTab === 'hero' && (
            <div className="space-y-12 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <h2 className="text-2xl font-black">إدارة شرائح العرض (Hero Slides)</h2>
              </div>

              <div className="space-y-8">
                {slides.map((slide, index) => (
                  <div key={index} className="p-6 border border-[#444] rounded-xl bg-[#242424] relative shadow-md">
                    <div className="flex justify-between items-center mb-5 border-b border-[#444] pb-2">
                      <h3 className="font-semibold text-lg text-[#F5C518]">الشريحة رقم {index + 1}</h3>
                      <button onClick={() => removeSlide(index)} className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors">حذف الشريحة</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">رابط الصورة الخلفية الرئيسية</label>
                        <input type="text" value={slide.image} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">الوسم المميّز (شريط أصفر)</label>
                        <input type="text" value={slide.tag} onChange={(e) => handleSlideChange(index, 'tag', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">العنوان الرئيسي</label>
                        <input type="text" value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]" />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">وصف التصميم</label>
                        <textarea value={slide.desc} onChange={(e) => handleSlideChange(index, 'desc', e.target.value)} rows="2" className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white resize-none focus:border-[#F5C518]" />
                      </div>
                      <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">رابط البوستر المصغر</label>
                          <input type="text" value={slide.thumbnail} onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">رابط المنتج المخصص</label>
                          <input type="text" value={slide.productLink} onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">نص الزر</label>
                          <input type="text" value={slide.buttonText || ""} onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addNewSlide} className="mt-6 w-full py-4 border-2 border-dashed border-[#555] text-gray-400 font-bold rounded-xl hover:border-[#F5C518] hover:text-[#F5C518] bg-[#1a1a1a] transition-all">+ إضافة شريحة عرض جديدة</button>
              </div>

              {/* شريط الأقسام السفلية */}
              <div className="pt-12 border-t border-[#444]">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>إدارة أزرار تصفح الأقسام</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category, index) => (
                    <div key={index} className="flex gap-4 items-center p-3 border border-[#444] rounded-lg bg-[#242424]">
                      <input type="text" value={category.title} onChange={(e) => handleCategoryChange(index, 'title', e.target.value)} placeholder="اسم القسم" className="w-1/3 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" />
                      <input type="text" value={category.link} onChange={(e) => handleCategoryChange(index, 'link', e.target.value)} placeholder="الرابط" className="flex-1 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" dir="ltr" />
                      <button onClick={() => removeCategory(index)} className="text-red-500 hover:text-red-400 p-2 font-bold">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addNewCategory} className="mt-4 px-6 py-3 bg-[#242424] border border-[#555] text-[#F5C518] font-bold rounded-xl hover:border-[#F5C518] hover:text-white transition-all">+ إضافة قسم جديد</button>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* === التبويب الثالث: محرر الأقسام === */}
          {/* ========================================= */}
          {activeTab === 'featured' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-8 border-b border-[#333] pb-4">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <div>
                  <h2 className="text-2xl font-black">محتوى الأقسام الإضافية</h2>
                  <p className="text-gray-400 text-sm mt-1">اضغط على أي قسم لفتحه وتعديل محتواه.</p>
                </div>
              </div>

              {layoutSections.map((section, sectionIndex) => {
                const config = SECTION_TYPES[section.category];
                if (section.category === 'HERO_SECTION') return null;

                const isExpanded = expandedSections[sectionIndex];

                return (
                  <div key={sectionIndex} className="bg-[#1a1a1a] border border-[#444] rounded-xl shadow-md transition-all overflow-hidden mb-4">

                    {/* رأس الأكورديون */}
                    <div
                      onClick={() => toggleAccordion(sectionIndex)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-[#242424] transition-colors bg-[#222] border-b border-transparent data-[expanded=true]:border-[#444]"
                      data-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-4">
                        <span className="bg-[#F5C518] text-black font-black text-xs px-3 py-1.5 rounded-sm uppercase tracking-wider">
                          {config?.label}
                        </span>
                        <span className="font-bold text-white text-lg">
                          {section.data?.title || "بدون عنوان"}
                        </span>
                      </div>
                      <div className={`text-[#F5C518] font-black text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>

                    {/* المحتوى عند فتح الأكورديون */}
                    {isExpanded && (
                      <div className="p-6 bg-[#242424] animate-[fadeIn_0.2s_ease-out]">

                        {/* 1. العنوان الرئيسي والفرعي */}
                        {config?.hasTitle && (
                          <div className="mb-6 bg-[#121212] p-4 rounded-lg border border-[#333]">
                            <div className="mb-4">
                              <label className="block text-xs font-bold text-[#F5C518] mb-2">العنوان الرئيسي للقسم</label>
                              <input
                                type="text" value={section.data?.title || ""}
                                onChange={(e) => handleLayoutDataChange(sectionIndex, 'title', e.target.value)}
                                className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white font-bold focus:border-[#F5C518] outline-none"
                              />
                            </div>
                            {config?.hasSubTitle && (
                              <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">العنوان الفرعي (اختياري)</label>
                                <input
                                  type="text" value={section.data?.subTitle || ""}
                                  onChange={(e) => handleLayoutDataChange(sectionIndex, 'subTitle', e.target.value)}
                                  className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white focus:border-[#F5C518] outline-none"
                                />
                              </div>
                            )}

                            {/* إضافة رابط عرض الكل للقسم بالكامل */}
<div className="mt-4 pt-4 border-t border-[#333]">
  <label className="block text-xs font-bold text-[#F5C518] mb-2">رابط زر "عرض الكل" (صفحة المجموعة)</label>
  <input 
    type="text" 
    value={section.data?.linkUrl || ""} 
    onChange={(e) => handleLayoutDataChange(sectionIndex, 'linkUrl', e.target.value)} 
    placeholder="مثال: /collections/shoes"
    className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white focus:border-[#F5C518] outline-none"
    dir="ltr"
  />
</div>

                            {/* ✅ رابط "عرض الكل" - خاص بـ TOP_TEN_SECTION فقط */}
                            {section.category === 'TOP_TEN_SECTION' && (
                              <div className="mt-4">
                                <label className="block text-xs font-bold text-[#F5C518] mb-2">رابط زرار "عرض الكل" (صفحة المجموعة)</label>
                                <input
                                  type="text"
                                  value={section.data?.viewAllLink || ""}
                                  onChange={(e) => handleLayoutDataChange(sectionIndex, 'viewAllLink', e.target.value)}
                                  className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white focus:border-[#F5C518] outline-none"
                                  dir="ltr"
                                  placeholder="مثال: /collections/top-ten"
                                />
                              </div>
                            )}
                          </div>
                        )}

                       {/* 2. محرر البطاقات أو القسم الديناميكي */}
                        {config?.hasFeaturedCards && (
                          <div className="border-t border-[#444] pt-4 mt-4">
                            
                            {/* --- أزرار التبديل بين اليدوي والديناميكي --- */}
                            <div className="flex justify-between items-center mb-6 bg-[#121212] p-2 rounded-xl border border-[#333]">
                              <h4 className="text-[#F5C518] font-bold text-sm px-2">مصدر عرض المنتجات:</h4>
                              <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-[#444]">
                                <button
                                  onClick={() => handleLayoutDataChange(sectionIndex, 'dataSource', 'manual')}
                                  className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${(!section.data?.dataSource || section.data.dataSource === 'manual') ? 'bg-[#F5C518] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >إدخال يدوي</button>
                                <button
                                  onClick={() => handleLayoutDataChange(sectionIndex, 'dataSource', 'dynamic')}
                                  className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${section.data?.dataSource === 'dynamic' ? 'bg-[#F5C518] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >سحب ديناميكي (تلقائي)</button>
                              </div>
                            </div>

                            {/* --- الحالة الأولى: ديناميكي (تلقائي من الأقسام) --- */}
                            {section.data?.dataSource === 'dynamic' ? (
                              <div className="p-8 bg-[#1a1a1a] border border-[#F5C518]/30 rounded-xl mb-4 text-center shadow-inner">
                                <label className="block text-sm font-bold text-[#F5C518] mb-4">اختر القسم (Collection) ليتم سحب أحدث منتجاته تلقائياً</label>
                                <select
                                  value={section.data?.collectionSlug || ""}
                                  onChange={(e) => handleLayoutDataChange(sectionIndex, 'collectionSlug', e.target.value)}
                                  className="w-full max-w-md mx-auto p-4 border border-[#444] rounded-lg bg-[#121212] text-white focus:border-[#F5C518] outline-none font-bold text-center block"
                                >
                                  <option value="">-- اضغط هنا لاختيار القسم --</option>
                                  {availableCollections.map(cat => (
                                    <option key={cat.id} value={cat.slug}>{cat.name} (Slug: {cat.slug})</option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-lg mx-auto">
                                  * سيقوم الموقع تلقائياً بجلب المنتجات المرتبطة بهذا القسم وعرضها للعملاء بتصميم <span className="text-[#F5C518]">{config.label}</span> وبدون الحاجة لإدخال أي بيانات يدوية.
                                </p>
                              </div>
                            ) : (
                            <div>
                              {/* --- الحالة الثانية: الإدخال اليدوي (الكود القديم بتاعك كامل) --- */}
                              <div className="space-y-6">
                                {(section.data?.cards || []).map((card, cardIndex) => (
                                <div key={cardIndex} className="p-5 border border-[#555] rounded-xl bg-[#1a1a1a] relative shadow-inner">
                                  <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                                    <span className="font-bold text-gray-300 text-sm">البطاقة الرئيسية #{cardIndex + 1}</span>
                                    <button onClick={() => removeArrayItem(sectionIndex, 'cards', cardIndex)} className="text-red-400 hover:text-red-300 font-bold text-xs">حذف البطاقة بالكامل</button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* رابط الصورة - مشترك */}
                                    <div className="col-span-1 md:col-span-2 flex gap-2">
                                      <div className="flex-1">
                                        <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">رابط الصورة (Image URL)</label>
                                        <input type="text" value={card.image} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'image', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr" />
                                      </div>
                                    </div>

                                    {/* Badge Type - خاص بـ FEATURED فقط */}
                                    {section.category !== 'TOP_TEN_SECTION' && (
                                      <div>
                                        <label className="block text-[11px] text-gray-400 mb-1 font-bold">نوع الشارة (Badge Type)</label>
                                        <select value={card.badgeType} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'badgeType', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none">
                                          <option value="none">بدون شارة</option>
                                          <option value="list">قائمة (List)</option>
                                          <option value="photos">صور (Photos)</option>
                                        </select>
                                      </div>
                                    )}

                                    {/* العنوان - مشترك */}
                                    <div>
                                      <label className="block text-[11px] text-gray-400 mb-1 font-bold">العنوان أسفل الصورة</label>
                                      <input type="text" value={card.mainTitle} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'mainTitle', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                    </div>
                                    <div>
  <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">رابط تفاصيل المنتج (داخل الكارت)</label>
  <input 
    type="text" 
    value={card.linkUrl || ""} 
    onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkUrl', e.target.value)} 
    placeholder="ألصق رابط المنتج هنا"
    className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" 
    dir="ltr" 
  />
</div>

                                    {/* نص الرابط الملوّن - خاص بـ FEATURED فقط */}
                                    {section.category !== 'TOP_TEN_SECTION' && (
                                      <div>
                                        <label className="block text-[11px] text-gray-400 mb-1 font-bold">نص الرابط الملوّن</label>
                                        <input type="text" value={card.linkText} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkText', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                      </div>
                                    )}

                                    {/* رابط التوجيه - مشترك (هو رابط المنتج لزرار "عرض التفاصيل" في TOP_TEN) */}
                                    <div>
                                      <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">
                                        {section.category === 'TOP_TEN_SECTION' ? 'رابط المنتج (زرار "عرض التفاصيل")' : 'رابط التوجيه (URL)'}
                                      </label>
                                      <input type="text" value={card.linkUrl} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkUrl', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr" placeholder="اكتب الرابط أو ألصقه هنا" />
                                    </div>

                                    {/* ✅ خانات خاصة بـ TOP_TEN_SECTION */}
                                    {section.category === 'TOP_TEN_SECTION' && (
                                      <>
                                        <div>
                                          <label className="block text-[11px] text-gray-400 mb-1 font-bold">السعر</label>
                                          <input type="text" value={card.price || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'price', e.target.value)} placeholder="مثال: 1500 ج.م" className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-400 mb-1 font-bold">التقييم</label>
                                          <input type="text" value={card.rating || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'rating', e.target.value)} placeholder="مثال: 4.8" className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-400 mb-1 font-bold">عدد المراجعات</label>
                                          <input type="text" value={card.reviewsCount || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'reviewsCount', e.target.value)} placeholder="مثال: 120 مراجعة" className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-400 mb-1 font-bold">تصنيف المنتج (الفئة)</label>
                                          <input type="text" value={card.category || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'category', e.target.value)} placeholder="مثال: أجهزة منزلية" className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" />
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* البطاقات الفرعية - خاصة بـ FEATURED فقط */}
                                  {section.category !== 'TOP_TEN_SECTION' && (
                                    <div className="mt-6 border-t border-[#333] pt-4">
                                      <h5 className="text-[#F5C518] font-bold text-sm mb-3">البطاقات الفرعية المرتبطة بهذه البطاقة:</h5>
                                      <div className="space-y-4">
                                        {(card.subCards || []).map((subCard, subIndex) => (
                                          <div key={subIndex} className="p-4 border border-[#444] rounded-lg bg-[#222] relative">
                                            <div className="flex justify-between items-center mb-3">
                                              <span className="font-bold text-gray-400 text-xs">بطاقة فرعية #{subIndex + 1}</span>
                                              <button onClick={() => removeSubCard(sectionIndex, cardIndex, subIndex)} className="text-red-400 hover:text-red-300 font-bold text-xs">حذف البطاقة الفرعية</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div className="col-span-1 md:col-span-2">
                                                <label className="block text-[10px] text-gray-400 mb-1 font-bold">رابط الصورة</label>
                                                <input type="text" value={subCard.image} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'image', e.target.value)} className="w-full p-2 border border-[#444] rounded bg-[#121212] text-white text-xs focus:border-[#F5C518] outline-none" dir="ltr" />
                                              </div>
                                              <div>
                                                <label className="block text-[10px] text-gray-400 mb-1 font-bold">العنوان أسفل الصورة</label>
                                                <input type="text" value={subCard.mainTitle} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'mainTitle', e.target.value)} className="w-full p-2 border border-[#444] rounded bg-[#121212] text-white text-xs focus:border-[#F5C518] outline-none" />
                                              </div>
                                              <div>
                                                <label className="block text-[10px] text-gray-400 mb-1 font-bold">نص الرابط الملوّن</label>
                                                <input type="text" value={subCard.linkText} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'linkText', e.target.value)} className="w-full p-2 border border-[#444] rounded bg-[#121212] text-white text-xs focus:border-[#F5C518] outline-none" />
                                              </div>
                                              <div className="col-span-1 md:col-span-2">
                                                <label className="block text-[10px] text-gray-400 mb-1 font-bold">رابط التوجيه (URL)</label>
                                                <input type="text" value={subCard.linkUrl} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'linkUrl', e.target.value)} className="w-full p-2 border border-[#444] rounded bg-[#121212] text-white text-xs focus:border-[#F5C518] outline-none" dir="ltr" />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <button onClick={() => addSubCard(sectionIndex, cardIndex)} className="mt-3 w-full py-2 border border-dashed border-gray-500 text-gray-400 font-bold text-xs rounded-lg hover:border-white hover:text-white transition-all">+ إضافة بطاقة فرعية</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* ✅ زرار إضافة بطاقة جديدة مع template مختلف حسب نوع القسم */}
                         <button
                              onClick={() => addArrayItem(sectionIndex, 'cards',
                                section.category === 'TOP_TEN_SECTION'
                                  ? { image: "", mainTitle: "", linkUrl: "", price: "", rating: "", reviewsCount: "", category: "" }
                                  : { image: "", badgeType: "none", mainTitle: "", linkText: "", linkUrl: "", subCards: [] }
                              )}
                              className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-xl hover:bg-[#F5C518] hover:text-black transition-all"
                            >
                              + إضافة بطاقة جديدة
                            </button>
                            </div>
                          )} {/* نهاية شرط التبديل بين اليدوي والديناميكي */}
                          </div>
                        )}

                      </div>
                    )}

              {/* رسالة توضيحية */}
              {layoutSections.length <= 1 && (
                <div className="p-10 border border-[#444] rounded-xl text-center text-gray-400 bg-[#1a1a1a]">
                  لا توجد أقسام حالياً. أضف قسم (المميز اليوم) من التبويب الأول للبدء في تعديله.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}