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

  // خيارات التصميم المطابقة تماماً لأقسام موقعك الحالي
  const designStyles = [
    { id: 'hero_section', name: 'Hero Section', type: 'component' },
    { id: 'carousel', name: 'شريط عرض (وصل حديثاً)', type: 'collection' },
    { id: 'marquee', name: 'شريط متحرك (التشكيلة الجديدة)', type: 'collection' },
    { id: 'best_sellers', name: 'الأكثر مبيعاً (1 كبير + 4 صغير)', type: 'collection' },
    { id: 'trust_bar', name: 'شريط الثقة', type: 'component' },
    { id: 'collections_slider', name: 'مجموعات مميزة', type: 'component' },
    { id: 'reviews_parallax', name: 'آراء العائلة', type: 'component' },
    { id: 'magazine_grid', name: 'WIND Magazine', type: 'component' },
    { id: 'grid', name: 'شبكة (الأعلى تقييماً)', type: 'collection' },
    { id: 'story_section', name: 'قصة WIND', type: 'component' },
    { id: 'category_split', name: 'تسوق حسب الفئة', type: 'component' },
    { id: 'winter_discounts', name: 'تخفيضات شتوية', type: 'collection' }
  ];

  // الأقسام الافتراضية المستخرجة من كودك الأصلي بالضبط
  const defaultSections = [
    { id: '1', title: "", subTitle: "", type: "component", designType: "hero_section", slug: "", excludedIds: [] },
    { id: '2', title: "أحدث صيحات WIND", subTitle: "تصاميم شتوية تلامس الروح", type: "collection", designType: "carousel", slug: "new-arrivals", excludedIds: [] },
    { id: '3', title: "تسوق التشكيلة الجديدة", subTitle: "أناقة WIND في كل خطوة", type: "collection", designType: "marquee", slug: "all", excludedIds: [] },
    { id: '4', title: "الأكثر مبيعاً", subTitle: "", type: "collection", designType: "best_sellers", slug: "all", excludedIds: [] },
    { id: '5', title: "", subTitle: "", type: "component", designType: "trust_bar", slug: "", excludedIds: [] },
    { id: '6', title: "مجموعات مميزة", subTitle: "", type: "component", designType: "collections_slider", slug: "", excludedIds: [] },
    { id: '7', title: "آراء عائلة WIND", subTitle: "أصوات حقيقية - تجارب صادقة", type: "component", designType: "reviews_parallax", slug: "", excludedIds: [] },
    { id: '8', title: "WIND Magazine", subTitle: "مقالات في الأناقة", type: "component", designType: "magazine_grid", slug: "", excludedIds: [] },
    { id: '9', title: "الأعلى تقييماً", subTitle: "القطع التي نالت إعجاب الجميع", type: "collection", designType: "grid", slug: "all", excludedIds: [] },
    { id: '10', title: "قصة WIND", subTitle: "", type: "component", designType: "story_section", slug: "", excludedIds: [] },
    { id: '11', title: "تسوق حسب الفئة", subTitle: "", type: "component", designType: "category_split", slug: "", excludedIds: [] },
    { id: '12', title: "تخفيضات WIND الحصرية - لفترة محدودة", subTitle: "", type: "collection", designType: "winter_discounts", slug: "all", excludedIds: [] }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        setCategories(uniqueCats.sort());

        const settingsSnap = await getDoc(doc(db, "settings", "homePage"));
        if (settingsSnap.exists() && settingsSnap.data().sections) {
          setSections(settingsSnap.data().sections);
        } else {
          // إذا لم تكن هناك إعدادات، يتم تحميل الأقسام الأصلية لموقعك
          setSections(defaultSections);
        }
      } catch (error) { console.error(error); } 
      finally { setInitialLoading(false); }
    };
    fetchData();
  }, []);

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
      await setDoc(doc(db, "settings", "homePage"), { sections }, { merge: true });
      alert("تم حفظ الواجهة بنجاح!");
    } catch (error) { alert("حدث خطأ أثناء الحفظ"); }
    setLoading(false);
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
  };

  if (initialLoading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]">جاري التحميل...</div>;

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#121212] z-50 pb-4 border-b border-[#333]">
        <h1 className="text-2xl font-black text-[#F5C518]">إدارة أقسام الصفحة الرئيسية</h1>
        <button onClick={handleSave} disabled={loading} className="bg-[#F5C518] text-black font-bold px-6 py-2 rounded">
          {loading ? "جاري الحفظ..." : "حفظ الترتيب والتعديلات"}
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 max-w-4xl mx-auto">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className="bg-[#1A1A1A] p-4 rounded border border-[#333] relative flex gap-4">
                      <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 flex items-center justify-center px-2">⠿</div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">العنوان الرئيسي</label>
                          <input className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white text-sm" value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">العنوان الفرعي</label>
                          <input className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white text-sm" value={section.subTitle} onChange={(e) => updateSection(section.id, 'subTitle', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">الشكل (التصميم)</label>
                          <select className="w-full bg-[#121212] border border-[#333] p-2 rounded text-[#F5C518] text-sm" value={section.designType} onChange={(e) => updateSection(section.id, 'designType', e.target.value)}>
                            {designStyles.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                          </select>
                        </div>
                        {section.type === 'collection' && (
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">المجموعة المعروضة</label>
                            <select className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white text-sm" value={section.slug} onChange={(e) => updateSection(section.id, 'slug', e.target.value)}>
                              <option value="all">كل المنتجات</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
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