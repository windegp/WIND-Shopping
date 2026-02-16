"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
// استيراد مكتبة السحب والإفلات
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // كل المنتجات
  const [categories, setCategories] = useState([]); // قائمة الأقسام المستخرجة
  const [sections, setSections] = useState([]); // حالة الأقسام

  // الصفحات الثابتة
  const staticPages = [
    { name: "قصة WIND", slug: "story", path: "/story" },
    { name: "المقالات (Blog)", slug: "blog", path: "/blog" },
    { name: "التقييمات", slug: "reviews", path: "/reviews" },
    { name: "كل المنتجات", slug: "all", path: "/collections/all" }
  ];

  // خيارات التصميم (تم توسيعها لتشمل تصميمات صفحتك + تصميمات IMDb الجديدة)
  const designStyles = [
    // التصميمات الأساسية للمنتجات
    { id: 'carousel', name: 'شريط عرض (Carousel)', icon: '↔️' },
    { id: 'grid', name: 'شبكة منتظمة (Grid)', icon: '🔳' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', icon: '🏃' },
    { id: 'featured', name: 'منتج مميز + شبكة (Best Seller Style)', icon: '⭐' },
    // التصميمات الجديدة
    { id: 'imdb', name: 'كارت أفقي (IMDb Style)', icon: '🎫' },
    { id: 'ranked', name: 'قائمة مرقمة (Top 10)', icon: '🔢' },
    { id: 'masonry', name: 'شبكة غير منتظمة (Pinterest)', icon: '🧱' },
    // المكونات الثابتة المعقدة (لإتاحة تحريكها)
    { id: 'hero_section', name: 'بانر الهيرو (Hero Section)', icon: '🚩' },
    { id: 'trust_bar', name: 'شريط الثقة (Trust Bar)', icon: '🛡️' },
    { id: 'reviews_parallax', name: 'آراء العملاء (Parallax)', icon: '💬' },
    { id: 'story_section', name: 'قصة WIND (Story)', icon: '📖' },
    { id: 'magazine_grid', name: 'مجلة WIND (Magazine)', icon: '📰' },
    { id: 'collections_slider', name: 'سلايدر الكولكشنات (Circles)', icon: '⚪' },
    { id: 'category_split', name: 'انقسام الفئات (Split Footer)', icon: '✂️' }
  ];

  // 1. جلب البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب المنتجات
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        // استخراج الأقسام الفريدة (Deduplication)
        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        // إضافة أقسام افتراضية قد لا تكون في المنتجات لضمان وجودها
        const allCats = [...new Set([...uniqueCats, 'new-arrivals', 'dress', 'blouse', 'summer', 'winter'])]; 
        setCategories(allCats.sort());

        // جلب الإعدادات
        const settingsRef = doc(db, "settings", "homePage");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && settingsSnap.data().sections) {
          const loadedSections = settingsSnap.data().sections.map(s => ({...s, id: s.id.toString()}));
          setSections(loadedSections);
        } else {
          // --- هنا السحر: تعبئة الأدمن بنفس تصميم صفحتك الحالية تلقائياً ---
          setSections([
            { id: '1', title: "الرئيسية", subTitle: "", type: "component", slug: "", designType: "hero_section", excludedIds: [] },
            { id: '2', title: "أحدث صيحات WIND", subTitle: "تصاميم شتوية تلامس الروح", type: "collection", slug: "new-arrivals", designType: "carousel", excludedIds: [] },
            { id: '3', title: "تسوق التشكيلة الجديدة", subTitle: "أناقة WIND في كل خطوة", type: "collection", slug: "all", designType: "marquee", excludedIds: [] },
            { id: '4', title: "الأكثر مبيعاً", subTitle: "", type: "collection", slug: "all", designType: "featured", excludedIds: [] },
            { id: '5', title: "", subTitle: "", type: "component", slug: "", designType: "trust_bar", excludedIds: [] },
            { id: '6', title: "مجموعات مميزة", subTitle: "", type: "component", slug: "", designType: "collections_slider", excludedIds: [] },
            { id: '7', title: "آراء عائلة WIND", subTitle: "", type: "component", slug: "", designType: "reviews_parallax", excludedIds: [] },
            { id: '8', title: "WIND Magazine", subTitle: "مقالات في الأناقة", type: "component", slug: "", designType: "magazine_grid", excludedIds: [] },
            { id: '9', title: "الأعلى تقييماً", subTitle: "القطع التي نالت إعجاب الجميع", type: "collection", slug: "all", designType: "grid", excludedIds: [] },
            { id: '10', title: "قصة WIND", subTitle: "", type: "component", slug: "", designType: "story_section", excludedIds: [] },
            { id: '11', title: "تسوق حسب الفئة", subTitle: "", type: "component", slug: "", designType: "category_split", excludedIds: [] },
            { id: '12', title: "تخفيضات WIND الحصرية", subTitle: "", type: "collection", slug: "all", designType: "grid", excludedIds: [] }
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, []);

  // دالة معالجة الترتيب
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const addSection = () => {
    setSections([...sections, { 
      id: Date.now().toString(), 
      title: "قسم جديد", 
      subTitle: "", 
      type: "collection", 
      slug: "", 
      designType: "carousel", 
      excludedIds: [] 
    }]);
  };

  const removeSection = (id) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      setSections(sections.filter(sec => sec.id !== id));
    }
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(sec => {
        if (sec.id === id) {
            const updated = { ...sec, [field]: value };
            if (field === 'slug') updated.excludedIds = [];
            return updated;
        }
        return sec;
    }));
  };

  const toggleProductExclusion = (sectionId, productId) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        const currentExcluded = sec.excludedIds || [];
        return {
          ...sec,
          excludedIds: currentExcluded.includes(productId)
            ? currentExcluded.filter(id => id !== productId)
            : [...currentExcluded, productId]
        };
      }
      return sec;
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homePage");
      // نستخدم استبدال كامل للأقسام للحفاظ على الترتيب والحذف
      await setDoc(docRef, { sections }, { merge: true });
      alert("✅ تم حفظ تصميم الصفحة الرئيسية وترتيب الأقسام بنجاح!");
    } catch (error) {
      console.error(error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-[#333] pb-4 sticky top-0 bg-[#121212] z-50 shadow-md">
        <div>
           <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
           <p className="text-xs text-gray-500 mt-1">نظام إدارة المحتوى الكامل (CMS) - اسحب، رتب، واختر التصميم</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={addSection}
            className="border border-[#F5C518] text-[#F5C518] font-bold px-4 py-2 rounded-sm hover:bg-[#F5C518] hover:text-black transition-all text-sm"
            >
            + قسم جديد
            </button>
            <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-[#F5C518] text-black font-bold px-6 py-2 rounded-sm hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all"
            >
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="main-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="max-w-5xl mx-auto space-y-6 pb-20">
              
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-[#1A1A1A] p-6 rounded-lg border ${snapshot.isDragging ? 'border-[#F5C518] scale-[1.01] shadow-2xl z-50' : 'border-[#333]'} relative group transition-all`}
                    >
                      {/* مقبض السحب */}
                      <div {...provided.dragHandleProps} className="absolute top-4 right-4 text-gray-600 cursor-grab active:cursor-grabbing hover:text-[#F5C518] p-2 bg-[#121212] rounded">
                         <span className="text-2xl">⠿</span>
                      </div>

                      {/* زر الحذف */}
                      <button 
                        onClick={() => removeSection(section.id)}
                        className="absolute top-4 left-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] p-2 rounded text-xs border border-red-900/30"
                      >
                        حذف 🗑️
                      </button>

                      <div className="flex items-center gap-3 mb-6">
                        <span className="bg-[#222] text-[#F5C518] w-8 h-8 flex items-center justify-center rounded font-bold border border-[#333]">{index + 1}</span>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {section.title || "قسم بدون عنوان"}
                            <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-gray-400 font-normal">
                                {designStyles.find(s => s.id === section.designType)?.name}
                            </span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* العناوين (تظهر فقط للأقسام القابلة للتعديل) */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
                            <input 
                                type="text"
                                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                                value={section.title}
                                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">الوصف الفرعي</label>
                            <input 
                                type="text"
                                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                                value={section.subTitle}
                                onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* نوع المحتوى */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">نوع المحتوى</label>
                          <select 
                            className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-gray-300"
                            value={section.type}
                            onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                          >
                            <option value="collection">عرض منتجات (Collection)</option>
                            <option value="component">مكون ثابت (Static Component)</option>
                            <option value="page">رابط صفحة (Link)</option>
                          </select>
                        </div>

                        {/* اختيار القسم */}
                        <div>
                           {section.type === 'collection' && (
                                <>
                                <label className="block text-xs text-gray-400 mb-2">اختر القسم (Collection)</label>
                                <select 
                                    className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-[#F5C518] font-bold"
                                    value={section.slug}
                                    onChange={(e) => updateSection(section.id, 'slug', e.target.value)}
                                >
                                    <option value="">-- كل المنتجات --</option>
                                    <option value="all">الكل (All Products)</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                </>
                           )}
                           {section.type === 'page' && (
                               <>
                                <label className="block text-xs text-gray-400 mb-2">اختر الصفحة</label>
                                <select 
                                    className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-white"
                                    value={section.slug}
                                    onChange={(e) => updateSection(section.id, 'slug', e.target.value)}
                                >
                                    {staticPages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)}
                                </select>
                               </>
                           )}
                           {section.type === 'component' && (
                               <div className="p-3 bg-[#222] border border-[#333] rounded text-gray-500 text-xs flex items-center justify-center">
                                   هذا القسم يعرض مكوناً جاهزاً، اختر شكله من الأسفل
                               </div>
                           )}
                        </div>

                        {/* اختيار التصميم */}
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-400 mb-2">اختر التصميم (Design Style)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                             {designStyles.filter(ds => {
                                 // فلترة الخيارات المنطقية حسب النوع
                                 if (section.type === 'component') return ['hero_section', 'trust_bar', 'reviews_parallax', 'story_section', 'magazine_grid', 'collections_slider', 'category_split'].includes(ds.id);
                                 return !['hero_section', 'trust_bar', 'reviews_parallax', 'story_section', 'magazine_grid', 'collections_slider', 'category_split'].includes(ds.id);
                             }).map((style) => (
                               <div 
                                 key={style.id}
                                 onClick={() => updateSection(section.id, 'designType', style.id)}
                                 className={`cursor-pointer p-2 rounded border text-center transition-all flex flex-col items-center justify-center gap-1 ${section.designType === style.id ? 'border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518]' : 'border-[#333] bg-[#121212] text-gray-500 hover:border-[#555]'}`}
                               >
                                 <span className="text-lg">{style.icon}</span>
                                 <span className="text-[9px] font-bold">{style.name}</span>
                                </div>
                             ))}
                          </div>
                        </div>
                      </div>

                      {/* استثناء المنتجات */}
                      {section.type === 'collection' && (
                        <div className="bg-[#121212] p-4 rounded border border-[#333]">
                          <h4 className="text-xs font-bold text-gray-400 mb-3">إخفاء منتجات محددة من هذا القسم 👁️‍🗨️</h4>
                          <div className="max-h-32 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-2 custom-scrollbar">
                            {products
                              .filter(p => section.slug === 'all' || p.categories?.includes(section.slug))
                              .slice(0, 50) // Limit list for performance
                              .map(product => (
                                <label key={product.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${section.excludedIds?.includes(product.id) ? 'border-red-500 bg-red-900/10' : 'border-[#333] hover:border-[#555]'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-red-500"
                                    checked={section.excludedIds?.includes(product.id) || false}
                                    onChange={() => toggleProductExclusion(section.id, product.id)}
                                  />
                                  <div className="flex items-center gap-2 truncate">
                                    {product.images?.[0] && <img src={product.images[0]} className="w-6 h-6 object-cover rounded-sm" />}
                                    <span className={`text-xs truncate ${section.excludedIds?.includes(product.id) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                      {product.title}
                                    </span>
                                  </div>
                                </label>
                              ))
                            }
                          </div>
                        </div>
                      )}
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