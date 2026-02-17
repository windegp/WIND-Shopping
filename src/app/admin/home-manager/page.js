"use client";
import { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
// تأكد من تثبيت المكتبة: npm install @hello-pangea/dnd
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sections, setSections] = useState([]); 
  const [categories, setCategories] = useState([]); 

  // --- 1. كتالوج التصميمات (Templates) ---
  // تم بناؤه بناءً على كود Page.js الخاص بك تماماً
  const availableTemplates = [
    // القوالب الثابتة (Components)
    { id: 'hero_section', name: 'بانر الهيرو (Hero)', type: 'static', icon: '🚩' },
    { id: 'trust_bar', name: 'شريط الثقة', type: 'static', icon: '🛡️' },
    { id: 'collections_slider', name: 'سلايدر الكولكشنات', type: 'static', icon: '⚪' },
    { id: 'reviews_parallax', name: 'آراء العملاء (Parallax)', type: 'static', icon: '💬' },
    { id: 'magazine_grid', name: 'مجلة WIND', type: 'static', icon: '📰' },
    { id: 'story_section', name: 'قصة WIND', type: 'static', icon: '📖' },
    { id: 'category_split', name: 'انقسام الفئات (فساتين/بلوزات)', type: 'static', icon: '✂️' },
    { id: 'winter_discounts', name: 'بانر التخفيضات', type: 'static', icon: '🏷️' },

    // القوالب الديناميكية (تحتاج منتجات)
    { id: 'carousel', name: 'شريط منتجات (Carousel)', type: 'dynamic', icon: '↔️' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', type: 'dynamic', icon: '🏃' },
    { id: 'featured', name: 'الأكثر مبيعاً (Best Seller)', type: 'dynamic', icon: '⭐' },
    { id: 'grid', name: 'شبكة منتجات (Grid)', type: 'dynamic', icon: '🔳' },
    
    // القوالب الجديدة
    { id: 'imdb', name: 'كارت أفقي (IMDb Style)', type: 'dynamic', icon: '🎫' },
    { id: 'masonry', name: 'شبكة بنترست (Masonry)', type: 'dynamic', icon: '🧱' },
  ];

  // --- 2. الهيكلة الافتراضية (مطابقة لـ Page.js القديم) ---
  // هذا ما سيتم تحميله إذا كانت قاعدة البيانات فارغة
  const defaultSiteStructure = [
    { id: '1', title: "بانر الهيرو", template: "hero_section" },
    { id: '2', title: "أحدث صيحات WIND", template: "carousel", collectionSlug: "new-arrivals" },
    { id: '3', title: "تسوق التشكيلة الجديدة", template: "marquee", collectionSlug: "all" },
    { id: '4', title: "الأكثر مبيعاً", template: "featured", collectionSlug: "all" },
    { id: '5', title: "شريط الثقة", template: "trust_bar" },
    { id: '6', title: "مجموعات مميزة", template: "collections_slider" },
    { id: '7', title: "آراء عائلة WIND", template: "reviews_parallax" },
    { id: '8', title: "WIND Magazine", template: "magazine_grid" },
    { id: '9', title: "الأعلى تقييماً", template: "grid", collectionSlug: "all" },
    { id: '10', title: "قصة WIND", template: "story_section" },
    { id: '11', title: "تسوق حسب الفئة", template: "category_split" },
    { id: '12', title: "تخفيضات WIND الحصرية", template: "winter_discounts" }
  ];

  // --- 3. جلب البيانات والتهيئة ---
  useEffect(() => {
    const initSystem = async () => {
      setInitialLoading(true);
      try {
        // جلب الأقسام (Categories)
        const prodsSnap = await getDocs(collection(db, "products"));
        const catsSet = new Set(['all', 'new-arrivals']);
        prodsSnap.docs.forEach(doc => {
           const d = doc.data();
           if(d.category) catsSet.add(d.category);
           if(Array.isArray(d.categories)) d.categories.forEach(c => catsSet.add(c));
        });
        setCategories([...catsSet]);

        // جلب إعدادات الصفحة
        const docRef = doc(db, "settings", "homePage");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().sections) {
          setSections(docSnap.data().sections);
        } else {
          // إذا لم توجد إعدادات، نستخدم الهيكلة الافتراضية ونحفظها
          console.log("Applying Default Structure...");
          setSections(defaultSiteStructure);
          await setDoc(docRef, { sections: defaultSiteStructure }, { merge: true });
        }
      } catch (error) { console.error(error); } 
      finally { setInitialLoading(false); }
    };
    initSystem();
  }, []);

  // --- 4. دوال التحكم (Add, Remove, Reorder, Save) ---
  
  const handleAddSection = (template) => {
    const newSection = {
      id: Date.now().toString(),
      title: template.name, // عنوان مبدئي
      template: template.id,
      collectionSlug: 'all', // افتراضي
      data: {} // لتخزين الصور والنصوص لاحقاً
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (id) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "homePage"), { 
        sections, 
        lastUpdated: new Date().toISOString() 
      }, { merge: true });
      alert("✅ تم حفظ ترتيب الواجهة بنجاح!");
    } catch (error) {
      alert("❌ حدث خطأ أثناء الحفظ");
      console.error(error);
    }
    setLoading(false);
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center text-[#F5C518] bg-[#121212]">جاري تحميل النظام...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-0 bg-[#121212] z-50 py-4 border-b border-[#333]">
        <div>
           <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
           <p className="text-xs text-gray-500">قم بسحب الأقسام لإعادة ترتيبها</p>
        </div>
        <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#F5C518] text-black font-bold px-8 py-3 rounded hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all"
        >
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* المنطقة اليمنى: قائمة الأقسام الحالية (Draggable) */}
        <div className="lg:col-span-2">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 pb-20">
                            {sections.map((section, index) => {
                                const templateInfo = availableTemplates.find(t => t.id === section.template) || {};
                                return (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`bg-[#1A1A1A] p-4 rounded border ${snapshot.isDragging ? 'border-[#F5C518] shadow-2xl z-50' : 'border-[#333]'} flex items-center justify-between group`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-2 bg-[#121212] rounded">⠿</div>
                                                    <div className="text-2xl">{templateInfo.icon}</div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-200">{section.title}</h4>
                                                        <span className="text-[10px] bg-[#222] text-gray-400 px-2 py-0.5 rounded border border-[#333]">{templateInfo.name}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveSection(section.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded transition-colors text-xs border border-transparent hover:border-red-900/30">حذف</button>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                            {sections.length === 0 && <div className="text-center py-10 text-gray-500 border border-dashed border-[#333] rounded">القائمة فارغة، أضف أقساماً جديدة.</div>}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>

        {/* المنطقة اليسرى: إضافة أقسام جديدة */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-[#F5C518] mb-4 border-b border-[#333] pb-2">إضافة قسم جديد</h3>
            <div className="space-y-2">
                {availableTemplates.map(template => (
                    <button 
                        key={template.id}
                        onClick={() => handleAddSection(template)}
                        className="w-full flex items-center gap-3 p-3 bg-[#121212] hover:bg-[#222] border border-[#333] hover:border-[#F5C518]/50 rounded transition-all text-right group"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">{template.icon}</span>
                        <div>
                            <div className="font-bold text-xs text-gray-300 group-hover:text-white">{template.name}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}