"use client";
import { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sections, setSections] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [uploadingSectionId, setUploadingSectionId] = useState(null);

  // --- 1. كتالوج القوالب (Templates Catalog) ---
  // هنا نحدد "المدخلات" المتاحة لكل نوع
  const availableTemplates = [
    // >> المحتوى الثابت (يحتاج صور ونصوص) <<
    { id: 'hero_section', name: 'بانر الهيرو (Hero)', type: 'static', icon: '🚩', inputs: ['image', 'title', 'subtitle', 'button'] },
    { id: 'winter_discounts', name: 'بانر التخفيضات', type: 'static', icon: '🏷️', inputs: ['title', 'subtitle'] },
    { id: 'story_section', name: 'قصة WIND', type: 'static', icon: '📖', inputs: ['image', 'title', 'description'] },
    { id: 'magazine_grid', name: 'مجلة WIND', type: 'static', icon: '📰', inputs: ['title', 'subtitle'] },
    
    // >> المكونات الجاهزة (لا تحتاج مدخلات معقدة) <<
    { id: 'trust_bar', name: 'شريط الثقة', type: 'static', icon: '🛡️', inputs: [] },
    { id: 'reviews_parallax', name: 'آراء العملاء', type: 'static', icon: '💬', inputs: ['title'] },
    { id: 'collections_slider', name: 'سلايدر الكولكشنات', type: 'static', icon: '⚪', inputs: ['title'] },
    { id: 'category_split', name: 'انقسام الفئات (Split)', type: 'static', icon: '✂️', inputs: ['title'] },

    // >> المنتجات الديناميكية (تحتاج اختيار كولكشن) <<
    { id: 'carousel', name: 'شريط منتجات (Carousel)', type: 'dynamic', icon: '↔️' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', type: 'dynamic', icon: '🏃' },
    { id: 'featured', name: 'الأكثر مبيعاً (Best Seller)', type: 'dynamic', icon: '⭐' },
    { id: 'grid', name: 'شبكة منتجات (Grid)', type: 'dynamic', icon: '🔳' },
    
    // >> التصميمات المستقبلية <<
    { id: 'imdb', name: 'كارت أفقي (IMDb)', type: 'dynamic', icon: '🎫' },
    { id: 'masonry', name: 'شبكة بنترست', type: 'dynamic', icon: '🧱' },
  ];

  // --- 2. الهيكل الافتراضي (نسخة من موقعك الحالي) ---
  const defaultSiteStructure = [
    { id: '1', title: "بانر الهيرو", template: "hero_section", data: { title: "WIND STYLE", buttonText: "تسوق الآن" } },
    { id: '2', title: "أحدث صيحات WIND", template: "carousel", collectionSlug: "new-arrivals" },
    { id: '3', title: "تسوق التشكيلة الجديدة", template: "marquee", collectionSlug: "all" },
    { id: '4', title: "الأكثر مبيعاً", template: "featured", collectionSlug: "all" },
    { id: '5', title: "شريط الثقة", template: "trust_bar" },
    { id: '6', title: "مجموعات مميزة", template: "collections_slider" },
    { id: '7', title: "آراء عائلة WIND", template: "reviews_parallax" },
    { id: '8', title: "WIND Magazine", template: "magazine_grid" },
    { id: '9', title: "الأعلى تقييماً", template: "grid", collectionSlug: "all" },
    { id: '10', title: "قصة WIND", template: "story_section", data: { description: "ننسج خيوط الدفء..." } },
    { id: '11', title: "تسوق حسب الفئة", template: "category_split" },
    { id: '12', title: "تخفيضات WIND الحصرية", template: "winter_discounts" }
  ];

  // --- 3. التهيئة وجلب البيانات ---
  useEffect(() => {
    const initSystem = async () => {
      setInitialLoading(true);
      try {
        // جلب قائمة الكولكشنات من المنتجات
        const prodsSnap = await getDocs(collection(db, "products"));
        const catsSet = new Set(['all', 'new-arrivals']);
        prodsSnap.docs.forEach(doc => {
            const d = doc.data();
            if(d.category) catsSet.add(d.category);
            if(Array.isArray(d.categories)) d.categories.forEach(c => catsSet.add(c));
        });
        setCategories([...catsSet].sort());

        // جلب الترتيب المحفوظ
        const docRef = doc(db, "settings", "homePage");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().sections) {
          setSections(docSnap.data().sections);
        } else {
          // التأسيس الأولي (Seed)
          setSections(defaultSiteStructure);
          await setDoc(docRef, { sections: defaultSiteStructure }, { merge: true });
        }
      } catch (error) { console.error(error); } 
      finally { setInitialLoading(false); }
    };
    initSystem();
  }, []);

  // --- 4. دوال التعديل (Actions) ---

  const handleImageUpload = async (file, sectionId) => {
    if (!file) return;
    setUploadingSectionId(sectionId);
    try {
      const storageRef = ref(storage, `layout/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      // تحديث القسم بالصورة الجديدة
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, data: { ...s.data, imageUrl: url } } : s));
    } catch (e) { alert("فشل الرفع"); }
    setUploadingSectionId(null);
  };

  const updateSection = (id, field, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateSectionData = (id, field, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data: { ...(s.data || {}), [field]: value } } : s));
  };

  const handleAddSection = (template) => {
    const newSection = {
      id: Date.now().toString(),
      title: template.name,
      template: template.id,
      collectionSlug: 'all', 
      data: {}
    };
    setSections([...sections, newSection]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...sections];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setSections(items);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "homePage"), { sections, lastUpdated: new Date().toISOString() }, { merge: true });
      alert("✅ تم الحفظ وتحديث الموقع!");
    } catch (e) { alert("❌ خطأ في الحفظ"); }
    setLoading(false);
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center text-[#F5C518] bg-[#121212]">جاري تحميل النظام...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8 font-sans" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-0 bg-[#121212] z-50 py-4 border-b border-[#333] shadow-md">
        <div>
           <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
           <p className="text-xs text-gray-500">تحكم كامل في الأقسام والترتيب والمحتوى</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-[#F5C518] text-black font-bold px-8 py-3 rounded hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all">
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === القائمة اليمنى: تعديل الأقسام === */}
        <div className="lg:col-span-2">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 pb-20">
                            {sections.map((section, index) => {
                                const template = availableTemplates.find(t => t.id === section.template) || {};
                                const isDynamic = template.type === 'dynamic';
                                const inputs = template.inputs || [];

                                return (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-[#1A1A1A] rounded-lg border ${snapshot.isDragging ? 'border-[#F5C518] shadow-2xl z-50' : 'border-[#333]'} overflow-hidden group`}>
                                                
                                                {/* Header القسم */}
                                                <div className="p-4 bg-[#222] flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 hover:text-[#F5C518]">⠿</div>
                                                        <span className="text-xl">{template.icon}</span>
                                                        <div>
                                                            <input 
                                                                value={section.title || ""} 
                                                                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                                                className="bg-transparent text-white font-bold border-b border-transparent focus:border-[#F5C518] outline-none text-sm"
                                                                placeholder="عنوان القسم"
                                                            />
                                                            <p className="text-[10px] text-gray-500">{template.name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => confirm("حذف؟") && setSections(sections.filter(s => s.id !== section.id))} className="text-red-500 text-xs hover:bg-red-900/20 px-2 py-1 rounded">حذف</button>
                                                </div>

                                                {/* Body القسم (المدخلات الذكية) */}
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    
                                                    {/* 1. اختيار الكولكشن (للأقسام الديناميكية فقط) */}
                                                    {isDynamic && (
                                                        <div className="md:col-span-2 bg-[#121212] p-3 rounded border border-[#333]">
                                                            <label className="text-[10px] text-gray-500 block mb-1">مصدر المنتجات (Collection)</label>
                                                            <select 
                                                                value={section.collectionSlug || 'all'} 
                                                                onChange={(e) => updateSection(section.id, 'collectionSlug', e.target.value)}
                                                                className="w-full bg-[#222] border border-[#333] p-2 rounded text-sm text-white outline-none focus:border-[#F5C518]"
                                                            >
                                                                <option value="all">كل المنتجات (All)</option>
                                                                <option value="new-arrivals">وصل حديثاً (New Arrivals)</option>
                                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* 2. المدخلات المخصصة (صور ونصوص) */}
                                                    {inputs.includes('image') && (
                                                        <div className="row-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">صورة الخلفية</label>
                                                            <div className="border border-dashed border-[#444] bg-[#121212] p-2 text-center rounded relative min-h-[80px] flex flex-col items-center justify-center">
                                                                {section.data?.imageUrl && <img src={section.data.imageUrl} className="h-16 object-cover rounded mb-2" />}
                                                                {uploadingSectionId === section.id ? <span className="text-xs text-[#F5C518]">جاري الرفع...</span> : (
                                                                    <input type="file" className="text-[9px] w-full cursor-pointer" onChange={(e) => handleImageUpload(e.target.files[0], section.id)} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {inputs.includes('subtitle') && (
                                                        <div>
                                                            <label className="text-[10px] text-gray-500">العنوان الفرعي</label>
                                                            <input value={section.subTitle || ""} onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-xs rounded text-white" />
                                                        </div>
                                                    )}

                                                    {inputs.includes('description') && (
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] text-gray-500">الوصف</label>
                                                            <textarea value={section.data?.description || ""} onChange={(e) => updateSectionData(section.id, 'description', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-xs rounded text-white h-16 resize-none" />
                                                        </div>
                                                    )}

                                                    {inputs.includes('button') && (
                                                        <>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500">نص الزر</label>
                                                                <input value={section.data?.buttonText || ""} onChange={(e) => updateSectionData(section.id, 'buttonText', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-xs rounded text-white" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500">رابط الزر</label>
                                                                <input value={section.data?.link || ""} onChange={(e) => updateSectionData(section.id, 'link', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-xs rounded text-white" />
                                                            </div>
                                                        </>
                                                    )}

                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>

        {/* === القائمة اليسرى: إضافة أقسام === */}
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