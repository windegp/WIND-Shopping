"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

// --- خريطة الأقسام الشاملة (كل قسم له احتياجاته الخاصة) ---
const SECTION_TYPES = {
  HERO_SECTION: { label: "الهيرو الرئيسي", designId: "MODERN_SLIDER" },
  FEATURED_SECTION: { label: "المميز (Featured Today)", designId: "IMDB_STYLE", hasTitle: true, hasFeaturedCards: true },
  PRODUCTS_MARQUEE: { label: "شريط المنتجات (Marquee)", designId: "INFINITE_SCROLL", hasTitle: true, hasSubtitle: true, hasProducts: true, hasTopLink: true },
  BEST_SELLERS: { label: "الأكثر مبيعاً", designId: "GRID_WITH_FEATURED", hasTitle: true, hasProducts: true, hasTopLink: true },
  TRUST_BAR: { label: "شريط الثقة والإحصائيات", designId: "STATS_STRIP", isTrustBar: true },
  COLLECTIONS: { label: "مجموعات مميزة", designId: "MAIN_GRID", hasTitle: true, hasCategories: true },
  REVIEWS: { label: "آراء العملاء", designId: "MARQUEE_REVIEWS", hasTitle: true, hasReviews: true, hasTopLink: true },
  MAGAZINE: { label: "مجلة WIND", designId: "BENTO_STYLE", hasTitle: true, hasSubtitle: true, hasArticles: true, hasTopLink: true },
  STORY: { label: "قصة WIND", designId: "KEN_BURNS_FULL", isStory: true },
  CATEGORIES_GRID: { label: "تسوق بالفئة", designId: "SPLIT_GRID", hasTitle: true, hasCategories: true },
  DISCOUNTS: { label: "تخفيضات", designId: "PROMO_GRID", hasTitle: true, hasProducts: true, hasBottomBtn: true }
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

  // حالات التحميل والحفظ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب جميع البيانات عند فتح الصفحة
  useEffect(() => {
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
    if (config.hasSubtitle) initialData.subTitle = "";
    if (config.hasTopLink) initialData.topLink = { text: "عرض الكل", url: "#" };
    if (config.hasBottomBtn) initialData.bottomBtn = { text: "تصفح المجموعة", url: "#" };
    
    if (config.hasFeaturedCards) initialData.cards = [];
    if (config.hasProducts) initialData.products = [];
    if (config.hasCategories) initialData.categories = [];
    if (config.hasArticles) initialData.articles = [];
    if (config.hasReviews) initialData.reviews = [];
    if (config.isStory) initialData.story = { bgImage: "", title: "قصة WIND", desc: "", btnText: "اكتشف المزيد", btnUrl: "#" };
    if (config.isTrustBar) initialData.trustStats = [
      { value: "4.9/5", label: "تقييم العملاء" },
      { value: "+10k", label: "قطعة بيعت" },
      { value: "100%", label: "ضمان الجودة" }
    ];

    updated[index].data = initialData;
    setLayoutSections(updated);
  };

  const handleLayoutDataChange = (index, field, value) => {
    const updated = [...layoutSections];
    if (!updated[index].data) updated[index].data = {};
    updated[index].data[field] = value;
    setLayoutSections(updated);
  };

  const handleNestedObjectChange = (sectionIndex, objectName, field, value) => {
    const updated = [...layoutSections];
    if (!updated[sectionIndex].data[objectName]) updated[sectionIndex].data[objectName] = {};
    updated[sectionIndex].data[objectName][field] = value;
    setLayoutSections(updated);
  };

  const addNewSection = () => {
    const defaultCategory = "FEATURED_SECTION";
    setLayoutSections([...layoutSections, { 
      category: defaultCategory, 
      designId: SECTION_TYPES[defaultCategory].designId, 
      data: { title: "المميز اليوم", cards: [] } 
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
      
      const newExpanded = {...expandedSections};
      const temp = newExpanded[index];
      newExpanded[index] = newExpanded[newIndex];
      newExpanded[newIndex] = temp;
      setExpandedSections(newExpanded);
    }
  };

  // --- دوال التحكم في المصفوفات (البطاقات، المنتجات، الآراء، الخ) ---
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
          {/* === التبويب الثاني: الهيرو (كودك الأصلي) === */}
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
                        <input type="text" value={slide.image} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">الوسم المميّز (شريط أصفر)</label>
                        <input type="text" value={slide.tag} onChange={(e) => handleSlideChange(index, 'tag', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">العنوان الرئيسي</label>
                        <input type="text" value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white focus:border-[#F5C518]"/>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">وصف التصميم</label>
                        <textarea value={slide.desc} onChange={(e) => handleSlideChange(index, 'desc', e.target.value)} rows="2" className="w-full p-3 border border-[#555] rounded-md outline-none bg-[#121212] text-white resize-none focus:border-[#F5C518]"/>
                      </div>
                      <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">رابط البوستر المصغر</label>
                          <input type="text" value={slide.thumbnail} onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none"/>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">رابط المنتج المخصص</label>
                          <input type="text" value={slide.productLink} onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none"/>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#F5C518] mb-1.5">نص الزر</label>
                          <input type="text" value={slide.buttonText || ""} onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)} className="w-full p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none"/>
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
                      <input type="text" value={category.title} onChange={(e) => handleCategoryChange(index, 'title', e.target.value)} placeholder="اسم القسم" className="w-1/3 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none"/>
                      <input type="text" value={category.link} onChange={(e) => handleCategoryChange(index, 'link', e.target.value)} placeholder="الرابط" className="flex-1 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" dir="ltr"/>
                      <button onClick={() => removeCategory(index)} className="text-red-500 hover:text-red-400 p-2 font-bold">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addNewCategory} className="mt-4 px-6 py-3 bg-[#242424] border border-[#555] text-[#F5C518] font-bold rounded-xl hover:border-[#F5C518] hover:text-white transition-all">+ إضافة قسم جديد</button>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* === التبويب الثالث: محرر الأقسام بالأكورديون الشامل === */}
          {/* ========================================= */}
          {activeTab === 'featured' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-8 border-b border-[#333] pb-4">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <div>
                  <h2 className="text-2xl font-black">محتوى الأقسام الإضافية</h2>
                  <p className="text-gray-400 text-sm mt-1">اضغط على أي قسم لفتحه وتعديل محتواه بالكامل حسب نوعه واحتياجاته.</p>
                </div>
              </div>

              {layoutSections.map((section, sectionIndex) => {
                const config = SECTION_TYPES[section.category];
                if (section.category === 'HERO_SECTION') return null; // الهيرو له تبويب خاص

                const isExpanded = expandedSections[sectionIndex];

                return (
                  <div key={sectionIndex} className="bg-[#1a1a1a] border border-[#444] rounded-xl shadow-md transition-all overflow-hidden mb-4">
                    
                    {/* رأس الأكورديون (الزر المغلق) */}
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
                           {section.data?.title || (config?.isStory ? "محتوى القصة" : (config?.isTrustBar ? "محتوى الثقة" : "بدون عنوان"))}
                         </span>
                      </div>
                      <div className={`text-[#F5C518] font-black text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    
                    {/* المحتوى المختفي (المحرر الشامل يظهر هنا) */}
                    {isExpanded && (
                      <div className="p-6 bg-[#242424] animate-[fadeIn_0.2s_ease-out]">
                        
                        {/* 1. تعديل العناوين الرئيسية (إذا كان القسم يدعمها) */}
                        {config?.hasTitle && (
                          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#121212] p-4 rounded-lg border border-[#333]">
                            <div>
                              <label className="block text-xs font-bold text-[#F5C518] mb-2">العنوان الرئيسي للقسم</label>
                              <input 
                                type="text" value={section.data?.title || ""} 
                                onChange={(e) => handleLayoutDataChange(sectionIndex, 'title', e.target.value)} 
                                className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white font-bold focus:border-[#F5C518] outline-none"
                              />
                            </div>
                            {config?.hasSubtitle && (
                              <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">العنوان الفرعي للقسم</label>
                                <input 
                                  type="text" value={section.data?.subTitle || ""} 
                                  onChange={(e) => handleLayoutDataChange(sectionIndex, 'subTitle', e.target.value)} 
                                  className="w-full p-3 border border-[#555] rounded bg-[#1a1a1a] text-white focus:border-[#F5C518] outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. الروابط والأزرار الجانبية والسفلية */}
                        {(config?.hasTopLink || config?.hasBottomBtn) && (
                          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#121212] p-4 rounded-lg border border-[#333]">
                            {config?.hasTopLink && (
                              <div className="border border-[#444] p-3 rounded bg-[#1a1a1a]">
                                <label className="block text-[11px] font-bold text-gray-400 mb-2">رابط أعلى القسم (مثال: عرض الكل)</label>
                                <div className="flex gap-2">
                                  <input type="text" placeholder="النص" value={section.data?.topLink?.text || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'topLink', 'text', e.target.value)} className="w-1/3 p-2 bg-[#121212] border border-[#555] rounded text-sm text-white outline-none"/>
                                  <input type="text" placeholder="الرابط" value={section.data?.topLink?.url || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'topLink', 'url', e.target.value)} className="w-2/3 p-2 bg-[#121212] border border-[#555] rounded text-sm text-white outline-none" dir="ltr"/>
                                </div>
                              </div>
                            )}
                            {config?.hasBottomBtn && (
                              <div className="border border-[#444] p-3 rounded bg-[#1a1a1a]">
                                <label className="block text-[11px] font-bold text-gray-400 mb-2">زر أسفل القسم (مثال: تصفح المجموعة)</label>
                                <div className="flex gap-2">
                                  <input type="text" placeholder="النص" value={section.data?.bottomBtn?.text || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'bottomBtn', 'text', e.target.value)} className="w-1/3 p-2 bg-[#121212] border border-[#555] rounded text-sm text-white outline-none"/>
                                  <input type="text" placeholder="الرابط" value={section.data?.bottomBtn?.url || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'bottomBtn', 'url', e.target.value)} className="w-2/3 p-2 bg-[#121212] border border-[#555] rounded text-sm text-white outline-none" dir="ltr"/>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* 3. المحررات المخصصة لكل نوع محتوى */}
                        {/* ========================================================= */}

                        {/* أ. محرر القصة (Story) */}
                        {config?.isStory && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">تفاصيل القصة:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1a1a1a] p-5 rounded-lg border border-[#444]">
                               <div className="col-span-1 md:col-span-2">
                                 <label className="block text-[11px] text-gray-400 mb-1 font-bold">الصورة الخلفية (Background URL)</label>
                                 <input type="text" value={section.data?.story?.bgImage || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'story', 'bgImage', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr"/>
                               </div>
                               <div>
                                 <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">العنوان العريض للقصة</label>
                                 <input type="text" value={section.data?.story?.title || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'story', 'title', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                               </div>
                               <div>
                                 <label className="block text-[11px] text-gray-400 mb-1 font-bold">نص الزرار</label>
                                 <input type="text" value={section.data?.story?.btnText || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'story', 'btnText', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                               </div>
                               <div className="col-span-1 md:col-span-2">
                                 <label className="block text-[11px] text-gray-400 mb-1 font-bold">رابط الزرار (URL)</label>
                                 <input type="text" value={section.data?.story?.btnUrl || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'story', 'btnUrl', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr"/>
                               </div>
                               <div className="col-span-1 md:col-span-2">
                                 <label className="block text-[11px] text-gray-400 mb-1 font-bold">الوصف أو الاقتباس</label>
                                 <textarea value={section.data?.story?.desc || ""} onChange={(e) => handleNestedObjectChange(sectionIndex, 'story', 'desc', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none resize-none" rows="2"/>
                               </div>
                            </div>
                          </div>
                        )}

                        {/* ب. محرر شريط الثقة (Trust Bar) */}
                        {config?.isTrustBar && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">إحصائيات الثقة:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {(section.data?.trustStats || []).map((stat, i) => (
                                <div key={i} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#444] shadow-inner">
                                   <label className="block text-[11px] text-gray-400 mb-1 font-bold">الإحصائية رقم {i+1}</label>
                                   <input type="text" placeholder="الرقم (مثال: +10k)" value={stat.value} onChange={(e) => updateArrayItem(sectionIndex, 'trustStats', i, 'value', e.target.value)} className="w-full p-2 mb-2 bg-[#121212] border border-[#555] rounded text-white text-sm text-center font-bold outline-none"/>
                                   <input type="text" placeholder="الوصف (مثال: عميل سعيد)" value={stat.label} onChange={(e) => updateArrayItem(sectionIndex, 'trustStats', i, 'label', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-gray-400 text-xs text-center outline-none"/>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ج. محرر آراء العملاء (Reviews) */}
                        {config?.hasReviews && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">آراء وتجارب العملاء:</h4>
                            <div className="space-y-4">
                              {(section.data?.reviews || []).map((rev, i) => (
                                <div key={i} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#444] relative shadow-inner">
                                  <button onClick={() => removeArrayItem(sectionIndex, 'reviews', i)} className="absolute top-3 left-4 text-red-500 hover:text-red-400 font-bold text-xs">حذف</button>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="col-span-1 md:col-span-3 flex gap-3">
                                      <div className="flex-1">
                                        <label className="block text-[10px] text-gray-400 mb-1">اسم العميل</label>
                                        <input type="text" value={rev.userName} onChange={(e) => updateArrayItem(sectionIndex, 'reviews', i, 'userName', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">التقييم (من 5)</label>
                                        <input type="number" min="1" max="5" value={rev.rating} onChange={(e) => updateArrayItem(sectionIndex, 'reviews', i, 'rating', Number(e.target.value))} className="w-20 p-2 bg-[#121212] border border-[#555] rounded text-[#F5C518] font-bold text-sm outline-none text-center"/>
                                      </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                      <label className="block text-[10px] text-gray-400 mb-1">رابط صورة العميل (اختياري)</label>
                                      <input type="text" value={rev.userImage} onChange={(e) => updateArrayItem(sectionIndex, 'reviews', i, 'userImage', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                      <label className="block text-[10px] text-[#F5C518] mb-1">التعليق</label>
                                      <textarea value={rev.userComment} onChange={(e) => updateArrayItem(sectionIndex, 'reviews', i, 'userComment', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none resize-none" rows="2"/>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addArrayItem(sectionIndex, 'reviews', {userName:'', userImage:'', rating:5, userComment:''})} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة تقييم جديد</button>
                          </div>
                        )}

                        {/* د. محرر المنتجات (Products) - للأكثر مبيعاً، شريط المنتجات، التخفيضات */}
                        {config?.hasProducts && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">المنتجات المرتبطة بهذا القسم:</h4>
                            <div className="space-y-4">
                              {(section.data?.products || []).map((prod, i) => (
                                <div key={i} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#444] relative shadow-inner">
                                  <button onClick={() => removeArrayItem(sectionIndex, 'products', i)} className="absolute top-3 left-4 text-red-500 hover:text-red-400 font-bold text-xs">حذف</button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="col-span-1 md:col-span-2">
                                      <label className="block text-[10px] text-[#F5C518] mb-1">رابط صورة المنتج</label>
                                      <input type="text" value={prod.image || ""} onChange={(e) => updateArrayItem(sectionIndex, 'products', i, 'image', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-1">اسم المنتج</label>
                                      <input type="text" value={prod.title || ""} onChange={(e) => updateArrayItem(sectionIndex, 'products', i, 'title', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className="block text-[10px] text-gray-400 mb-1">السعر (اختياري)</label>
                                        <input type="text" value={prod.price || ""} onChange={(e) => updateArrayItem(sectionIndex, 'products', i, 'price', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                      </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                      <label className="block text-[10px] text-gray-400 mb-1">رابط صفحة المنتج (URL)</label>
                                      <input type="text" value={prod.url || ""} onChange={(e) => updateArrayItem(sectionIndex, 'products', i, 'url', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addArrayItem(sectionIndex, 'products', {image:'', title:'', price:'', url:''})} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة منتج</button>
                          </div>
                        )}

                        {/* هـ. محرر التصنيفات/المجموعات (Categories) */}
                        {config?.hasCategories && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">الأقسام/المجموعات المرتبطة:</h4>
                            <div className="space-y-4">
                              {(section.data?.categories || []).map((cat, i) => (
                                <div key={i} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#444] relative shadow-inner">
                                  <button onClick={() => removeArrayItem(sectionIndex, 'categories', i)} className="absolute top-3 left-4 text-red-500 hover:text-red-400 font-bold text-xs">حذف</button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="col-span-1 md:col-span-2">
                                      <label className="block text-[10px] text-[#F5C518] mb-1">رابط صورة القسم</label>
                                      <input type="text" value={cat.image || ""} onChange={(e) => updateArrayItem(sectionIndex, 'categories', i, 'image', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-1">اسم القسم/المجموعة</label>
                                      <input type="text" value={cat.title || ""} onChange={(e) => updateArrayItem(sectionIndex, 'categories', i, 'title', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-1">رابط توجيه القسم (URL)</label>
                                      <input type="text" value={cat.url || ""} onChange={(e) => updateArrayItem(sectionIndex, 'categories', i, 'url', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addArrayItem(sectionIndex, 'categories', {image:'', title:'', url:''})} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة قسم للمجموعة</button>
                          </div>
                        )}

                        {/* و. محرر المقالات (Magazine) */}
                        {config?.hasArticles && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">مقالات المجلة:</h4>
                            <div className="space-y-4">
                              {(section.data?.articles || []).map((art, i) => (
                                <div key={i} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#444] relative shadow-inner">
                                  <button onClick={() => removeArrayItem(sectionIndex, 'articles', i)} className="absolute top-3 left-4 text-red-500 hover:text-red-400 font-bold text-xs">حذف</button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="col-span-1 md:col-span-2">
                                      <label className="block text-[10px] text-[#F5C518] mb-1">رابط صورة المقال</label>
                                      <input type="text" value={art.image || ""} onChange={(e) => updateArrayItem(sectionIndex, 'articles', i, 'image', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-1">عنوان المقال</label>
                                      <input type="text" value={art.title || ""} onChange={(e) => updateArrayItem(sectionIndex, 'articles', i, 'title', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-1">الوسم (Tag) مثال: نصائح</label>
                                      <input type="text" value={art.tag || ""} onChange={(e) => updateArrayItem(sectionIndex, 'articles', i, 'tag', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                      <label className="block text-[10px] text-gray-400 mb-1">رابط قراءة المقال</label>
                                      <input type="text" value={art.url || ""} onChange={(e) => updateArrayItem(sectionIndex, 'articles', i, 'url', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#555] rounded text-white text-sm outline-none" dir="ltr"/>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addArrayItem(sectionIndex, 'articles', {image:'', title:'', tag:'', url:''})} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة مقال</button>
                          </div>
                        )}

                        {/* ي. محرر البطاقات المعقدة (Featured Cards) */}
                        {config?.hasFeaturedCards && (
                          <div className="border-t border-[#444] pt-4">
                            <h4 className="text-[#F5C518] font-bold mb-4">البطاقات المخصصة (Cards):</h4>
                            <div className="space-y-6">
                              {(section.data?.cards || []).map((card, cardIndex) => (
                                <div key={cardIndex} className="p-5 border border-[#555] rounded-xl bg-[#1a1a1a] relative shadow-inner">
                                  <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                                    <span className="font-bold text-gray-300 text-sm">بطاقة #{cardIndex + 1}</span>
                                    <button onClick={() => removeArrayItem(sectionIndex, 'cards', cardIndex)} className="text-red-400 hover:text-red-300 font-bold text-xs">حذف</button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2 flex gap-2">
                                      <div className="flex-1">
                                        <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">رابط الصورة (Image URL)</label>
                                        <input type="text" value={card.image} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'image', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr"/>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] text-gray-400 mb-1 font-bold">نوع الشارة (Badge Type)</label>
                                      <select value={card.badgeType} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'badgeType', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none">
                                        <option value="none">بدون شارة</option>
                                        <option value="list">قائمة (List)</option>
                                        <option value="photos">صور (Photos)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] text-gray-400 mb-1 font-bold">العنوان أسفل الصورة</label>
                                      <input type="text" value={card.mainTitle} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'mainTitle', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] text-gray-400 mb-1 font-bold">نص الرابط الملوّن</label>
                                      <input type="text" value={card.linkText} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkText', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] text-[#F5C518] mb-1 font-bold">رابط التوجيه (URL)</label>
                                      <input type="text" value={card.linkUrl} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkUrl', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr" placeholder="اكتب الرابط أو ألصقه هنا"/>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => addArrayItem(sectionIndex, 'cards', { image: "", badgeType: "none", mainTitle: "", linkText: "", linkUrl: "" })} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-xl hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة بطاقة (Card) جديدة</button>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                );
              })}

              {/* رسالة توضيحية */}
              {layoutSections.length <= 1 && (
                <div className="p-10 border border-[#444] rounded-xl text-center text-gray-400 bg-[#1a1a1a]">
                  لا توجد أقسام حالياً. أضف أقساماً من التبويب الأول للبدء في تعديل محتواها هنا.
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