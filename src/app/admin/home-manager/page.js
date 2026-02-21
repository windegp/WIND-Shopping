"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

// --- خريطة الأقسام (لتحويل التصميم أوتوماتيكياً ومعرفة الحقول المطلوبة) ---
const SECTION_TYPES = {
  HERO_SECTION: { label: "الهيرو الرئيسي", designId: "MODERN_SLIDER", hasTitle: false, hasCards: false },
  FEATURED_SECTION: { label: "المميز (Featured Today)", designId: "IMDB_STYLE", hasTitle: true, hasCards: true },
  PRODUCTS_MARQUEE: { label: "شريط المنتجات (Marquee)", designId: "INFINITE_SCROLL", hasTitle: true, hasSubtitle: true },
  BEST_SELLERS: { label: "الأكثر مبيعاً", designId: "GRID_WITH_FEATURED", hasTitle: true },
  TRUST_BAR: { label: "شريط الثقة والإحصائيات", designId: "STATS_STRIP", hasTitle: false },
  COLLECTIONS: { label: "مجموعات مميزة", designId: "MAIN_GRID", hasTitle: true },
  REVIEWS: { label: "آراء العملاء", designId: "MARQUEE_REVIEWS", hasTitle: true },
  MAGAZINE: { label: "مجلة WIND", designId: "BENTO_STYLE", hasTitle: true, hasSubtitle: true },
  STORY: { label: "قصة WIND", designId: "KEN_BURNS_FULL", hasTitle: false },
  CATEGORIES_GRID: { label: "تسوق بالفئة", designId: "SPLIT_GRID", hasTitle: true },
  DISCOUNTS: { label: "تخفيضات", designId: "PROMO_GRID", hasTitle: true }
};

export default function HomeManagerPage() {
  // --- 1. التبويب النشط ---
  const [activeTab, setActiveTab] = useState('layout'); 

  // --- 2. حالات قسم الهيرو والأقسام السفلية ---
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- 3. حالة محرك الترتيب الديناميكي (هو الأساس الآن لكل الأقسام) ---
  const [layoutSections, setLayoutSections] = useState([]);

  // حالات التحميل والحفظ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب جميع البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        // أ. جلب ترتيب الأقسام والمحتوى الديناميكي من الخريطة الرئيسية
        const layoutRef = doc(db, "homepage", "layout_config");
        const layoutSnap = await getDoc(layoutRef);
        let currentLayout = [];
        if (layoutSnap.exists()) {
          currentLayout = layoutSnap.data().sections || [];
          setLayoutSections(currentLayout);
        }

        // ب. جلب بيانات الهيرو
        const heroRef = doc(db, "homepage", "main-hero");
        const heroSnap = await getDoc(heroRef);
        if (heroSnap.exists()) {
          setSlides(heroSnap.data().slides || []);
          setCategories(heroSnap.data().categories || []);
        } else {
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
          setCategories([{ title: "", link: "" }]);
        }

        // ج. ترحيل بيانات Featured القديمة إلى المحرك الديناميكي إذا لم تكن موجودة
        // هذه الخطوة لضمان عدم ضياع تعبك القديم
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
  // --- دوال محرك الترتيب والمحتوى الديناميكي ---
  // ==========================================
  
  // تغيير نوع القسم (يقوم بتحديث التصميم أوتوماتيكياً)
  const handleLayoutCategoryChange = (index, newCategory) => {
    const updated = [...layoutSections];
    updated[index].category = newCategory;
    updated[index].designId = SECTION_TYPES[newCategory]?.designId || "";
    // تهيئة البيانات الافتراضية للقسم الجديد
    updated[index].data = { title: SECTION_TYPES[newCategory]?.label || "" };
    if (SECTION_TYPES[newCategory]?.hasCards) {
      updated[index].data.cards = [];
    }
    setLayoutSections(updated);
  };

  // تعديل النصوص (العناوين) داخل أي قسم ديناميكي
  const handleLayoutDataChange = (index, field, value) => {
    const updated = [...layoutSections];
    if (!updated[index].data) updated[index].data = {};
    updated[index].data[field] = value;
    setLayoutSections(updated);
  };

  const addNewSection = () => {
    setLayoutSections([...layoutSections, { 
      category: "FEATURED_SECTION", 
      designId: "IMDB_STYLE", 
      data: { title: "المميز اليوم", cards: [] } 
    }]);
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
    }
  };

  // --- دوال البطاقات (Cards) الخاصة بالقسم الديناميكي (Featured وغيرها) ---
  const addDynamicCard = (sectionIndex) => {
    const updated = [...layoutSections];
    if (!updated[sectionIndex].data) updated[sectionIndex].data = {};
    if (!updated[sectionIndex].data.cards) updated[sectionIndex].data.cards = [];
    
    updated[sectionIndex].data.cards.push({ 
      image: "", badgeType: "none", mainTitle: "", linkText: "", linkUrl: "" 
    });
    setLayoutSections(updated);
  };

  const updateDynamicCard = (sectionIndex, cardIndex, field, value) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data.cards[cardIndex][field] = value;
    setLayoutSections(updated);
  };

  const removeDynamicCard = (sectionIndex, cardIndex) => {
    const updated = [...layoutSections];
    updated[sectionIndex].data.cards = updated[sectionIndex].data.cards.filter((_, i) => i !== cardIndex);
    setLayoutSections(updated);
  };

  // ==========================================
  // --- دوال قسم الهيرو (من كودك الأصلي) ---
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
      // 1. حفظ خريطة الصفحة بالكامل بما فيها محتوى الأقسام الإضافية (وهذا يحل مشكلة التسميع)
      await setDoc(doc(db, "homepage", "layout_config"), { sections: layoutSections });

      // 2. حفظ بيانات الهيرو
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
    return <div className="max-w-5xl mx-auto p-10 text-center text-gray-400 font-sans text-xl bg-[#121212] min-h-screen">جاري تحميل بيانات لوحة التحكم...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto bg-[#1a1a1a] rounded-lg shadow-xl text-white border border-[#333] overflow-hidden" dir="rtl">
        
        {/* هيدر اللوحة */}
        <div className="p-6 border-b border-[#333] flex flex-col md:flex-row justify-between items-center sticky top-0 bg-[#1a1a1a] z-50">
          <div>
             <h1 className="text-3xl font-bold mb-1 text-[#F5C518]">إدارة واجهة WIND</h1>
             <p className="text-gray-400 text-xs">تحكم شامل في ترتيب ومحتوى الصفحة الرئيسية</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`mt-4 md:mt-0 font-bold py-3 px-10 rounded shadow-lg transition-all duration-300 ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#F5C518] hover:bg-yellow-500 text-black hover:scale-105'}`}
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
                <h2 className="text-2xl font-bold">هيكلة وترتيب الصفحة (Layout)</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">أضف الأقسام ورتبها. التصميم (Design ID) سيتم ضبطه تلقائياً حسب نوع القسم.</p>
              
              <div className="space-y-4">
                {layoutSections.map((section, index) => (
                  <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-[#242424] border border-[#444] rounded-xl group relative hover:border-[#F5C518]/50 transition-colors">
                    
                    {/* أسهم الترتيب */}
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
                          type="text"
                          value={section.designId}
                          readOnly
                          className="w-full bg-[#121212]/50 border border-[#333] p-3 rounded text-sm text-gray-500 cursor-not-allowed"
                          dir="ltr"
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
                <h2 className="text-2xl font-bold">إدارة شرائح العرض (Hero Slides)</h2>
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
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>إدارة أزرار تصفح الأقسام</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category, index) => (
                    <div key={index} className="flex gap-4 items-center p-3 border border-[#444] rounded-lg bg-[#242424]">
                      <input type="text" value={category.title} onChange={(e) => handleCategoryChange(index, 'title', e.target.value)} placeholder="اسم القسم" className="w-1/3 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none"/>
                      <input type="text" value={category.link} onChange={(e) => handleCategoryChange(index, 'link', e.target.value)} placeholder="الرابط" className="flex-1 p-2.5 bg-[#121212] border border-[#555] rounded text-sm text-white focus:border-[#F5C518] outline-none" dir="ltr"/>
                      <button onClick={() => removeCategory(index)} className="text-red-500 hover:text-red-400 p-2 font-bold">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addNewCategory} className="mt-4 px-6 py-3 bg-[#242424] border border-[#555] text-[#F5C518] font-bold rounded-lg hover:border-[#F5C518] hover:text-white transition-all">+ إضافة قسم جديد</button>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* === التبويب الثالث: محرر الأقسام الديناميكي === */}
          {/* هذا التبويب يقرأ ما أضفته في الأول ويسمح لك بتعديله */}
          {/* ========================================= */}
          {activeTab === 'featured' && (
            <div className="space-y-12 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-6 border-b border-[#333] pb-4">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <div>
                  <h2 className="text-2xl font-bold">محتوى الأقسام الإضافية</h2>
                  <p className="text-gray-400 text-sm mt-1">أي قسم تُضيفه في خريطة الصفحة سيظهر هنا لتتمكن من إدخال نصوصه وصوره (مثل البطاقات أو العناوين).</p>
                </div>
              </div>

              {layoutSections.map((section, sectionIndex) => {
                const config = SECTION_TYPES[section.category];
                // لا نظهر الهيرو هنا لأنه له تبويب خاص، ولا نظهر الأقسام التي لا تحتوي على نصوص للتعديل
                if (section.category === 'HERO_SECTION' || (!config?.hasTitle && !config?.hasCards)) return null;

                return (
                  <div key={sectionIndex} className="bg-[#242424] border border-[#444] rounded-xl p-6 shadow-md relative">
                    <div className="absolute top-0 right-0 bg-[#F5C518] text-black font-black text-[10px] px-3 py-1 rounded-bl-lg">
                      {config?.label}
                    </div>
                    
                    {/* تعديل العناوين إذا كان القسم يدعمها */}
                    {config?.hasTitle && (
                      <div className="mt-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الرئيسي للقسم</label>
                          <input 
                            type="text" 
                            value={section.data?.title || ""} 
                            onChange={(e) => handleLayoutDataChange(sectionIndex, 'title', e.target.value)} 
                            className="w-full p-3 border border-[#555] rounded bg-[#121212] text-white font-bold focus:border-[#F5C518] outline-none"
                          />
                        </div>
                        {config?.hasSubtitle && (
                          <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الفرعي للقسم</label>
                            <input 
                              type="text" 
                              value={section.data?.subTitle || ""} 
                              onChange={(e) => handleLayoutDataChange(sectionIndex, 'subTitle', e.target.value)} 
                              className="w-full p-3 border border-[#555] rounded bg-[#121212] text-white focus:border-[#F5C518] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* محرر البطاقات (Featured Cards) إذا كان القسم من نوع Featured */}
                    {config?.hasCards && (
                      <div className="mt-8 border-t border-[#444] pt-6">
                        <h4 className="text-[#F5C518] font-bold mb-4">البطاقات (Cards) الخاصة بهذا القسم:</h4>
                        <div className="space-y-6">
                          {(section.data?.cards || []).map((card, cardIndex) => (
                            <div key={cardIndex} className="p-5 border border-[#555] rounded-lg bg-[#1a1a1a] relative">
                              <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                                <span className="font-bold text-gray-300 text-sm">بطاقة #{cardIndex + 1}</span>
                                <button onClick={() => removeDynamicCard(sectionIndex, cardIndex)} className="text-red-400 hover:text-red-300 font-bold text-xs">حذف</button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">رابط الصورة (Image URL)</label>
                                  <input type="text" value={card.image} onChange={(e) => updateDynamicCard(sectionIndex, cardIndex, 'image', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">نوع الشارة (Badge Type)</label>
                                  <select value={card.badgeType} onChange={(e) => updateDynamicCard(sectionIndex, cardIndex, 'badgeType', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none">
                                    <option value="none">بدون شارة</option>
                                    <option value="list">قائمة (List)</option>
                                    <option value="photos">صور (Photos)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">العنوان أسفل الصورة</label>
                                  <input type="text" value={card.mainTitle} onChange={(e) => updateDynamicCard(sectionIndex, cardIndex, 'mainTitle', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">نص الرابط الملوّن</label>
                                  <input type="text" value={card.linkText} onChange={(e) => updateDynamicCard(sectionIndex, cardIndex, 'linkText', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none"/>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-gray-400 mb-1 font-bold">رابط التوجيه (URL)</label>
                                  <input type="text" value={card.linkUrl} onChange={(e) => updateDynamicCard(sectionIndex, cardIndex, 'linkUrl', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white text-sm focus:border-[#F5C518] outline-none" dir="ltr"/>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addDynamicCard(sectionIndex)} className="mt-4 w-full py-3 border border-dashed border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة بطاقة (Card) للقسم</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* رسالة توضيحية إذا لم تكن هناك أقسام قابلة للتعديل */}
              {layoutSections.filter(s => s.category !== 'HERO_SECTION' && (SECTION_TYPES[s.category]?.hasTitle || SECTION_TYPES[s.category]?.hasCards)).length === 0 && (
                <div className="p-10 border border-[#444] rounded-xl text-center text-gray-400">
                  لا توجد أقسام حالياً تتطلب إدخال بيانات نصية أو بطاقات. أضف قسم (المميز) أو (الأكثر مبيعاً) من تبويب التخطيط أولاً.
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