"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

// --- قائمة الأقسام المتاحة للربط المباشر مع DESIGN_REGISTRY ---
const AVAILABLE_SECTIONS = [
  { label: "الهيرو الرئيسي (Hero)", category: "HERO_SECTION", designId: "MODERN_SLIDER" },
  { label: "قسم المميز (Featured Today)", category: "FEATURED_SECTION", designId: "IMDB_STYLE" },
  { label: "شريط المنتجات المتحرك (Marquee)", category: "PRODUCTS_MARQUEE", designId: "INFINITE_SCROLL" },
  { label: "الأكثر مبيعاً (Best Sellers)", category: "BEST_SELLERS", designId: "GRID_WITH_FEATURED" },
  { label: "شريط الثقة والإحصائيات", category: "TRUST_BAR", designId: "STATS_STRIP" },
  { label: "مجموعات مميزة (Collections)", category: "COLLECTIONS", designId: "MAIN_GRID" },
  { label: "آراء العملاء (Reviews)", category: "REVIEWS", designId: "MARQUEE_REVIEWS" },
  { label: "المجلة والمقالات (Magazine)", category: "MAGAZINE", designId: "BENTO_STYLE" },
  { label: "قصة البراند (Story)", category: "STORY", designId: "KEN_BURNS_FULL" },
  { label: "شبكة تسوق بالفئة (Categories)", category: "CATEGORIES_GRID", designId: "SPLIT_GRID" },
  { label: "تخفيضات وعروض (Discounts)", category: "DISCOUNTS", designId: "PROMO_GRID" }
];

export default function HomeManagerPage() {
  const [activeTab, setActiveTab] = useState('layout'); 
  
  // 1. حالة ترتيب الأقسام (المحرك الديناميكي)
  const [layoutSections, setLayoutSections] = useState([]);
  
  // 2. حالات الهيرو وتصفح الأقسام
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // 3. حالة قسم Featured 
  const [featuredData, setFeaturedData] = useState({ title: "Featured today", cards: [] });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // جلب ترتيب الأقسام
        const layoutSnap = await getDoc(doc(db, "homepage", "layout_config"));
        if (layoutSnap.exists()) {
          setLayoutSections(layoutSnap.data().sections || []);
        }

        // جلب بيانات الهيرو والأقسام السفلية
        const heroSnap = await getDoc(doc(db, "homepage", "main-hero"));
        if (heroSnap.exists()) {
          setSlides(heroSnap.data().slides || []);
          setCategories(heroSnap.data().categories || []);
        } else {
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
          setCategories([{ title: "", link: "" }]);
        }

        // جلب بيانات Featured
        const featSnap = await getDoc(doc(db, "homepage", "featured-section"));
        if (featSnap.exists()) {
          setFeaturedData(featSnap.data());
        }

      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // ==========================================
  // --- دوال تبويب (ترتيب الصفحة) ---
  // ==========================================
  const addNewLayoutSection = () => {
    setLayoutSections([...layoutSections, { 
      category: AVAILABLE_SECTIONS[0].category, 
      designId: AVAILABLE_SECTIONS[0].designId, 
      data: { title: "", subTitle: "" } 
    }]);
  };

  const handleLayoutSelection = (index, selectedLabel) => {
    const selectedObj = AVAILABLE_SECTIONS.find(s => s.label === selectedLabel);
    if (selectedObj) {
      const updated = [...layoutSections];
      updated[index].category = selectedObj.category;
      updated[index].designId = selectedObj.designId;
      setLayoutSections(updated);
    }
  };

  const handleLayoutDataChange = (index, field, value) => {
    const updated = [...layoutSections];
    if (!updated[index].data) updated[index].data = {};
    updated[index].data[field] = value;
    setLayoutSections(updated);
  };

  const moveSection = (index, direction) => {
    const updated = [...layoutSections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < updated.length) {
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      setLayoutSections(updated);
    }
  };

  const removeLayoutSection = (index) => {
    setLayoutSections(layoutSections.filter((_, i) => i !== index));
  };

  // ==========================================
  // --- دوال تبويب (الهيرو) ---
  // ==========================================
  const handleSlideChange = (index, field, value) => {
    const updated = [...slides];
    updated[index][field] = value;
    setSlides(updated);
  };
  const handleCategoryChange = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);
  };

  // ==========================================
  // --- دوال تبويب (Featured) ---
  // ==========================================
  const handleFeaturedCardChange = (index, field, value) => {
    const updatedCards = [...featuredData.cards];
    updatedCards[index][field] = value;
    setFeaturedData({ ...featuredData, cards: updatedCards });
  };

  // ==========================================
  // --- دالة الحفظ الشاملة ---
  // ==========================================
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "homepage", "layout_config"), { sections: layoutSections });
      await setDoc(doc(db, "homepage", "main-hero"), { slides, categories });
      await setDoc(doc(db, "homepage", "featured-section"), featuredData);
      alert("تم حفظ جميع الإعدادات! توجه للصفحة الرئيسية لرؤية التحديثات.");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#F5C518] font-bold text-xl">جاري تهيئة لوحة التحكم...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-cairo text-white pb-20" dir="rtl">
      
      {/* --- الهيدر العلوي الثابت --- */}
      <div className="sticky top-0 z-[100] bg-[#121212] border-b border-[#333] shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#F5C518] tracking-tight">WIND STUDIO</h1>
            <p className="text-gray-400 text-xs mt-1">مدير واجهة المتجر الرئيسية</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold text-sm transition-all duration-300 ${saving ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#F5C518] hover:bg-[#ffdb4d] text-black shadow-[0_0_15px_rgba(245,197,24,0.3)]'}`}
          >
            {saving ? 'جاري المزامنة...' : 'حفظ التحديثات ونشرها'}
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* --- القائمة الجانبية (Tabs) --- */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button onClick={() => setActiveTab('layout')} className={`w-full text-right px-5 py-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'layout' ? 'bg-[#F5C518] text-black shadow-md' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-[#333]'}`}>
            1. تخطيط الصفحة (Layout)
          </button>
          <button onClick={() => setActiveTab('hero')} className={`w-full text-right px-5 py-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'hero' ? 'bg-[#F5C518] text-black shadow-md' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-[#333]'}`}>
            2. محتوى الهيرو (Hero)
          </button>
          <button onClick={() => setActiveTab('featured')} className={`w-full text-right px-5 py-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'featured' ? 'bg-[#F5C518] text-black shadow-md' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-[#333]'}`}>
            3. قسم Featured Today
          </button>
        </div>

        {/* --- منطقة المحتوى المتغيرة --- */}
        <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl p-8 shadow-2xl min-h-[600px]">
          
          {/* ============================================================== */}
          {/* التبويب الأول: تخطيط الصفحة (تم تطويره ليكون سهل ومفهوم) */}
          {/* ============================================================== */}
          {activeTab === 'layout' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <div className="mb-8 border-b border-[#333] pb-6">
                <h2 className="text-2xl font-black mb-2">تخطيط الصفحة الرئيسية</h2>
                <p className="text-gray-400 text-sm leading-relaxed">قم بإضافة الأقسام، ترتيبها بالأسهم، وتعديل عناوينها. النظام سيقوم بربطها تلقائياً بالبيانات الحية (مثل المنتجات الأكثر مبيعاً).</p>
              </div>

              <div className="space-y-4">
                {layoutSections.map((section, index) => {
                  const currentSectionInfo = AVAILABLE_SECTIONS.find(s => s.category === section.category && s.designId === section.designId) || AVAILABLE_SECTIONS[0];
                  
                  return (
                    <div key={index} className="flex flex-col md:flex-row gap-4 p-5 bg-[#121212] border border-[#333] rounded-lg items-center group hover:border-[#F5C518] transition-colors">
                      {/* أسهم الترتيب */}
                      <div className="flex md:flex-col gap-2">
                        <button onClick={() => moveSection(index, 'up')} className="bg-[#222] p-2 rounded text-gray-400 hover:text-[#F5C518] hover:bg-[#333]">▲</button>
                        <button onClick={() => moveSection(index, 'down')} className="bg-[#222] p-2 rounded text-gray-400 hover:text-[#F5C518] hover:bg-[#333]">▼</button>
                      </div>

                      {/* إعدادات القسم */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="md:col-span-1">
                          <label className="block text-[11px] text-[#F5C518] font-bold mb-1">اختر القسم</label>
                          <select 
                            value={currentSectionInfo.label}
                            onChange={(e) => handleLayoutSelection(index, e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"
                          >
                            {AVAILABLE_SECTIONS.map((opt, i) => <option key={i} value={opt.label}>{opt.label}</option>)}
                          </select>
                        </div>
                        
                        <div className="md:col-span-1">
                          <label className="block text-[11px] text-gray-400 font-bold mb-1">العنوان الرئيسي للقسم (اختياري)</label>
                          <input 
                            type="text" 
                            value={section.data?.title || ""} 
                            onChange={(e) => handleLayoutDataChange(index, 'title', e.target.value)}
                            placeholder="مثال: تشكيلتنا الجديدة"
                            className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-[11px] text-gray-400 font-bold mb-1">العنوان الفرعي (اختياري)</label>
                          <input 
                            type="text" 
                            value={section.data?.subTitle || ""} 
                            onChange={(e) => handleLayoutDataChange(index, 'subTitle', e.target.value)}
                            placeholder="مثال: أناقة لا مثيل لها"
                            className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"
                          />
                        </div>
                      </div>

                      {/* زر الحذف */}
                      <button onClick={() => removeLayoutSection(index)} className="bg-red-900/20 text-red-500 p-3 rounded border border-red-900/50 hover:bg-red-900/50 transition-colors" title="حذف القسم">
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <button onClick={addNewLayoutSection} className="mt-6 w-full py-4 border-2 border-dashed border-[#333] text-gray-400 font-bold rounded-lg hover:border-[#F5C518] hover:text-[#F5C518] bg-[#121212] transition-all">
                + إدراج قسم جديد في الصفحة
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* التبويب الثاني: محتوى الهيرو (المنسق والمنظم) */}
          {/* ============================================================== */}
          {activeTab === 'hero' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
               <div className="mb-8 border-b border-[#333] pb-6">
                <h2 className="text-2xl font-black mb-2">إدارة شرائح الهيرو الرئيسي</h2>
                <p className="text-gray-400 text-sm">ارفع الصور، واضبط النصوص والروابط الخاصة بالشاشة الأولى للموقع.</p>
              </div>

              <div className="space-y-8">
                {slides.map((slide, index) => (
                  <div key={index} className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-[#1a1a1a] px-6 py-4 border-b border-[#333] flex justify-between items-center">
                      <h3 className="font-bold text-[#F5C518]">شريحة العرض #{index + 1}</h3>
                      <button onClick={() => removeSlide(index)} className="text-red-400 text-xs font-bold hover:underline">حذف الشريحة</button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-2">رابط الصورة الخلفية عالية الدقة</label>
                        <input type="text" value={slide.image} onChange={(e) => handleSlideChange(index, 'image', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">الوسم (شريط أصفر صغير)</label>
                        <input type="text" value={slide.tag} onChange={(e) => handleSlideChange(index, 'tag', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
                        <input type="text" value={slide.title} onChange={(e) => handleSlideChange(index, 'title', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-2">وصف قصير</label>
                        <textarea value={slide.desc} onChange={(e) => handleSlideChange(index, 'desc', e.target.value)} rows="2" className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518] resize-none"/>
                      </div>

                      <div className="md:col-span-2 bg-[#1a1a1a] border border-[#333] p-5 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-[#F5C518] mb-2">رابط البوستر المصغر</label>
                          <input type="text" value={slide.thumbnail} onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)} className="w-full bg-[#121212] border border-[#444] p-2.5 rounded text-xs text-white outline-none focus:border-[#F5C518]"/>
                        </div>
                        <div>
                          <label className="block text-xs text-[#F5C518] mb-2">رابط زر الشراء</label>
                          <input type="text" value={slide.productLink} onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)} className="w-full bg-[#121212] border border-[#444] p-2.5 rounded text-xs text-white outline-none focus:border-[#F5C518]"/>
                        </div>
                        <div>
                          <label className="block text-xs text-[#F5C518] mb-2">نص زر الشراء</label>
                          <input type="text" value={slide.buttonText || ""} onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)} className="w-full bg-[#121212] border border-[#444] p-2.5 rounded text-xs text-white outline-none focus:border-[#F5C518]"/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addNewSlide} className="w-full py-4 border border-[#444] bg-[#121212] text-white font-bold rounded-lg hover:border-[#F5C518] transition-all">+ إضافة شريحة عرض جديدة</button>
              </div>

              {/* إدارة تصفح الأقسام السفلية */}
              <div className="mt-16 border-t border-[#333] pt-8">
                <h3 className="text-xl font-bold mb-6">شريط أزرار تصفح الأقسام (أسفل الهيرو)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex gap-2 p-3 bg-[#121212] border border-[#333] rounded-lg items-center">
                      <input type="text" value={cat.title} onChange={(e) => handleCategoryChange(idx, 'title', e.target.value)} placeholder="اسم الزر" className="w-1/3 bg-[#1a1a1a] border border-[#444] p-2 rounded text-xs text-white outline-none"/>
                      <input type="text" value={cat.link} onChange={(e) => handleCategoryChange(idx, 'link', e.target.value)} placeholder="الرابط" className="flex-1 bg-[#1a1a1a] border border-[#444] p-2 rounded text-xs text-white outline-none"/>
                      <button onClick={() => removeCategory(idx)} className="text-red-500 hover:text-red-400 px-2">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addNewCategory} className="mt-4 text-[#F5C518] text-sm font-bold">+ إضافة زر تصفح جديد</button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* التبويب الثالث: Featured (تصميم المجلات والـ IMDB) */}
          {/* ============================================================== */}
          {activeTab === 'featured' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
               <div className="mb-8 border-b border-[#333] pb-6">
                <h2 className="text-2xl font-black mb-2">قسم المميز (Featured Today)</h2>
                <p className="text-gray-400 text-sm">إدارة البطاقات المخصصة بتصميم المجلات، مع إمكانية إضافة شارات للصور.</p>
              </div>

              <div className="mb-8 bg-[#121212] p-6 rounded-lg border border-[#333]">
                <label className="block text-sm font-bold text-[#F5C518] mb-3">العنوان الرئيسي للقسم بأكمله</label>
                <input type="text" value={featuredData.title} onChange={handleFeaturedTitleChange} className="w-full md:w-1/2 p-3 bg-[#1a1a1a] border border-[#444] rounded text-white font-bold outline-none focus:border-[#F5C518]" dir="ltr"/>
              </div>

              <div className="space-y-6">
                {featuredData.cards.map((card, index) => (
                  <div key={index} className="bg-[#121212] border border-[#333] p-6 rounded-xl relative">
                    <div className="flex justify-between items-center mb-5 border-b border-[#333] pb-2">
                      <h3 className="font-bold text-white">بطاقة رقم #{index + 1}</h3>
                      <button onClick={() => removeFeaturedCard(index)} className="text-red-400 text-xs font-bold hover:underline">حذف</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-2">رابط الصورة (Image URL)</label>
                        <input type="text" value={card.image} onChange={(e) => handleFeaturedCardChange(index, 'image', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">نوع الشارة (Badge)</label>
                        <select value={card.badgeType} onChange={(e) => handleFeaturedCardChange(index, 'badgeType', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]">
                          <option value="none">بدون شارة (صورة فقط)</option>
                          <option value="list">أيقونة قائمة (List)</option>
                          <option value="photos">أيقونة صور (Photos)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">العنوان أسفل الصورة</label>
                        <input type="text" value={card.mainTitle} onChange={(e) => handleFeaturedCardChange(index, 'mainTitle', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">نص الرابط الملوّن</label>
                        <input type="text" value={card.linkText} onChange={(e) => handleFeaturedCardChange(index, 'linkText', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]"/>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">رابط التوجيه (URL)</label>
                        <input type="text" value={card.linkUrl} onChange={(e) => handleFeaturedCardChange(index, 'linkUrl', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] p-3 rounded text-sm text-white outline-none focus:border-[#F5C518]" dir="ltr"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addNewFeaturedCard} className="mt-6 w-full py-4 border border-[#F5C518] text-[#F5C518] font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">+ إضافة بطاقة (Card) جديدة</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}