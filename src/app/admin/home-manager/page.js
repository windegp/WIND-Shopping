"use client";
import { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [products, setProducts] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [sections, setSections] = useState([]); 
  const [uploadingSectionId, setUploadingSectionId] = useState(null);

  // --- 1. خيارات التصميم (تشمل كل تصميمات موقعك الحالي + تصميمات IMDb) ---
  const designStyles = [
    // تصميمات المنتجات (Collections)
    { id: 'carousel', name: 'شريط عرض (Carousel)', icon: '↔️', type: 'collection' },
    { id: 'grid', name: 'شبكة منتظمة (Grid)', icon: '🔳', type: 'collection' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', icon: '🏃', type: 'collection' },
    { id: 'featured', name: 'الأكثر مبيعاً (Best Seller Layout)', icon: '⭐', type: 'collection' },
    { id: 'imdb', name: 'كارت أفقي (IMDb Style)', icon: '🎫', type: 'collection' }, // جديد
    { id: 'ranked', name: 'قائمة مرقمة (Top 10)', icon: '🔢', type: 'collection' }, // جديد
    { id: 'masonry', name: 'شبكة بنترست (Pinterest)', icon: '🧱', type: 'collection' }, // جديد

    // المكونات الثابتة (Components) - تم تحويلها لبلوكات
    { id: 'hero_section', name: 'بانر الهيرو (Hero)', icon: '🚩', type: 'component' },
    { id: 'story_section', name: 'قصة WIND (Story)', icon: '📖', type: 'component' },
    { id: 'winter_discounts', name: 'بانر خصم (Discount)', icon: '🏷️', type: 'component' },
    { id: 'trust_bar', name: 'شريط الثقة (Trust Bar)', icon: '🛡️', type: 'component' },
    { id: 'reviews_parallax', name: 'آراء العملاء (Parallax)', icon: '💬', type: 'component' },
    { id: 'magazine_grid', name: 'مجلة WIND (Magazine)', icon: '📰', type: 'component' },
    { id: 'collections_slider', name: 'سلايدر الكولكشنات', icon: '⚪', type: 'component' },
    { id: 'category_split', name: 'انقسام الفئات (Split Footer)', icon: '✂️', type: 'component' }
  ];

  // --- 2. هيكل الموقع الحالي (نسخة طبق الأصل من Page.js القديم) ---
  // سيتم استخدام هذا الهيكل لملء لوحة التحكم تلقائياً
  const currentSiteStructure = [
    { 
      id: '1', title: "بانر الهيرو", subTitle: "", type: "component", slug: "", designType: "hero_section", 
      contentData: { imageUrl: "", buttonText: "تسوق الآن", link: "/collections/all", description: "WIND STYLE - الأناقة في كل تفصيلة" }
    },
    // تم تحويل الأقسام الديناميكية السابقة إلى بلوكات ثابتة لتبدأ بها
    { 
      id: '2', title: "أحدث صيحات WIND", subTitle: "تصاميم شتوية تلامس الروح", type: "collection", slug: "new-arrivals", designType: "carousel", 
      contentData: {}
    },
    { 
      id: '3', title: "تسوق التشكيلة الجديدة", subTitle: "أناقة WIND في كل خطوة", type: "collection", slug: "all", designType: "marquee", 
      contentData: {}
    },
    { 
      id: '4', title: "الأكثر مبيعاً", subTitle: "", type: "collection", slug: "all", designType: "featured", 
      contentData: {} 
    },
    { 
      id: '5', title: "شريط الثقة", subTitle: "", type: "component", slug: "", designType: "trust_bar", 
      contentData: {}
    },
    { 
      id: '6', title: "مجموعات مميزة", subTitle: "", type: "component", slug: "", designType: "collections_slider", 
      contentData: {}
    },
    { 
      id: '7', title: "آراء عائلة WIND", subTitle: "أصوات حقيقية - تجارب صادقة", type: "component", slug: "", designType: "reviews_parallax", 
      contentData: {}
    },
    { 
      id: '8', title: "WIND Magazine", subTitle: "مقالات في الأناقة", type: "component", slug: "", designType: "magazine_grid", 
      contentData: {}
    },
    { 
      id: '9', title: "الأعلى تقييماً", subTitle: "القطع التي نالت إعجاب الجميع", type: "collection", slug: "all", designType: "grid", 
      contentData: {}
    },
    { 
      id: '10', title: "قصة WIND", subTitle: "", type: "component", slug: "", designType: "story_section", 
      contentData: { imageUrl: "/images/story-bg.webp", description: "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية." }
    },
    { 
      id: '11', title: "تسوق حسب الفئة", subTitle: "", type: "component", slug: "", designType: "category_split", 
      contentData: {}
    },
    { 
      id: '12', title: "تخفيضات WIND الحصرية", subTitle: "لفترة محدودة", type: "component", slug: "", designType: "winter_discounts", 
      contentData: { buttonText: "اغتنم الفرصة", description: "خصومات حصرية لفترة محدودة" }
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // جلب المنتجات والفئات
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        setCategories(uniqueCats.sort());

        // جلب الإعدادات
        const settingsRef = doc(db, "settings", "homePage");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && settingsSnap.data().sections && settingsSnap.data().sections.length > 0) {
          // إذا وجدنا إعدادات محفوظة، نستخدمها
          const loadedSections = settingsSnap.data().sections.map(s => ({
            ...s, 
            id: s.id.toString(),
            excludedIds: s.excludedIds || [],
            contentData: s.contentData || { imageUrl: "", buttonText: "", link: "", description: "" }
          }));
          setSections(loadedSections);
        } else {
            // 🔥 التأسيس التلقائي: إذا كانت اللوحة فارغة، املأها بهيكل الموقع الحالي
            console.log("Auto-initializing site structure...");
            setSections(currentSiteStructure);
            // حفظ مبدئي لضمان ثبات الهيكل
            await setDoc(settingsRef, { sections: currentSiteStructure, lastUpdated: new Date().toISOString() }, { merge: true });
        }
      } catch (error) { console.error(error); } finally { setInitialLoading(false); }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (file, sectionId) => {
    if (!file) return;
    setUploadingSectionId(sectionId);
    try {
      const imageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setSections(prev => prev.map(sec => sec.id === sectionId ? { ...sec, contentData: { ...sec.contentData, imageUrl: downloadURL } } : sec));
      alert("✅ تم رفع الصورة!");
    } catch (error) { alert("❌ فشل الرفع"); console.error(error); } 
    finally { setUploadingSectionId(null); }
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(sec => {
      if (sec.id === id) {
        const updated = { ...sec, [field]: value };
        // تصفير الإعدادات عند تغيير النوع لتجنب التعارض
        if (field === 'type') {
            updated.excludedIds = [];
            updated.designType = value === 'component' ? 'hero_section' : 'carousel';
        }
        return updated;
      }
      return sec;
    }));
  };

  const updateContentData = (id, field, value) => {
    setSections(sections.map(sec => sec.id === id ? { ...sec, contentData: { ...(sec.contentData || {}), [field]: value } } : sec));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "homePage"), { sections, lastUpdated: new Date().toISOString() }, { merge: true });
      alert("✅ تم حفظ واجهة المتجر بنجاح!");
    } catch (error) { alert("❌ حدث خطأ أثناء الحفظ"); }
    setLoading(false);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };
  
  const removeSection = (id) => confirm("هل أنت متأكد من حذف هذا القسم؟") && setSections(sections.filter(s => s.id !== id));
  
  const addSection = () => setSections([...sections, { 
      id: Date.now().toString(), title: "قسم جديد", subTitle: "", type: "collection", slug: "", 
      designType: "carousel", excludedIds: [], contentData: { imageUrl: "", buttonText: "تصفح", link: "", description: "" } 
  }]);

  if (initialLoading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]">جاري استيراد أقسام الموقع الحالية...</div>;

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#121212] z-50 pb-4 border-b border-[#333]">
        <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
        <div className="flex gap-2">
           <button onClick={addSection} className="border border-[#F5C518] text-[#F5C518] px-4 py-2 rounded text-sm hover:bg-[#F5C518] hover:text-black transition-all">+ قسم جديد</button>
           <button onClick={handleSave} disabled={loading} className="bg-[#F5C518] text-black font-bold px-6 py-2 rounded hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)]">{loading ? "جاري..." : "حفظ التغييرات"}</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="main-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 pb-20 max-w-5xl mx-auto">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-[#1A1A1A] p-6 rounded-xl border-2 ${snapshot.isDragging ? 'border-[#F5C518] shadow-2xl scale-[1.02] z-50' : 'border-[#333]'} relative group transition-all`}>
                      <div {...provided.dragHandleProps} className="absolute top-4 right-4 text-gray-500 cursor-grab p-2 text-xl bg-[#121212] rounded border border-[#333]">⠿</div>
                      <button onClick={() => removeSection(section.id)} className="absolute top-4 left-4 text-red-500 text-xs border border-red-900/30 p-2 rounded opacity-50 hover:opacity-100 hover:bg-red-900/10">حذف 🗑️</button>

                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#222] text-[#F5C518] w-8 h-8 flex items-center justify-center rounded-full font-bold border border-[#F5C518]/20">{index + 1}</span>
                        <h3 className="font-bold text-gray-200">{section.title || "بدون عنوان"} <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-gray-400 mr-2">{designStyles.find(s => s.id === section.designType)?.name}</span></h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* العنوان والعنوان الفرعي */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">العنوان الرئيسي</label>
                            <input className="bg-[#121212] border border-[#333] p-3 rounded text-white w-full focus:border-[#F5C518] outline-none" value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">العنوان الفرعي</label>
                            <input className="bg-[#121212] border border-[#333] p-3 rounded text-white w-full focus:border-[#F5C518] outline-none" value={section.subTitle} onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)} />
                        </div>
                        
                        {/* خيارات التصميم (الأيقونات) */}
                        <div className="md:col-span-2">
                           <label className="text-xs text-gray-500 block mb-2">اختر شكل التصميم</label>
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                             {designStyles.filter(ds => ds.type === section.type).map(style => (
                               <div key={style.id} onClick={() => updateSection(section.id, 'designType', style.id)} className={`cursor-pointer p-2 rounded border text-center transition-all flex flex-col items-center justify-center gap-1 ${section.designType === style.id ? 'border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518]' : 'border-[#333] bg-[#121212] text-gray-500 hover:border-[#555]'}`}>
                                 <div className="text-xl">{style.icon}</div><div className="text-[9px] font-bold">{style.name}</div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* اختيار نوع القسم وتحديد الفئة */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">نوع المحتوى</label>
                            <select className="bg-[#121212] border border-[#333] p-3 rounded text-[#F5C518] font-bold w-full outline-none" value={section.type} onChange={(e) => updateSection(section.id, 'type', e.target.value)}>
                                <option value="collection">عرض منتجات (Collection)</option>
                                <option value="component">مكون / بنر (Component)</option>
                            </select>
                        </div>

                        {section.type === 'collection' && (
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">المجموعة المستهدفة</label>
                                <select className="bg-[#121212] border border-[#333] p-3 rounded text-white w-full outline-none" value={section.slug} onChange={(e) => updateSection(section.id, 'slug', e.target.value)}>
                                    <option value="all">كل المنتجات</option>
                                    <option value="new-arrivals">وصل حديثاً</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}

                        {/* محرر المحتوى المتقدم (للصور والنصوص) - يظهر للأقسام التي تحتاج تخصيص */}
                        {['hero_section', 'story_section', 'winter_discounts', 'component'].includes(section.designType) && (
                            <div className="md:col-span-2 bg-[#000] p-4 rounded border border-[#F5C518]/30 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">صورة البنر / الخلفية</label>
                                    <div className="border border-dashed border-[#444] p-4 text-center bg-[#121212] relative hover:border-[#F5C518] transition-colors">
                                        {section.contentData?.imageUrl && <img src={section.contentData.imageUrl} className="h-24 mx-auto mb-2 rounded object-cover" />}
                                        {uploadingSectionId === section.id ? <span className="text-[#F5C518] text-xs animate-pulse">جاري الرفع...</span> : (
                                            <>
                                            <label htmlFor={`upload-${section.id}`} className="cursor-pointer bg-[#333] px-3 py-1 rounded text-[10px] hover:bg-[#F5C518] hover:text-black block w-fit mx-auto transition-all">{section.contentData?.imageUrl ? "تغيير الصورة" : "رفع صورة"}</label>
                                            <input id={`upload-${section.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], section.id)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <input placeholder="نص الزر (مثال: تسوق الآن)" className="bg-[#121212] border border-[#333] p-2 text-xs rounded text-white w-full outline-none focus:border-[#F5C518]" value={section.contentData?.buttonText || ""} onChange={(e) => updateContentData(section.id, 'buttonText', e.target.value)} />
                                    <input placeholder="الرابط (مثال: /collections/dress)" className="bg-[#121212] border border-[#333] p-2 text-xs rounded text-white w-full outline-none focus:border-[#F5C518]" value={section.contentData?.link || ""} onChange={(e) => updateContentData(section.id, 'link', e.target.value)} />
                                    <textarea placeholder="وصف إضافي (يظهر تحت العنوان)" className="bg-[#121212] border border-[#333] p-2 text-xs rounded text-white w-full h-16 resize-none outline-none focus:border-[#F5C518]" value={section.contentData?.description || ""} onChange={(e) => updateContentData(section.id, 'description', e.target.value)} />
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