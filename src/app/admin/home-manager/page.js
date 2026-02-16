"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
// استيراد مكتبة السحب والإفلات
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  // 1. جلب البيانات عند التحميل
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // جلب المنتجات
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        // استخراج الأقسام الفريدة
        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        const allCats = [...new Set([...uniqueCats, 'new-arrivals', 'dress', 'blouse', 'summer', 'winter'])]; 
        setCategories(allCats.sort());

        // جلب الإعدادات المحفوظة
        const settingsRef = doc(db, "settings", "homePage");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && settingsSnap.data().sections) {
          const loadedSections = settingsSnap.data().sections.map(s => ({
            ...s, 
            id: s.id.toString(),
            excludedIds: s.excludedIds || [] // ضمان وجود المصفوفة
          }));
          setSections(loadedSections);
        } else {
          // البنية الافتراضية إذا لم تكن هناك إعدادات سابقة
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
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // دالة معالجة ترتيب السحب والإفلات
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
    if (confirm("هل أنت متأكد من حذف هذا القسم نهائياً من الواجهة؟")) {
      setSections(sections.filter(sec => sec.id !== id));
    }
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(sec => {
      if (sec.id === id) {
        const updated = { ...sec, [field]: value };
        // تصفير الاستثناءات عند تغيير القسم لضمان عدم حدوث تداخل
        if (field === 'slug' || field === 'type') updated.excludedIds = [];
        // تعيين تصميم افتراضي عند تغيير النوع
        if (field === 'type' && value === 'component') updated.designType = 'hero_section';
        if (field === 'type' && value === 'collection') updated.designType = 'carousel';
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
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homePage");
      await setDoc(docRef, { 
        sections,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      alert("✅ تم حفظ ترتيب وتصميم الواجهة بنجاح!");
    } catch (error) {
      console.error(error);
      alert("❌ خطأ أثناء الحفظ، يرجى التحقق من الاتصال.");
    }
    setLoading(false);
  };

  if (initialLoading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-[#F5C518] animate-pulse font-bold text-xl">جاري تحميل إعدادات الواجهة...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right font-sans" dir="rtl">
      
      {/* Header الثابت */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#333] pb-4 sticky top-0 bg-[#121212]/95 backdrop-blur-md z-50 shadow-md gap-4">
        <div>
           <h1 className="text-2xl font-black text-[#F5C518] flex items-center gap-2">
             <span className="text-3xl">🏠</span> إدارة واجهة WIND
           </h1>
           <p className="text-xs text-gray-500 mt-1 italic font-light">
             نظام تحكم كامل (Drag & Drop CMS) - صمم متجرك كما تراه
           </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={addSection}
             className="border border-[#F5C518] text-[#F5C518] font-bold px-4 py-2 rounded hover:bg-[#F5C518] hover:text-black transition-all text-sm"
           >
             + إضافة قسم جديد
           </button>
           <button 
             onClick={handleSave}
             disabled={loading}
             className="bg-[#F5C518] text-black font-bold px-8 py-2 rounded hover:bg-yellow-500 shadow-[0_0_20px_rgba(245,197,24,0.4)] disabled:opacity-50 transition-all"
           >
             {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
           </button>
        </div>
      </div>

      {/* منطقة السحب والإفلات */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="main-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="max-w-5xl mx-auto space-y-6 pb-24">
              
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-[#1A1A1A] p-6 rounded-xl border-2 ${snapshot.isDragging ? 'border-[#F5C518] scale-[1.02] shadow-2xl z-50 ring-4 ring-[#F5C518]/20' : 'border-[#333] hover:border-[#444]'} relative group transition-all duration-200`}
                    >
                      {/* مقبض السحب */}
                      <div {...provided.dragHandleProps} className="absolute top-4 right-4 text-gray-500 cursor-grab active:cursor-grabbing hover:text-[#F5C518] p-2 bg-[#121212] rounded-lg transition-colors border border-[#333]">
                         <span className="text-2xl">⠿</span>
                      </div>

                      {/* زر الحذف */}
                      <button 
                        onClick={() => removeSection(section.id)}
                        className="absolute top-4 left-4 text-red-500 hover:text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all bg-[#121212] p-2 rounded-lg text-xs border border-red-900/30"
                      >
                        حذف القسم 🗑️
                      </button>

                      {/* ترقيم القسم */}
                      <div className="flex items-center gap-3 mb-8">
                        <span className="bg-[#222] text-[#F5C518] w-10 h-10 flex items-center justify-center rounded-full font-black border-2 border-[#F5C518]/20 text-lg">
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-xl flex items-center gap-2 text-gray-100">
                              {section.title || "عنوان القسم"}
                              <span className="text-[10px] bg-[#333] px-2 py-1 rounded-full text-gray-400 font-medium uppercase tracking-wider">
                                  {designStyles.find(s => s.id === section.designType)?.name || "تصميم غير محدد"}
                              </span>
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* مدخلات النصوص */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 mr-1 italic">العنوان الرئيسي للقسم</label>
                            <input 
                                type="text"
                                placeholder="مثال: الأكثر مبيعاً..."
                                className="w-full bg-[#121212] border border-[#333] p-4 rounded-lg focus:border-[#F5C518] outline-none text-white transition-all shadow-inner"
                                value={section.title}
                                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 mr-1 italic">الوصف أو العنوان الفرعي</label>
                            <input 
                                type="text"
                                placeholder="وصف قصير يظهر تحت العنوان..."
                                className="w-full bg-[#121212] border border-[#333] p-4 rounded-lg focus:border-[#F5C518] outline-none text-gray-300 transition-all"
                                value={section.subTitle}
                                onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* نوع المحتوى */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 mr-1">ماذا يعرض هذا القسم؟</label>
                          <select 
                            className="w-full bg-[#121212] border border-[#333] p-4 rounded-lg focus:border-[#F5C518] outline-none text-[#F5C518] font-bold appearance-none cursor-pointer"
                            value={section.type}
                            onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                          >
                            <option value="collection">عرض منتجات (Collection)</option>
                            <option value="component">مكون جاهز (UI Component)</option>
                            <option value="page">رابط صفحة (Redirect Link)</option>
                          </select>
                        </div>

                        {/* اختيار المصدر بناءً على النوع */}
                        <div className="space-y-2">
                            {section.type === 'collection' && (
                                <>
                                <label className="text-xs font-bold text-gray-400 mr-1">اختر مجموعة المنتجات</label>
                                <select 
                                    className="w-full bg-[#121212] border border-[#333] p-4 rounded-lg focus:border-[#F5C518] outline-none text-white font-bold appearance-none cursor-pointer"
                                    value={section.slug}
                                    onChange={(e) => updateSection(section.id, 'slug', e.target.value)}
                                >
                                    <option value="">-- اختر الفئة --</option>
                                    <option value="all">كل المنتجات (All)</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                </>
                            )}
                            {section.type === 'page' && (
                               <>
                                <label className="text-xs font-bold text-gray-400 mr-1">اختر الصفحة المستهدفة</label>
                                <select 
                                    className="w-full bg-[#121212] border border-[#333] p-4 rounded-lg focus:border-[#F5C518] outline-none text-white font-bold appearance-none cursor-pointer"
                                    value={section.slug}
                                    onChange={(e) => updateSection(section.id, 'slug', e.target.value)}
                                >
                                    {staticPages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)}
                                </select>
                               </>
                            )}
                            {section.type === 'component' && (
                                <div className="h-full flex items-center">
                                  <div className="p-4 bg-[#222]/50 border border-dashed border-[#444] rounded-lg text-gray-500 text-xs w-full text-center">
                                      ✨ هذا القسم يعرض مكوناً برمجياً جاهزاً، تحكم بمكانه وترتيبه فقط.
                                  </div>
                                </div>
                            )}
                        </div>

                        {/* اختيار شكل التصميم */}
                        <div className="md:col-span-2 mt-2">
                          <label className="text-xs font-bold text-gray-400 mb-3 block mr-1">اختر نمط العرض (Layout)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                             {designStyles.filter(ds => {
                                 const componentList = ['hero_section', 'trust_bar', 'reviews_parallax', 'story_section', 'magazine_grid', 'collections_slider', 'category_split'];
                                 if (section.type === 'component') return componentList.includes(ds.id);
                                 return !componentList.includes(ds.id);
                             }).map((style) => (
                               <div 
                                 key={style.id}
                                 onClick={() => updateSection(section.id, 'designType', style.id)}
                                 className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${section.designType === style.id ? 'border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518] shadow-lg' : 'border-[#222] bg-[#121212] text-gray-500 hover:border-[#444]'}`}
                               >
                                 <span className="text-2xl">{style.icon}</span>
                                 <span className="text-[10px] font-bold leading-tight">{style.name}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>

                      {/* قسم استثناء المنتجات */}
                      {section.type === 'collection' && (
                        <div className="bg-[#121212] p-5 rounded-xl border border-[#333] shadow-inner">
                          <h4 className="text-xs font-black text-[#F5C518] mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <span className="text-lg">🚫</span> استثناء منتجات محددة من الظهور في هذا القسم
                          </h4>
                          <div className="max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3 pr-2 scrollbar-thin scrollbar-thumb-[#333]">
                            {products
                              .filter(p => section.slug === 'all' || p.categories?.includes(section.slug))
                              .map(product => {
                                const isExcluded = section.excludedIds?.includes(product.id);
                                return (
                                  <label key={product.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${isExcluded ? 'border-red-900/50 bg-red-900/10' : 'border-[#222] hover:border-[#444] bg-[#1A1A1A]'}`}>
                                    <input 
                                      type="checkbox" 
                                      className="w-5 h-5 accent-red-600 rounded"
                                      checked={isExcluded || false}
                                      onChange={() => toggleProductExclusion(section.id, product.id)}
                                    />
                                    <div className="flex items-center gap-2 truncate">
                                      {product.images?.[0] && <img src={product.images[0]} className="w-8 h-8 object-cover rounded shadow-sm" alt="" />}
                                      <span className={`text-[11px] font-medium truncate ${isExcluded ? 'text-red-400 line-through' : 'text-gray-300'}`}>
                                        {product.title}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })
                            }
                            {products.filter(p => section.slug === 'all' || p.categories?.includes(section.slug)).length === 0 && (
                              <div className="col-span-full text-center py-4 text-gray-600 text-sm">لا توجد منتجات في هذا القسم حالياً.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* رسالة توضيحية عند عدم وجود أقسام */}
              {sections.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-2xl">
                  <p className="text-gray-500 italic text-lg">لا توجد أقسام مضافة حالياً. ابدأ بإضافة قسم جديد!</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* زر الحفظ العائم للموبايل */}
      <div className="fixed bottom-6 left-6 md:hidden">
         <button 
           onClick={handleSave}
           disabled={loading}
           className="bg-[#F5C518] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl font-bold"
         >
           {loading ? "..." : "✓"}
         </button>
      </div>

    </div>
  );
}