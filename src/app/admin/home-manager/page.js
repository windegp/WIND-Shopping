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

  // الصفحات الثابتة في موقعك
  const staticPages = [
    { name: "قصة WIND", slug: "story", path: "/story" },
    { name: "المقالات (Blog)", slug: "blog", path: "/blog" },
    { name: "التقييمات", slug: "reviews", path: "/reviews" },
    { name: "كل المنتجات", slug: "all", path: "/collections/all" }
  ];

  // خيارات التصميم لكل قسم (الجديد)
  const designStyles = [
    { id: 'carousel', name: 'شريط عرض (Carousel)', icon: '↔️' },
    { id: 'grid', name: 'شبكة منتجات (Grid)', icon: '🔳' },
    { id: 'marquee', name: 'شريط متحرك (Marquee)', icon: '🏃' },
    { id: 'featured', name: 'منتج مميز + شبكة (Featured)', icon: '⭐' },
  ];

  // 1. جلب البيانات (المنتجات + الإعدادات الحالية)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        // استخراج الأقسام الفريدة (ضمان ظهور كل الأقسام)
        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        setCategories(uniqueCats);

        const settingsRef = doc(db, "settings", "homePage");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && settingsSnap.data().sections) {
          // التأكد أن كل ID هو String من أجل مكتبة DND
          const loadedSections = settingsSnap.data().sections.map(s => ({...s, id: s.id.toString()}));
          setSections(loadedSections);
        } else {
          setSections([
            { id: '1', title: "", subTitle: "", type: "collection", slug: "", designType: "carousel", excludedIds: [] }
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, []);

  // دالة معالجة الترتيب بعد السحب والإفلات
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  // 2. دوال التعامل مع الأقسام
  const addSection = () => {
    setSections([...sections, { 
      id: Date.now().toString(), // ID فريد كسلسلة نصية
      title: "", 
      subTitle: "", 
      type: "collection", 
      slug: "", 
      designType: "carousel", // افتراضي
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

  // 3. الحفظ في فيربيز
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homePage");
      await setDoc(docRef, { sections }, { merge: true });
      alert("✅ تم حفظ الترتيب والتصميمات بنجاح!");
    } catch (error) {
      console.error(error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-[#333] pb-4 sticky top-0 bg-[#121212] z-10">
        <div>
           <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
           <p className="text-xs text-gray-500 mt-1">اسحب الأقسام لترتيبها واختر شكل التصميم المناسب</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#F5C518] text-black font-bold px-6 py-2 rounded-sm hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)] transition-all"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {/* Drag and Drop Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="main-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="max-w-5xl mx-auto space-y-6">
              
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-[#1A1A1A] p-6 rounded-lg border ${snapshot.isDragging ? 'border-[#F5C518] scale-[1.01] shadow-2xl' : 'border-[#333]'} relative group transition-all`}
                    >
                      {/* مقبض السحب (Drag Handle) */}
                      <div {...provided.dragHandleProps} className="absolute top-4 right-4 text-gray-600 cursor-grab active:cursor-grabbing hover:text-[#F5C518]">
                         <span className="text-2xl">⠿</span>
                      </div>

                      {/* زر الحذف */}
                      <button 
                        onClick={() => removeSection(section.id)}
                        className="absolute top-4 left-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] p-2 rounded text-xs"
                      >
                        حذف القسم 🗑️
                      </button>

                      <div className="flex items-center gap-3 mb-6">
                        <span className="bg-[#222] text-[#F5C518] w-8 h-8 flex items-center justify-center rounded font-bold border border-[#333]">{index + 1}</span>
                        <h3 className="font-bold text-lg">إعدادات القسم</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* العناوين */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
                          <input 
                            type="text"
                            className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            placeholder="مثلاً: فساتين السهرة"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">الوصف الفرعي (SubTitle)</label>
                          <input 
                            type="text"
                            className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                            value={section.subTitle}
                            onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)}
                            placeholder="وصف جذاب..."
                          />
                        </div>

                        {/* نوع المحتوى */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">نوع المحتوى</label>
                          <select 
                            className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-gray-300"
                            value={section.type}
                            onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                          >
                            <option value="collection">منتجات (Collection)</option>
                            <option value="page">صفحة ثابتة (Page)</option>
                          </select>
                        </div>

                        {/* اختيار القسم أو الصفحة */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">اختر {section.type === 'collection' ? 'القسم' : 'الصفحة'}</label>
                          <select 
                            className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-[#F5C518] font-bold"
                            value={section.slug}
                            onChange={(e) => updateSection(section.id, 'slug', e.target.value)}
                          >
                            <option value="">-- اختر من القائمة --</option>
                            {section.type === 'collection' ? (
                              categories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            ) : (
                              staticPages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)
                            )}
                          </select>
                        </div>

                        {/* ميزة اختيار التصميم (الطلب الجديد) */}
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-400 mb-2">شكل عرض القسم (Design Style)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {designStyles.map((style) => (
                               <div 
                                 key={style.id}
                                 onClick={() => updateSection(section.id, 'designType', style.id)}
                                 className={`cursor-pointer p-3 rounded border text-center transition-all ${section.designType === style.id ? 'border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518]' : 'border-[#333] bg-[#121212] text-gray-500 hover:border-[#555]'}`}
                               >
                                 <div className="text-xl mb-1">{style.icon}</div>
                                 <div className="text-[10px] font-bold">{style.name}</div>
                                </div>
                             ))}
                          </div>
                        </div>
                      </div>

                      {/* منطقة استثناء المنتجات */}
                      {section.type === 'collection' && section.slug && (
                        <div className="bg-[#121212] p-4 rounded border border-[#333]">
                          <h4 className="text-xs font-bold text-gray-400 mb-3">حدد المنتجات التي تريد إخفاءها من هذا القسم 👁️‍🗨️</h4>
                          <div className="max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-2 custom-scrollbar">
                            {products
                              .filter(p => p.categories?.includes(section.slug))
                              .map(product => (
                                <label key={product.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${section.excludedIds?.includes(product.id) ? 'border-red-500 bg-red-900/10' : 'border-[#333] hover:border-[#555]'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-red-500"
                                    checked={section.excludedIds?.includes(product.id) || false}
                                    onChange={() => toggleProductExclusion(section.id, product.id)}
                                  />
                                  <div className="flex items-center gap-2 truncate">
                                    {product.images?.[0] && <img src={product.images[0]} className="w-8 h-8 object-cover rounded-sm" />}
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

              {/* زر إضافة قسم جديد */}
              <button 
                onClick={addSection}
                className="w-full border-2 border-dashed border-[#444] text-gray-400 py-8 rounded-lg hover:border-[#F5C518] hover:text-[#F5C518] transition-all font-bold flex flex-col items-center gap-2 bg-[#1A1A1A]/50"
              >
                <span className="text-3xl">+</span>
                <span>إضافة بلوك جديد للصفحة الرئيسية</span>
              </button>

            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}