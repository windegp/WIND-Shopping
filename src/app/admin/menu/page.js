"use client";

import React, { useState, useEffect, useRef } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft } from "lucide-react";

// استايل المكتبة الأساسي
import "react-nestable/dist/styles/index.css"; 

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null); // عشان نعمل وميض للعنصر الجديد
  const [availableCollections, setAvailableCollections] = useState([]); // لستة الكولكشنز من الفايربيس

  // 1. جلب البيانات من Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ctrl + F: fetchData
const colSnap = await getDoc(doc(db, "collections", "all")); // أو حسب مسمى الكولكشن عندك
// الأفضل نجيبهم من الـ collection نفسه
const { getDocs, collection } = await import("firebase/firestore");
const colsQuery = await getDocs(collection(db, "collections"));
setAvailableCollections(colsQuery.docs.map(d => ({ name: d.data().name, slug: d.data().slug })));
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: uuidv4(), // تجديد الـ ID لضمان عمل المكتبة
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        } else {
          // Fallback Default Data
          const defaultItems = [
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
            { id: uuidv4(), title: "وصل حديثاً", link: "/new-arrivals", children: [] },
            { id: uuidv4(), title: "تخفيضات", link: "/sale", children: [], highlight: true },
          ];
          setItems(defaultItems);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // دالة تنظيف البيانات قبل الحفظ (إزالة الـ IDs المؤقتة)
  const cleanDataForFirebase = (list) => {
    return list.map((item) => {
      const cleanedItem = {
        title: item.title || "بدون اسم",
        link: item.link || "#",
        highlight: item.highlight || false
      };
      if (item.children && item.children.length > 0) {
        cleanedItem.children = cleanDataForFirebase(item.children);
      }
      return cleanedItem;
    });
  };

  // حفظ البيانات
  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = cleanDataForFirebase(items);
      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanedItems,
      });
      alert("تم حفظ قائمة WIND بنجاح! 🎉");
    } catch (error) {
      console.error("Error saving menu:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  // إضافة عنصر جديد (إما في الجذر أو داخل أب)
  const addItem = (parentId = null) => {
    const newId = uuidv4();
    const newItem = { id: newId, title: "قسم جديد", link: "/", children: [] };

    if (parentId === null) {
      // إضافة في القائمة الرئيسية
      setItems([...items, newItem]);
    } else {
      // إضافة كـ ابن (Child)
      const addRecursive = (list) => {
        return list.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newItem] };
          }
          if (item.children) {
            return { ...item, children: addRecursive(item.children) };
          }
          return item;
        });
      };
      setItems(addRecursive(items));
    }
    
    // تفعيل الوميض للإشارة للإضافة
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  // تحديث البيانات
  const updateItem = (id, field, value) => {
    const updateRecursive = (list) =>
      list.map((item) => {
        if (item.id === id) return { ...item, [field]: value };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    setItems(updateRecursive(items));
  };

  // حذف عنصر
  const deleteItem = (id) => {
    const deleteRecursive = (list) =>
      list.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : [],
      }));
    if (confirm("هل تريد حذف هذا القسم؟")) setItems(deleteRecursive(items));
  };

  // *** دالة تحديد النص المناسب لزر الإضافة بناءً على العمق ***
  const getAddButtonText = (depth) => {
    if (depth === 0) return "إضافة كولكشن (صيفي/شتوي)";
    if (depth === 1) return "إضافة فئة (تيشرت/بنطلون)";
    if (depth === 2) return "إضافة نوع (جينز/ميلتون)";
    return "إضافة فرع";
  };

  // شكل العنصر (Render Item)
  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    const isNew = item.id === lastAddedId; // هل هذا العنصر تم إضافته حالا؟

    return (
      <div className={`
        flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-lg mb-2 shadow-md transition-all duration-500
        ${isNew ? 'border-[#F5C518] shadow-[0_0_15px_rgba(245,197,24,0.3)]' : 'border-[#333] hover:border-gray-600'}
      `}>
        {/* الصف العلوي: المقبض + الاسم + الرابط + الحذف */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          {/* مقبض السحب (Drag Handle) */}
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1">
            <GripVertical size={20} />
          </div>

          {/* أيقونة التوسيع/الطي */}
          <div className="text-[#F5C518] cursor-pointer w-6 flex justify-center">
            {collapseIcon}
          </div>

          {/* خانة الاسم */}
          <div className="flex-1 w-full">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:outline-none focus:border-[#F5C518] placeholder-gray-600 font-medium"
              placeholder="اسم القسم"
            />
          </div>

          {/* خانة الرابط */}
          <div className="flex-1 w-full">
            <input
              type="text"
              value={item.link}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="w-full bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-sm focus:outline-none focus:border-[#F5C518] dir-ltr text-left"
              style={{ direction: "ltr" }}
           {/* Ctrl + F: placeholder="/category-link" */}
<div className="flex-1 w-full flex gap-1">
  <select
    value={item.link.startsWith('/collections/') ? item.link.replace('/collections/', '') : ""}
    onChange={(e) => {
      const slug = e.target.value;
      updateItem(item.id, "link", slug ? `/collections/${slug}` : "/");
    }}
    className="bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-xs focus:outline-none focus:border-[#F5C518] w-1/3"
  >
    <option value="">رابط مخصص</option>
    {availableCollections.map(c => (
      <option key={c.slug} value={c.slug}>{c.name}</option>
    ))}
  </select>
  
  <input
    type="text"
    value={item.link}
    onChange={(e) => updateItem(item.id, "link", e.target.value)}
    className="flex-1 bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-sm focus:outline-none focus:border-[#F5C518] dir-ltr text-left"
    style={{ direction: "ltr" }}
    placeholder="/category-link"
  />
</div>

          {/* زر الحذف */}
          <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded hover:bg-[#222]">
            {/* Ctrl + F: Trash2 */}
<button 
  onClick={() => updateItem(item.id, "highlight", !item.highlight)} 
  className={`p-2 rounded transition-colors ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600 hover:bg-[#222]'}`}
  title="تميز بلون مختلف"
>
  <Save size={18} className={item.highlight ? "fill-current" : ""} />
</button>
            <Trash2 size={18} />
          </button>
        </div>

        {/* الصف السفلي: زر الإضافة الذكي (يظهر فقط إذا لم نصل لأقصى عمق) */}
        {depth < 3 && (
          <div className="mr-10 flex items-center gap-2">
            <CornerDownLeft size={14} className="text-gray-600" />
            <button 
              onClick={() => addItem(item.id)}
              className="text-[11px] font-bold text-[#F5C518] hover:text-white hover:bg-[#333] px-2 py-1 rounded transition flex items-center gap-1 border border-dashed border-[#F5C518]/30 hover:border-[#F5C518]"
            >
              <Plus size={12} />
              {getAddButtonText(depth)}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-[#F5C518] bg-[#121212] min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden" dir="rtl">
      {/* الهيدر */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <div>
          <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
             إدارة قائمة <span className="text-[#F5C518]">WIND</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            استخدم زر <span className="text-[#F5C518] font-bold">+</span> لإضافة أقسام فرعية، أو اسحب للترتيب.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => addItem(null)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 bg-[#222] border border-[#333] text-white rounded-lg hover:border-[#F5C518] transition">
            <Plus size={18} /> قسم رئيسي جديد
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3 bg-[#F5C518] text-black font-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 shadow-[0_0_15px_rgba(245,197,24,0.3)]">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ
          </button>
        </div>
      </div>

      {/* منطقة القوائم */}
      <div className="menu-builder-area max-w-4xl mx-auto pb-20">
        <Nestable
          items={Array.isArray(items) ? items : []}
          renderItem={renderItem}
          onChange={(newItems) => setItems(newItems)}
          maxDepth={4} // أقصى عمق مسموح
          threshold={30}
        />
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-lg bg-[#1a1a1a]/50">
          <p className="text-gray-500 font-bold mb-4">القائمة فارغة تماماً</p>
          <button onClick={() => addItem(null)} className="text-[#F5C518] hover:underline">أضف أول قسم الآن</button>
        </div>
      )}

      {/* CSS مخصص لحل مشكلة اختفاء العناصر عند السحب */}
      <style jsx global>{`
        /* 1. إصلاح مشكلة الاختفاء */
        .nestable-drag-layer {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          pointer-events: none;
        }
        
        /* التأكد من أن العنصر المسحوب يحتفظ بخلفيته وشكله */
        .nestable-drag-layer > .nestable-item,
        .nestable-row {
           /* مهم جداً: الخلفية لازم تكون صريحة */
           background-color: #1a1a1a !important; 
           border: 1px solid #F5C518 !important; /* لون ذهبي أثناء السحب */
           border-radius: 8px;
           width: 100%;
           box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        /* 2. تنسيقات عامة للمكتبة */
        .nestable-list { list-style: none; padding: 0; margin: 0; }
        .nestable-item { margin-bottom: 10px; }
        .nestable-item-content { 
            background: transparent !important; 
            border: none !important; 
            padding: 0 !important; 
        }
        
        /* إزاحة الأبناء لليسار */
        .nestable-item-children {
            margin-right: 30px; /* المسافة البادئة للأبناء */
            border-right: 2px dashed #333; /* خط إرشادي للأبناء */
            padding-right: 15px;
        }

        /* أيقونة السهم للتوسيع */
        .nestable-item-icon { margin-left: 10px; }
      `}</style>
    </div>
  );
}