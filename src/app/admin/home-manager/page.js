"use client";
import { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState([]); 
  const [sections, setSections] = useState([]); 
  const [uploadingSectionId, setUploadingSectionId] = useState(null);

  // --- تعريف القوالب (Templates) ---
  // هذه هي الأشكال المتاحة في موقعك، لن نغيرها لضمان ثبات التصميم
  const designTemplates = [
    { id: 'hero_section', name: 'بانر الهيرو (Hero)', type: 'static' },
    { id: 'carousel', name: 'شريط منتجات (Carousel)', type: 'dynamic' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', type: 'dynamic' },
    { id: 'featured', name: 'الأكثر مبيعاً (Best Seller)', type: 'dynamic' },
    { id: 'grid', name: 'شبكة منتجات (Grid)', type: 'dynamic' },
    { id: 'trust_bar', name: 'شريط الثقة', type: 'static' },
    { id: 'reviews_parallax', name: 'آراء العملاء (Parallax)', type: 'static' },
    { id: 'story_section', name: 'قصة WIND', type: 'static' },
    { id: 'magazine_grid', name: 'المجلة (Magazine)', type: 'static' },
    { id: 'collections_slider', name: 'سلايدر الكولكشنات', type: 'static' },
    { id: 'category_split', name: 'انقسام الفئات (Split Footer)', type: 'static' },
    { id: 'winter_discounts', name: 'بانر التخفيضات', type: 'static' },
    // إضافات جديدة
    { id: 'imdb', name: 'كارت أفقي (IMDb)', type: 'dynamic' },
    { id: 'masonry', name: 'شبكة بنترست', type: 'dynamic' }
  ];

  useEffect(() => {
    const initSystem = async () => {
      setInitialLoading(true);
      try {
        // 1. جلب كل الأقسام (Categories) الموجودة في المنتجات لضمان عدم وجود قسم فارغ
        const prodsSnap = await getDocs(collection(db, "products"));
        const allCats = new Set();
        prodsSnap.docs.forEach(doc => {
            const data = doc.data();
            if(Array.isArray(data.categories)) data.categories.forEach(c => allCats.add(c));
        });
        setCategories([...allCats, 'new-arrivals', 'all'].sort());

        // 2. جلب إعدادات الصفحة
        const docRef = doc(db, "settings", "homePage");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().sections) {
          setSections(docSnap.data().sections);
        } else {
          // التأسيس الأولي (Seed) في حالة أول مرة
          const defaultStructure = [
            { id: '1', title: "بانر الهيرو", template: "hero_section", data: { imageUrl: "", buttonText: "تسوق الآن", link: "/collections/all", description: "WIND STYLE" } },
            { id: '2', title: "أحدث صيحات WIND", template: "carousel", collectionSlug: "new-arrivals" },
            { id: '3', title: "تسوق التشكيلة الجديدة", template: "marquee", collectionSlug: "all" },
            { id: '4', title: "الأكثر مبيعاً", template: "featured", collectionSlug: "all" },
            { id: '5', title: "شريط الثقة", template: "trust_bar" },
            { id: '6', title: "مجموعات مميزة", template: "collections_slider" },
            { id: '7', title: "آراء العملاء", template: "reviews_parallax" },
            { id: '8', title: "المجلة", template: "magazine_grid" },
            { id: '9', title: "الأعلى تقييماً", template: "grid", collectionSlug: "all" },
            { id: '10', title: "قصة WIND", template: "story_section", data: { description: "ننسج خيوط الدفء..." } },
            { id: '11', title: "تسوق حسب الفئة", template: "category_split" },
            { id: '12', title: "تخفيضات", template: "winter_discounts", data: { description: "خصومات حصرية" } }
          ];
          setSections(defaultStructure);
          await setDoc(docRef, { sections: defaultStructure }, { merge: true });
        }
      } catch (error) { console.error(error); } 
      finally { setInitialLoading(false); }
    };
    initSystem();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "homePage"), { sections, lastUpdated: new Date().toISOString() }, { merge: true });
      alert("✅ تم حفظ التغييرات وتحديث الواجهة!");
    } catch (e) { alert("❌ خطأ في الحفظ"); }
    setLoading(false);
  };

  const handleImageUpload = async (file, sectionId) => {
    if (!file) return;
    setUploadingSectionId(sectionId);
    try {
      const storageRef = ref(storage, `layout/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, data: { ...s.data, imageUrl: url } } : s));
    } catch (e) { alert("فشل الرفع"); }
    setUploadingSectionId(null);
  };

  const updateSection = (id, key, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s));
  };
  
  const updateData = (id, key, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data: { ...(s.data || {}), [key]: value } } : s));
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "قسم جديد", template: "carousel", collectionSlug: "all", data: {} }]);
  };

  const onDragEnd = (res) => {
    if(!res.destination) return;
    const items = [...sections];
    const [reordered] = items.splice(res.source.index, 1);
    items.splice(res.destination.index, 0, reordered);
    setSections(items);
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center bg-[#121212] text-[#F5C518]">جاري تحميل النظام...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8" dir="rtl">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#121212] z-50 py-4 border-b border-[#333]">
        <h1 className="text-2xl font-black text-[#F5C518]">لوحة تحكم WIND (Shopify Mode)</h1>
        <div className="flex gap-2">
            <button onClick={addSection} className="border border-[#F5C518] text-[#F5C518] px-4 py-2 rounded font-bold">+ إضافة قسم</button>
            <button onClick={handleSave} disabled={loading} className="bg-[#F5C518] text-black px-6 py-2 rounded font-bold shadow-lg">{loading ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 max-w-4xl mx-auto pb-20">
                    {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-[#1A1A1A] border ${snapshot.isDragging ? 'border-[#F5C518]' : 'border-[#333]'} p-4 rounded-lg group transition-all`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 hover:text-white p-2">⠿</div>
                                            <span className="bg-[#333] text-xs px-2 py-1 rounded text-[#F5C518] font-bold">{index + 1}</span>
                                            <h3 className="font-bold text-lg">{section.title || "بدون عنوان"}</h3>
                                        </div>
                                        <button onClick={() => confirm("حذف؟") && setSections(sections.filter(s => s.id !== section.id))} className="text-red-500 text-xs border border-red-900/30 px-3 py-1 rounded hover:bg-red-900/20">حذف</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500">عنوان القسم</label>
                                            <input value={section.title || ""} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm text-white focus:border-[#F5C518] outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500">نوع التصميم (Template)</label>
                                            <select value={section.template} onChange={(e) => updateSection(section.id, 'template', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm text-[#F5C518] font-bold outline-none">
                                                {designTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>

                                        {/* إعدادات الأقسام الديناميكية (التي تحتاج منتجات) */}
                                        {designTemplates.find(t => t.id === section.template)?.type === 'dynamic' && (
                                            <div className="md:col-span-2 bg-[#121212] p-3 rounded border border-[#333]">
                                                <label className="text-[10px] text-gray-500 block mb-1">اختر الكولكشن (المصدر)</label>
                                                <select value={section.collectionSlug || "all"} onChange={(e) => updateSection(section.id, 'collectionSlug', e.target.value)} className="w-full bg-[#222] border border-[#333] p-2 rounded text-sm text-white outline-none">
                                                    <option value="all">كل المنتجات (All)</option>
                                                    <option value="new-arrivals">وصل حديثاً (New Arrivals)</option>
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                                <p className="text-[10px] text-gray-500 mt-1">* تأكد أنك أضفت منتجات لهذا القسم بالفعل</p>
                                            </div>
                                        )}

                                        {/* إعدادات المحتوى (صور ونصوص) */}
                                        {['hero_section', 'story_section', 'winter_discounts'].includes(section.template) && (
                                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-black/30 p-3 rounded">
                                                <div>
                                                    <label className="text-[10px] text-gray-500">الصورة</label>
                                                    <div className="border border-dashed border-[#444] p-2 text-center mt-1">
                                                        {section.data?.imageUrl && <img src={section.data.imageUrl} className="h-10 mx-auto mb-1 rounded" />}
                                                        {uploadingSectionId === section.id ? <span className="text-xs text-yellow-500">جاري الرفع...</span> : 
                                                            <input type="file" className="text-[10px] w-full" onChange={(e) => handleImageUpload(e.target.files[0], section.id)} />
                                                        }
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <input placeholder="الوصف / النص" value={section.data?.description || ""} onChange={(e) => updateData(section.id, 'description', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-1 text-xs rounded" />
                                                    <input placeholder="نص الزر" value={section.data?.buttonText || ""} onChange={(e) => updateData(section.id, 'buttonText', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-1 text-xs rounded" />
                                                    <input placeholder="الرابط" value={section.data?.link || ""} onChange={(e) => updateData(section.id, 'link', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-1 text-xs rounded" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}