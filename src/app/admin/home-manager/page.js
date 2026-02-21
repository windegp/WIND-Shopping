"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

export default function HomeManagerPage() {
  // --- 1. التبويب النشط (لتحسين التجربة وجعلها أسهل) ---
  const [activeTab, setActiveTab] = useState('layout'); // layout, hero, featured

  // --- 2. حالات قسم الهيرو والأقسام السفلية (من كودك الأصلي) ---
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // --- 3. حالة قسم Featured الجديد (من كودك الأصلي) ---
  const [featuredData, setFeaturedData] = useState({ title: "Featured today", cards: [] });

  // --- 4. حالة محرك الترتيب الجديد (للربط مع HomeSections.js) ---
  const [layoutSections, setLayoutSections] = useState([]);

  // حالات التحميل والحفظ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب جميع البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        // أ. جلب ترتيب الأقسام (المحرك الديناميكي)
        const layoutRef = doc(db, "homepage", "layout_config");
        const layoutSnap = await getDoc(layoutRef);
        if (layoutSnap.exists()) {
          setLayoutSections(layoutSnap.data().sections || []);
        }

        // ب. جلب بيانات الهيرو (من كودك الأصلي)
        const docRef = doc(db, "homepage", "main-hero");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSlides(docSnap.data().slides || []);
          setCategories(docSnap.data().categories || []);
        } else {
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
          setCategories([{ title: "", link: "" }]);
        }

        // ج. جلب بيانات Featured (من كودك الأصلي)
        const featRef = doc(db, "homepage", "featured-section");
        const featSnap = await getDoc(featRef);
        if (featSnap.exists()) {
          setFeaturedData(featSnap.data());
        } else {
          setFeaturedData({ title: "Featured today", cards: [] });
        }

      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentData();
  }, []);

  // --- دوال محرك الترتيب (Layout Manager) ---
  const handleLayoutChange = (index, field, value) => {
    const updated = [...layoutSections];
    updated[index][field] = value;
    setLayoutSections(updated);
  };
  const addNewSection = () => {
    setLayoutSections([...layoutSections, { category: "HERO_SECTION", designId: "MODERN_SLIDER" }]);
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

  // --- دوال قسم الهيرو (من كودك الأصلي) ---
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

  // --- دوال قسم الأقسام السفلية (من كودك الأصلي) ---
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

  // --- دوال قسم Featured الجديد (من كودك الأصلي) ---
  const handleFeaturedTitleChange = (e) => {
    setFeaturedData({ ...featuredData, title: e.target.value });
  };
  const handleFeaturedCardChange = (index, field, value) => {
    const updatedCards = [...featuredData.cards];
    updatedCards[index][field] = value;
    setFeaturedData({ ...featuredData, cards: updatedCards });
  };
  const addNewFeaturedCard = () => {
    setFeaturedData({ 
      ...featuredData, 
      cards: [...featuredData.cards, { image: "", badgeType: "none", mainTitle: "", linkText: "", linkUrl: "" }] 
    });
  };
  const removeFeaturedCard = (index) => {
    const updatedCards = featuredData.cards.filter((_, i) => i !== index);
    setFeaturedData({ ...featuredData, cards: updatedCards });
  };

  // --- دالة الحفظ الشاملة (تربط جميع المسارات) ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. حفظ ترتيب الأقسام (layout_config)
      await setDoc(doc(db, "homepage", "layout_config"), { sections: layoutSections });

      // 2. حفظ بيانات الهيرو والأقسام (main-hero)
      const dataToSaveHero = { slides: slides, categories: categories };
      await setDoc(doc(db, "homepage", "main-hero"), dataToSaveHero);
      
      // 3. حفظ بيانات Featured (featured-section)
      await setDoc(doc(db, "homepage", "featured-section"), featuredData);
      
      alert("تم حفظ التحديثات بنجاح! الموقع سيعرض الأقسام بالترتيب الجديد.");
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
    <div className="min-h-screen bg-[#121212] py-8 px-4">
      <div className="max-w-5xl mx-auto bg-[#1a1a1a] rounded-lg shadow-xl font-sans text-white border border-[#333] overflow-hidden" dir="rtl">
        
        {/* هيدر اللوحة الثابت */}
        <div className="p-6 border-b border-[#333] flex flex-col md:flex-row justify-between items-center sticky top-0 bg-[#1a1a1a] z-[100]">
          <h1 className="text-3xl font-bold mb-4 md:mb-0 text-[#F5C518]">إدارة واجهة WIND</h1>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`font-bold py-3 px-10 rounded shadow-lg transition-all duration-300 ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#F5C518] hover:bg-yellow-500 text-black hover:scale-105'}`}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ كل التغييرات'}
          </button>
        </div>

        {/* أزرار التبويبات للتنظيم */}
        <div className="flex bg-[#121212] border-b border-[#333]">
          <button onClick={() => setActiveTab('layout')} className={`flex-1 py-4 font-black transition-all ${activeTab === 'layout' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>1. خريطة الأقسام</button>
          <button onClick={() => setActiveTab('hero')} className={`flex-1 py-4 font-black transition-all ${activeTab === 'hero' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>2. محتوى الهيرو</button>
          <button onClick={() => setActiveTab('featured')} className={`flex-1 py-4 font-black transition-all ${activeTab === 'featured' ? 'text-[#F5C518] border-b-2 border-[#F5C518] bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>3. محتوى Featured</button>
        </div>

        <div className="p-8">

          {/* === التبويب الأول: محرك الترتيب الجديد === */}
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
               <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <h2 className="text-2xl font-bold">هيكلة وترتيب الصفحة (Layout)</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">هنا يمكنك تحديد ترتيب ظهور الأقسام في الصفحة الرئيسية وربطها بالتصميمات الموجودة في `designRegistry.js`.</p>
              
              <div className="space-y-4">
                {layoutSections.map((section, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[#242424] border border-[#333] rounded-xl group relative">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveSection(index, 'up')} className="text-gray-500 hover:text-[#F5C518] transition-colors">▲</button>
                      <button onClick={() => moveSection(index, 'down')} className="text-gray-500 hover:text-[#F5C518] transition-colors">▼</button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-widest">نوع السيكشن (Category)</label>
                        <select 
                          value={section.category}
                          onChange={(e) => handleLayoutChange(index, 'category', e.target.value)}
                          className="w-full bg-[#121212] border border-[#444] p-2 rounded text-sm focus:border-[#F5C518] outline-none"
                        >
                          <option value="HERO_SECTION">Hero Section</option>
                          <option value="FEATURED_SECTION">Featured Section</option>
                          <option value="PRODUCTS_MARQUEE">Products Marquee</option>
                          <option value="BEST_SELLERS">Best Sellers</option>
                          <option value="REVIEWS">Reviews Section</option>
                          <option value="STORY">Wind Story</option>
                          <option value="DISCOUNTS">Discounts Grid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-widest">معرف التصميم (Design ID)</label>
                        <input 
                          type="text"
                          value={section.designId}
                          onChange={(e) => handleLayoutChange(index, 'designId', e.target.value)}
                          placeholder="مثال: MODERN_SLIDER"
                          className="w-full bg-[#121212] border border-[#444] p-2 rounded text-sm focus:border-[#F5C518] outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => removeSection(index)}
                      className="text-red-900 hover:text-red-500 font-bold transition-opacity px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addNewSection}
                className="w-full py-4 border-2 border-dashed border-[#444] text-gray-500 hover:border-[#F5C518] hover:text-[#F5C518] rounded-xl transition-all font-bold"
              >
                + إضافة سيكشن جديد للهيكلية
              </button>
            </div>
          )}

          {/* === التبويب الثاني: الهيرو (كودك الأصلي بالحرف) === */}
          {activeTab === 'hero' && (
            <div className="space-y-12 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <h2 className="text-2xl font-bold">إدارة شرائح العرض (Hero Slides)</h2>
              </div>
              
              <div className="space-y-8">
                {slides.map((slide, index) => (
                  <div key={index} className="p-6 border border-[#333] rounded-xl bg-[#242424] relative shadow-md">
                    <div className="flex justify-between items-center mb-5 border-b border-[#333] pb-2">
                      <h3 className="font-semibold text-lg text-[#F5C518]">الشريحة رقم {index + 1}</h3>
                      <button onClick={() => removeSlide(index)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">حذف الشريحة</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">رابط الصورة الخلفية الرئيسية</label>
                        <input type="text" value={slide.image} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className="w-full p-2.5 border border-[#444] rounded-md outline-none bg-[#121212] text-white"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">الوسم المميّز</label>
                        <input type="text" value={slide.tag} onChange={(e) => handleSlideChange(index, 'tag', e.target.value)} className="w-full p-2.5 border border-[#444] rounded-md outline-none bg-[#121212] text-white"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">العنوان الرئيسي</label>
                        <input type="text" value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full p-2.5 border border-[#444] rounded-md outline-none bg-[#121212] text-white"/>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">وصف التصميم</label>
                        <textarea value={slide.desc} onChange={(e) => handleSlideChange(index, 'desc', e.target.value)} rows="2" className="w-full p-2.5 border border-[#444] rounded-md outline-none bg-[#121212] text-white resize-none"/>
                      </div>
                      <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5 text-xs">رابط البوستر المصغر</label>
                          <input type="text" value={slide.thumbnail} onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#444] rounded text-xs text-white"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5 text-xs">رابط المنتج المخصص</label>
                          <input type="text" value={slide.productLink} onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#444] rounded text-xs text-white"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5 text-xs">نص الزر</label>
                          <input type="text" value={slide.buttonText || ""} onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#444] rounded text-xs text-white"/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addNewSlide} className="mt-6 w-full py-4 border-2 border-dashed border-[#444] text-gray-400 font-bold rounded-xl hover:border-[#F5C518] hover:text-[#F5C518] transition-all">+ إضافة شريحة عرض جديدة</button>
              </div>

              {/* شريط الأقسام السفلية (من كودك الأصلي) */}
              <div className="pt-12 border-t border-[#333]">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>إدارة شريط الأقسام</h2>
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-4 items-end p-4 border border-[#333] rounded-lg bg-[#242424]">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-500 mb-1">اسم القسم</label>
                        <input type="text" value={category.title} onChange={(e) => handleCategoryChange(index, 'title', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#444] rounded text-white"/>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-500 mb-1">رابط القسم</label>
                        <input type="text" value={category.link} onChange={(e) => handleCategoryChange(index, 'link', e.target.value)} className="w-full p-2 bg-[#121212] border border-[#444] rounded text-white"/>
                      </div>
                      <button onClick={() => removeCategory(index)} className="bg-red-900/30 text-red-500 px-4 py-2 rounded font-bold border border-red-900/50">حذف</button>
                    </div>
                  ))}
                </div>
                <button onClick={addNewCategory} className="mt-4 px-6 py-2 border border-[#444] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة قسم جديد</button>
              </div>
            </div>
          )}

          {/* === التبويب الثالث: Featured (كودك الأصلي بالحرف) === */}
          {activeTab === 'featured' && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-[#F5C518] rounded-sm"></div>
                <h2 className="text-2xl font-bold">إدارة قسم (Featured Today)</h2>
              </div>

              <div className="bg-[#242424] p-6 rounded-xl border border-[#333] mb-8">
                <label className="block text-sm font-bold text-[#F5C518] mb-3">عنوان القسم الرئيسي</label>
                <input type="text" value={featuredData.title} onChange={handleFeaturedTitleChange} className="w-full md:w-1/2 p-3 border border-[#444] rounded bg-[#121212] text-white font-bold" dir="ltr"/>
              </div>

              <div className="space-y-6">
                {featuredData.cards.map((card, index) => (
                  <div key={index} className="p-6 border border-[#444] rounded-xl bg-[#2a2a2a] relative">
                    <div className="flex justify-between items-center mb-5 border-b border-[#444] pb-2">
                      <h3 className="font-semibold text-lg text-white">بطاقة رقم {index + 1}</h3>
                      <button onClick={() => removeFeaturedCard(index)} className="text-red-400 font-bold">حذف البطاقة</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">رابط الصورة (Image URL)</label>
                        <input type="text" value={card.image} onChange={(e) => handleFeaturedCardChange(index, 'image', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white"/>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">نوع الشارة (Badge Type)</label>
                        <select value={card.badgeType} onChange={(e) => handleFeaturedCardChange(index, 'badgeType', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white">
                          <option value="none">بدون شارة</option>
                          <option value="list">قائمة (List)</option>
                          <option value="photos">صور (Photos)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">العنوان أسفل الصورة</label>
                        <input type="text" value={card.mainTitle} onChange={(e) => handleFeaturedCardChange(index, 'mainTitle', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white"/>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">نص الرابط الملوّن</label>
                        <input type="text" value={card.linkText} onChange={(e) => handleFeaturedCardChange(index, 'linkText', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white"/>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">رابط التوجيه (URL)</label>
                        <input type="text" value={card.linkUrl} onChange={(e) => handleFeaturedCardChange(index, 'linkUrl', e.target.value)} className="w-full p-2.5 border border-[#444] rounded bg-[#121212] text-white" dir="ltr"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addNewFeaturedCard} className="w-full py-4 border border-[#F5C518] text-[#F5C518] font-black rounded-xl hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة بطاقة (Card) جديدة</button>
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