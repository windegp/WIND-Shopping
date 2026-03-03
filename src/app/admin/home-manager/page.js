"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- خريطة الأقسام الأساسية فقط ---
const SECTION_TYPES = {
  HERO_SECTION: { label: "الهيرو الرئيسي", designId: "MODERN_SLIDER" },
  FEATURED_SECTION: { label: "المميز (Featured Today)", designId: "IMDB_STYLE", hasTitle: true, hasSubTitle: true, hasFeaturedCards: true },
  TOP_TEN_SECTION: { label: "أفضل 10 منتجات", designId: "TOP_TEN_LIST", hasTitle: true, hasFeaturedCards: true, hasViewAllLink: true },
  MARQUEE_SECTION: { label: "شريط المنتجات المتحرك", designId: "PRODUCTS_SLIDER", hasTitle: true, hasSubTitle: true, hasProducts: true }
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
  const [allStoreProducts, setAllStoreProducts] = useState([]); // لحفظ منتجات المتجر
  const [allStoreCollections, setAllStoreCollections] = useState([]); // لحفظ أقسام المتجر (collections)

  // حالات التحميل والحفظ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب جميع البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const layoutRef = doc(db, "homepage", "layout_config");
        // جلب منتجات وأقسام المتجر لعرضها في القوائم المنسدلة
        try {
          const productsRef = collection(db, "products"); // تأكد أن اسم مجموعة المنتجات عندك في فايربيز هو products
          const productsSnap = await getDocs(productsRef);
          setAllStoreProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // جلب الأقسام من collections
          const collectionsRef = collection(db, "collections"); 
          const collectionsSnap = await getDocs(collectionsRef);
          setAllStoreCollections(collectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          console.error("خطأ في جلب المنتجات أو الأقسام:", err);
        }
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
    if (config.hasFeaturedCards) initialData.cards = [];
    if (config.hasViewAllLink) initialData.viewAllLink = "";
    if (config.hasProducts) initialData.products = [];

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
      data: { title: "المميز اليوم", subTitle: "", cards: [] }
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
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-[#202223]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#202223] mb-4"></div>
        <p className="font-bold text-sm text-gray-500">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#202223] font-sans pb-24" dir="rtl">
      
      {/* Header الثابت */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#202223]">إدارة الصفحة الرئيسية</h1>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">تخصيص الهيكل والمحتوى لواجهة المتجر</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
            saving 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
            : 'bg-[#1a1a1a] hover:bg-black text-white'
          }`}
        >
          {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          {saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto mt-6 px-4">
        
        {/* أزرار التبويبات (Tabs) */}
        <div className="flex overflow-x-auto scrollbar-hide bg-white border border-gray-200 rounded-xl shadow-sm mb-6 p-1">
          <button onClick={() => setActiveTab('layout')} className={`flex-1 min-w-[140px] whitespace-nowrap py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'layout' ? 'bg-gray-100 text-[#202223] shadow-sm' : 'text-gray-500 hover:text-[#202223] hover:bg-gray-50'}`}>1. هيكلة وترتيب الصفحة</button>
          <button onClick={() => setActiveTab('hero')} className={`flex-1 min-w-[140px] whitespace-nowrap py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'hero' ? 'bg-gray-100 text-[#202223] shadow-sm' : 'text-gray-500 hover:text-[#202223] hover:bg-gray-50'}`}>2. محتوى الهيرو</button>
          <button onClick={() => setActiveTab('featured')} className={`flex-1 min-w-[140px] whitespace-nowrap py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'featured' ? 'bg-gray-100 text-[#202223] shadow-sm' : 'text-gray-500 hover:text-[#202223] hover:bg-gray-50'}`}>3. محتوى الأقسام المُضافة</button>
        </div>

        {/* ========================================= */}
        {/* === التبويب الأول: محرك الترتيب الذكي === */}
        {/* ========================================= */}
        {activeTab === 'layout' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#008060] rounded-full"></div>
              <div>
                <h2 className="text-base font-bold text-[#202223]">هيكلة وترتيب الصفحة (Layout)</h2>
                <p className="text-gray-500 text-xs mt-0.5">أضف الأقسام ورتبها. التصميم (Design ID) سيتم ضبطه تلقائياً.</p>
              </div>
            </div>

            <div className="space-y-3">
              {layoutSections.map((section, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#008060]/50 transition-colors">
                  
                  <div className="flex sm:flex-col gap-1 w-full sm:w-auto justify-center order-2 sm:order-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-3">
                    <button onClick={() => moveSection(index, 'up')} className="bg-gray-50 p-2 rounded-lg text-gray-500 hover:text-[#202223] hover:bg-gray-100 transition-colors flex-1 sm:flex-none flex justify-center">▲</button>
                    <button onClick={() => moveSection(index, 'down')} className="bg-gray-50 p-2 rounded-lg text-gray-500 hover:text-[#202223] hover:bg-gray-100 transition-colors flex-1 sm:flex-none flex justify-center">▼</button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full order-1 sm:order-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1.5">نوع القسم</label>
                      <select
                        value={section.category}
                        onChange={(e) => handleLayoutCategoryChange(index, e.target.value)}
                        className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none transition-all"
                      >
                        {Object.keys(SECTION_TYPES).map(key => (
                          <option key={key} value={key}>{SECTION_TYPES[key].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">التصميم المرتبط (تلقائي)</label>
                      <input
                        type="text" value={section.designId} readOnly
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-sm text-gray-500 cursor-not-allowed font-mono" dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeSection(index)}
                    className="sm:ml-auto order-3 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg border border-red-100 transition-colors w-full sm:w-auto text-sm font-bold"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addNewSection}
              className="w-full mt-4 py-3.5 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-[#202223] rounded-xl transition-all font-bold bg-white text-sm shadow-sm"
            >
              + إضافة قسم جديد للصفحة
            </button>
          </div>
        )}

        {/* ========================================= */}
        {/* === التبويب الثاني: الهيرو === */}
        {/* ========================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#008060] rounded-full"></div>
              <h2 className="text-base font-bold text-[#202223]">إدارة شرائح العرض (Hero Slides)</h2>
            </div>

            <div className="space-y-6">
              {slides.map((slide, index) => (
                <div key={index} className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-white shadow-sm relative">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-[#202223]">الشريحة رقم {index + 1}</h3>
                    <button onClick={() => removeSlide(index)} className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors">حذف الشريحة</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">رابط الصورة الخلفية الرئيسية</label>
                      <input type="text" value={slide.image} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] font-mono" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">الوسم المميّز (شريط أصفر)</label>
                      <input type="text" value={slide.tag} onChange={(e) => handleSlideChange(index, 'tag', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">العنوان الرئيسي</label>
                      <input type="text" value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060]" />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">وصف التصميم</label>
                      <textarea value={slide.desc} onChange={(e) => handleSlideChange(index, 'desc', e.target.value)} rows="2" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm text-[#202223] resize-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]" />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">رابط البوستر المصغر</label>
                        <input type="text" value={slide.thumbnail} onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-xs text-[#202223] focus:border-[#008060] outline-none font-mono" dir="ltr" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">رابط المنتج المخصص</label>
                        <input type="text" value={slide.productLink} onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-xs text-[#202223] focus:border-[#008060] outline-none font-mono" dir="ltr" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">نص الزر</label>
                        <input type="text" value={slide.buttonText || ""} onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-xs text-[#202223] focus:border-[#008060] outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addNewSlide} className="w-full py-3.5 border border-dashed border-gray-300 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-400 hover:bg-gray-50 bg-white transition-all shadow-sm">+ إضافة شريحة عرض جديدة</button>
            </div>

            {/* شريط الأقسام السفلية */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-8">
              <h2 className="text-base font-bold text-[#202223] mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#008060] rounded-sm"></div>
                إدارة أزرار تصفح الأقسام
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category, index) => (
                  <div key={index} className="flex gap-2 items-center p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                    <input type="text" value={category.title} onChange={(e) => handleCategoryChange(index, 'title', e.target.value)} placeholder="اسم القسم" className="w-1/3 p-2 bg-white border border-gray-300 rounded text-xs text-[#202223] focus:border-[#008060] outline-none" />
                    <input type="text" value={category.link} onChange={(e) => handleCategoryChange(index, 'link', e.target.value)} placeholder="الرابط" className="flex-1 p-2 bg-white border border-gray-300 rounded text-xs text-[#202223] focus:border-[#008060] outline-none font-mono" dir="ltr" />
                    <button onClick={() => removeCategory(index)} className="text-red-500 hover:text-red-700 p-1.5 font-bold text-sm">✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addNewCategory} className="mt-4 px-4 py-2 bg-white border border-gray-300 text-[#202223] text-xs font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm">+ إضافة قسم جديد</button>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* === التبويب الثالث: محرر الأقسام === */}
        {/* ========================================= */}
        {activeTab === 'featured' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#008060] rounded-full"></div>
              <div>
                <h2 className="text-base font-bold text-[#202223]">محتوى الأقسام الإضافية</h2>
                <p className="text-gray-500 text-xs mt-0.5">اضغط على أي قسم لفتحه وتعديل محتواه.</p>
              </div>
            </div>

            {layoutSections.map((section, sectionIndex) => {
              const config = SECTION_TYPES[section.category];
              if (section.category === 'HERO_SECTION') return null;

              const isExpanded = expandedSections[sectionIndex];

              return (
                <div key={sectionIndex} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">

                  {/* رأس الأكورديون */}
                  <div
                    onClick={() => toggleAccordion(sectionIndex)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors border-b border-transparent data-[expanded=true]:border-gray-200"
                    data-expanded={isExpanded}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="bg-gray-100 text-[#202223] font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded border border-gray-200 w-fit tracking-wide">
                        {config?.label}
                      </span>
                      <span className="font-bold text-[#202223] text-sm sm:text-base">
                        {section.data?.title || "بدون عنوان"}
                      </span>
                    </div>
                    <div className={`text-gray-400 font-bold text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {/* المحتوى عند فتح الأكورديون */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-gray-50 animate-[fadeIn_0.2s_ease-out]">

                      {/* 1. العنوان الرئيسي والفرعي */}
                      {config?.hasTitle && (
                        <div className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">العنوان الرئيسي للقسم</label>
                            <input
                              type="text" value={section.data?.title || ""}
                              onChange={(e) => handleLayoutDataChange(sectionIndex, 'title', e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
                            />
                          </div>
                          {config?.hasSubTitle && (
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5">العنوان الفرعي (اختياري)</label>
                              <input
                                type="text" value={section.data?.subTitle || ""}
                                onChange={(e) => handleLayoutDataChange(sectionIndex, 'subTitle', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none"
                              />
                            </div>
                          )}

                          {/* إضافة رابط عرض الكل للقسم بالكامل */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">رابط زر "عرض الكل" (صفحة المجموعة)</label>
                            <input 
                              type="text" 
                              value={section.data?.linkUrl || ""} 
                              onChange={(e) => handleLayoutDataChange(sectionIndex, 'linkUrl', e.target.value)} 
                              placeholder="مثال: /collections/shoes"
                              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none font-mono"
                              dir="ltr"
                            />
                          </div>

                          {/* رابط "عرض الكل" - خاص بـ TOP_TEN_SECTION فقط */}
                          {section.category === 'TOP_TEN_SECTION' && (
                            <div className="mt-4">
                              <label className="block text-xs font-bold text-gray-600 mb-1.5">رابط زرار "عرض الكل" (TOP 10)</label>
                              <input
                                type="text"
                                value={section.data?.viewAllLink || ""}
                                onChange={(e) => handleLayoutDataChange(sectionIndex, 'viewAllLink', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none font-mono"
                                dir="ltr"
                                placeholder="مثال: /collections/top-ten"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. محرر البطاقات */}
                      {config?.hasFeaturedCards && (
                        <div>
                          <h4 className="text-sm font-bold text-[#202223] mb-3">البطاقات المخصصة (Cards):</h4>
                          <div className="space-y-4">
                            {(section.data?.cards || []).map((card, cardIndex) => (
                              <div key={cardIndex} className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-white shadow-sm relative">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                                  <span className="font-bold text-[#202223] text-sm">البطاقة الرئيسية #{cardIndex + 1}</span>
                                  <button onClick={() => removeArrayItem(sectionIndex, 'cards', cardIndex)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-2 py-1 rounded">حذف البطاقة بالكامل</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                  {/* رابط الصورة - مشترك */}
                                  <div className="col-span-1 md:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">رابط الصورة (Image URL)</label>
                                    <input type="text" value={card.image} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'image', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none font-mono" dir="ltr" />
                                  </div>

                                  {/* Badge Type - خاص بـ FEATURED فقط */}
                                  {section.category !== 'TOP_TEN_SECTION' && (
                                    <div>
                                      <label className="block text-[11px] font-bold text-gray-600 mb-1.5">نوع الشارة (Badge Type)</label>
                                      <select value={card.badgeType} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'badgeType', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none">
                                        <option value="none">بدون شارة</option>
                                        <option value="list">قائمة (List)</option>
                                        <option value="photos">صور (Photos)</option>
                                      </select>
                                    </div>
                                  )}

                                  {/* العنوان - مشترك */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">العنوان أسفل الصورة</label>
                                    <input type="text" value={card.mainTitle} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'mainTitle', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">رابط تفاصيل المنتج (داخل الكارت)</label>
                                    <input 
                                      type="text" 
                                      value={card.linkUrl || ""} 
                                      onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkUrl', e.target.value)} 
                                      placeholder="ألصق رابط المنتج هنا"
                                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none font-mono" 
                                      dir="ltr" 
                                    />
                                  </div>

                                  {/* نص الرابط الملوّن - خاص بـ FEATURED فقط */}
                                  {section.category !== 'TOP_TEN_SECTION' && (
                                    <div>
                                      <label className="block text-[11px] font-bold text-gray-600 mb-1.5">نص الرابط الملوّن</label>
                                      <input type="text" value={card.linkText} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkText', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                    </div>
                                  )}

                                  {/* رابط التوجيه - مشترك (هو رابط المنتج لزرار "عرض التفاصيل" في TOP_TEN) */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5">
                                      {section.category === 'TOP_TEN_SECTION' ? 'رابط المنتج (زرار "عرض التفاصيل")' : 'رابط التوجيه (URL)'}
                                    </label>
                                    <input type="text" value={card.linkUrl} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'linkUrl', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none font-mono" dir="ltr" placeholder="اكتب الرابط أو ألصقه هنا" />
                                  </div>

                                  {/* ✅ خانات خاصة بـ TOP_TEN_SECTION */}
                                  {section.category === 'TOP_TEN_SECTION' && (
                                    <>
                                      <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">السعر</label>
                                        <input type="text" value={card.price || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'price', e.target.value)} placeholder="مثال: 1500 ج.م" className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">التقييم</label>
                                        <input type="text" value={card.rating || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'rating', e.target.value)} placeholder="مثال: 4.8" className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">عدد المراجعات</label>
                                        <input type="text" value={card.reviewsCount || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'reviewsCount', e.target.value)} placeholder="مثال: 120 مراجعة" className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5">تصنيف المنتج (الفئة)</label>
                                        <input type="text" value={card.category || ""} onChange={(e) => updateArrayItem(sectionIndex, 'cards', cardIndex, 'category', e.target.value)} placeholder="مثال: أجهزة منزلية" className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none" />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* البطاقات الفرعية - خاصة بـ FEATURED فقط */}
                                {section.category !== 'TOP_TEN_SECTION' && (
                                  <div className="mt-5 border-t border-gray-100 pt-4">
                                    <h5 className="text-xs font-bold text-gray-600 mb-3">البطاقات الفرعية المرتبطة بهذه البطاقة:</h5>
                                    <div className="space-y-3">
                                      {(card.subCards || []).map((subCard, subIndex) => (
                                        <div key={subIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                                          <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-gray-500 text-[11px]">بطاقة فرعية #{subIndex + 1}</span>
                                            <button onClick={() => removeSubCard(sectionIndex, cardIndex, subIndex)} className="text-red-500 hover:text-red-700 text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-200">حذف البطاقة الفرعية</button>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="col-span-1 md:col-span-2">
                                              <label className="block text-[10px] font-bold text-gray-500 mb-1">رابط الصورة</label>
                                              <input type="text" value={subCard.image} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'image', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-xs text-[#202223] focus:border-[#008060] outline-none font-mono" dir="ltr" />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] font-bold text-gray-500 mb-1">العنوان أسفل الصورة</label>
                                              <input type="text" value={subCard.mainTitle} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'mainTitle', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-xs text-[#202223] focus:border-[#008060] outline-none" />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] font-bold text-gray-500 mb-1">نص الرابط الملوّن</label>
                                              <input type="text" value={subCard.linkText} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'linkText', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-xs text-[#202223] focus:border-[#008060] outline-none" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                              <label className="block text-[10px] font-bold text-gray-500 mb-1">رابط التوجيه (URL)</label>
                                              <input type="text" value={subCard.linkUrl} onChange={(e) => updateSubCard(sectionIndex, cardIndex, subIndex, 'linkUrl', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-xs text-[#202223] focus:border-[#008060] outline-none font-mono" dir="ltr" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <button onClick={() => addSubCard(sectionIndex, cardIndex)} className="mt-3 w-full py-2 border border-dashed border-gray-300 text-gray-500 font-bold text-xs rounded-lg hover:border-gray-400 hover:bg-white bg-transparent transition-all shadow-sm">+ إضافة بطاقة فرعية</button>
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
                            className="mt-4 w-full py-3 border border-dashed border-gray-300 text-[#202223] text-sm font-bold rounded-xl hover:bg-white hover:border-gray-400 bg-gray-50 transition-all shadow-sm"
                          >
                            + إضافة بطاقة جديدة
                          </button>
                        </div>
                      )}

                      {/* 3. محرر المنتجات (القائمة الذكية مع بادج الرؤية وتصحيح الروابط) */}
                      {config?.hasProducts && (
                        <div className="mt-6 border-t border-gray-100 pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-bold text-[#202223]">تحديد المنتجات المعروضة:</h4>
                              {section.data?.linkedCollectionName && (
                                <span className="bg-[#eaf4ff] text-[#0066cc] px-2 py-1 rounded text-[11px] font-bold border border-[#0066cc]/20">
                                  🔗 القسم المربوط: {section.data.linkedCollectionName}
                                </span>
                              )}
                            </div>
                            <span className="bg-[#008060] text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm">
                              {(section.data?.products || []).length} منتج محدد
                            </span>
                          </div>

                          {/* خيار 1: إضافة منتجات قسم بالكامل */}
                          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <label className="block text-[11px] font-bold text-gray-600 mb-2">إضافة منتجات قسم (Collection) بالكامل وربط الرابط:</label>
                            <select 
                              onChange={(e) => {
                                const colId = e.target.value;
                                if (!colId) return;
                                
                                const selectedCol = allStoreCollections.find(c => c.id === colId);
                                const colName = selectedCol?.name || selectedCol?.title || colId;
                                const colSlug = selectedCol?.slug || colId; 
                                
                                const updated = [...layoutSections];
                                let currentProds = updated[sectionIndex].data.products || [];
                                
                                // توحيد النص (حروف صغيرة، بدون همزات أو تنوين)
                                const normalizeText = (text) => {
                                  if (!text) return "";
                                  return text.toString().toLowerCase().replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/[\u064B-\u065F]/g, '').trim();
                                };
                                
                                const normColId = normalizeText(colId);
                                const normColName = normalizeText(colName);
                                const normColSlug = normalizeText(colSlug);
                                
                                // فلترة كاسحة بتدور في كل حتة في المنتج (خصوصاً Organization و Product Type و Tags)
                                const categoryProducts = allStoreProducts.filter(p => {
                                  let pCats = [];
                                  
                                  // الحقول الأساسية
                                  if (p.category) pCats.push(p.category);
                                  if (p.categoryId) pCats.push(p.categoryId);
                                  if (p.collection) pCats.push(p.collection);
                                  if (p.collectionId) pCats.push(p.collectionId);
                                  if (p.productType) pCats.push(p.productType);
                                  if (p.type) pCats.push(p.type);
                                  
                                  // حقول التنظيم (Organization) زي ما طلبت
                                  if (p.organization) {
                                    if (p.organization.productType) pCats.push(p.organization.productType);
                                    if (p.organization.type) pCats.push(p.organization.type);
                                    if (p.organization.category) pCats.push(p.organization.category);
                                  }
                                  
                                  // المصفوفات (Arrays)
                                  if (Array.isArray(p.categories)) pCats = pCats.concat(p.categories);
                                  if (Array.isArray(p.collections)) pCats = pCats.concat(p.collections);
                                  if (Array.isArray(p.tags)) pCats = pCats.concat(p.tags); // احياناً "الأكثر مبيعاً" بتبقى في التاجز

                                  // تنظيف كل القيم اللي سحبناها من المنتج
                                  const normalizedPCats = pCats.map(normalizeText);

                                  // لو أي حقل في المنتج طابق الـ ID أو الاسم أو الـ Slug بتاع القسم، يبقى المنتج ده معانا
                                  return normalizedPCats.includes(normColId) || 
                                         normalizedPCats.includes(normColName) || 
                                         normalizedPCats.includes(normColSlug);
                                });

                                if(categoryProducts.length === 0) {
                                  alert(`تنبيه: لم يتم العثور على أي منتجات مرتبطة بقسم "${colName}". تأكد من إعدادات (التنظيم / Product type) داخل المنتجات.`);
                                  e.target.value = "";
                                  return;
                                }
                                
                                categoryProducts.forEach(prod => {
                                  if (!currentProds.some(p => p.productId === prod.id)) {
                                    currentProds.push({
                                      productId: prod.id,
                                      name: prod.title || prod.name || "بدون اسم",
                                      image: (prod.images && prod.images[0]) || prod.image || "",
                                      price: prod.price || "",
                                      compareAtPrice: prod.compareAtPrice || prod.oldPrice || "",
                                      linkUrl: `/product/${prod.id}`,
                                      badge: ""
                                    });
                                  }
                                });
                                updated[sectionIndex].data.products = currentProds;
                                
                                // حفظ اسم القسم للرؤية
                                updated[sectionIndex].data.linkedCollectionName = colName;

                                // تحديث رابط عرض الكل تلقائياً للقسم المختار بصيغة collections باستخدام الـ slug
                                const autoLink = `/collections/${colSlug}`;
                                updated[sectionIndex].data.linkUrl = autoLink;
                                if(updated[sectionIndex].data.viewAllLink !== undefined) {
                                   updated[sectionIndex].data.viewAllLink = autoLink;
                                }

                                setLayoutSections(updated);
                                e.target.value = ""; 
                                alert(`تم بنجاح! تم إضافة ${categoryProducts.length} منتج من قسم "${colName}" وتم تحديث رابط عرض الكل إلى /collections/${colSlug}.`);
                              }}
                              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-[#202223] text-sm focus:border-[#008060] outline-none"
                            >
                              <option value="">-- اختر القسم للإضافة السريعة وتغيير الرابط --</option>
                              {allStoreCollections.map(col => (
                                <option key={col.id} value={col.id}>{col.name || col.title || col.id}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-2 font-medium">ملاحظة: الرابط التلقائي سيصبح <code>/collections/slug</code> ويمكنك تعديله يدوياً من خانة (رابط زر عرض الكل) بالأعلى.</p>
                          </div>

                          {/* خيار 2: قائمة كل المنتجات مع Checkbox */}
                          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                            {allStoreProducts.map((product) => {
                              // التحقق هل المنتج ده متحدد ولا لأ
                              const isSelected = (section.data?.products || []).some(p => p.productId === product.id);
                              const selectedProductData = (section.data?.products || []).find(p => p.productId === product.id);

                              return (
                                <div key={product.id} className={`p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${isSelected ? 'bg-[#f4fae5]' : 'hover:bg-gray-50'}`}>
                                  
                                  {/* بيانات المنتج مع الـ Checkbox */}
                                  <div className="flex items-center gap-3 flex-1">
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        const updated = [...layoutSections];
                                        let currentProds = updated[sectionIndex].data.products || [];
                                        
                                        if (isChecked) {
                                          currentProds.push({
                                            productId: product.id,
                                            name: product.title || product.name || "بدون اسم",
                                            image: (product.images && product.images[0]) || product.image || "",
                                            price: product.price || "",
                                            compareAtPrice: product.compareAtPrice || product.oldPrice || "",
                                            linkUrl: `/product/${product.id}`,
                                            badge: ""
                                          });
                                        } else {
                                          currentProds = currentProds.filter(p => p.productId !== product.id);
                                        }
                                        
                                        updated[sectionIndex].data.products = currentProds;
                                        setLayoutSections(updated);
                                      }}
                                      className="w-4 h-4 text-[#008060] rounded border-gray-300 focus:ring-[#008060] cursor-pointer"
                                    />
                                    <img src={(product.images && product.images[0]) || product.image || "/placeholder.jpg"} className="w-10 h-10 rounded border border-gray-200 object-cover" />
                                    <div>
                                      <p className="text-sm font-bold text-[#202223] line-clamp-1">{product.title || product.name}</p>
                                      <p className="text-[11px] text-gray-500">{product.price} LE {product.category && `- ${product.category}`}</p>
                                    </div>
                                  </div>

                                  {/* خانة الشارة تظهر فقط لو المنتج متحدد */}
                                  {isSelected && (
                                    <div className="sm:w-1/3 mt-2 sm:mt-0">
                                      <input 
                                        type="text" 
                                        placeholder="شارة (مثال: جديد)" 
                                        value={selectedProductData?.badge || ""}
                                        onChange={(e) => {
                                          const updated = [...layoutSections];
                                          const pIndex = updated[sectionIndex].data.products.findIndex(p => p.productId === product.id);
                                          if(pIndex > -1) {
                                            updated[sectionIndex].data.products[pIndex].badge = e.target.value;
                                            setLayoutSections(updated);
                                          }
                                        }}
                                        className="w-full p-2 text-xs border border-[#008060]/30 rounded bg-white focus:border-[#008060] outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}

            {/* رسالة توضيحية */}
            {layoutSections.length <= 1 && (
              <div className="p-8 border border-dashed border-gray-300 rounded-xl text-center text-gray-500 bg-white text-sm shadow-sm">
                لا توجد أقسام حالياً. أضف قسم (المميز اليوم) من التبويب الأول للبدء في تعديله.
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}