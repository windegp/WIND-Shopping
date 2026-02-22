"use client";

import React, { useState, useEffect } from "react";
// 1. حل مشكلة Error #130 عبر التحميل الديناميكي للمكتبة
import dynamic from 'next/dynamic';
const Nestable = dynamic(() => import('react-nestable'), { 
  ssr: false,
  loading: () => <div className="p-10 text-center text-gray-500 font-bold">جاري تشغيل محرك القوائم...</div>
});

import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft, Link as LinkIcon, Info } from "lucide-react";

// استايل المكتبة الأساسي
import "react-nestable/dist/styles/index.css"; 

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null); 
  const [isMounted, setIsMounted] = useState(false);

  // جلب البيانات عند التحميل
  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: uuidv4(), 
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        } else {
          // بيانات افتراضية لو مفيش داتا
          const defaultItems = [
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
            { id: uuidv4(), title: "التشكيلة الجديدة", link: "/collections/Knitwear", children: [] },
            { id: uuidv4(), title: "تخفيضات WIND", link: "/sale", children: [], highlight: true },
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

  // دالة تنظيف البيانات قبل الحفظ لفايربيس
  const cleanDataForFirebase = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => {
      const cleanedItem = {
        title: item.title?.trim() || "قسم بدون اسم",
        link: item.link?.trim() || "/",
        highlight: !!item.highlight
      };
      if (item.children && item.children.length > 0) {
        cleanedItem.children = cleanDataForFirebase(item.children);
      }
      return cleanedItem;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = cleanDataForFirebase(items);
      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanedItems,
      });
      alert("تم حفظ قائمة WIND الجديدة بنجاح! 🚀");
    } catch (error) {
      console.error("Error saving menu:", error);
      alert("حدث خطأ أثناء الاتصال بـ Firebase");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (parentId = null) => {
    const newId = uuidv4();
    const newItem = { id: newId, title: "قسم جديد", link: "/collections/", children: [] };

    if (parentId === null) {
      setItems([...items, newItem]);
    } else {
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
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const updateItem = (id, field, value) => {
    const updateRecursive = (list) =>
      list.map((item) => {
        if (item.id === id) return { ...item, [field]: value };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    setItems(updateRecursive(items));
  };

  const deleteItem = (id) => {
    const deleteRecursive = (list) =>
      list.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : [],
      }));
    if (confirm("سيتم حذف هذا القسم وفروعه، هل أنت متأكد؟")) setItems(deleteRecursive(items));
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    const isNew = item.id === lastAddedId; 

    return (
      <div className={`
        flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-xl mb-3 shadow-lg transition-all duration-500
        ${isNew ? 'border-[#F5C518] scale-[1.02]' : 'border-[#333] hover:border-gray-500'}
      `}>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          {/* مقبض السحب */}
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1 shrink-0">
            <GripVertical size={20} />
          </div>

          <div className="text-[#F5C518] w-6 flex justify-center shrink-0">{collapseIcon}</div>

          {/* الاسم */}
          <div className="flex-1 w-full">
            <label className="text-[10px] text-gray-500 block mb-1">اسم القسم في الموقع</label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full bg-black border border-[#333] text-white p-2.5 rounded-lg text-sm focus:border-[#F5C518] outline-none font-bold"
              placeholder="مثال: فساتين، تريكو..."
            />
          </div>

          {/* الرابط */}
          <div className="flex-1 w-full">
            <label className="text-[10px] text-gray-500 block mb-1 flex items-center gap-1">
              الرابط (من شيت شوبيفاي) <LinkIcon size={10}/>
            </label>
            <input
              type="text"
              value={item.link}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="w-full bg-black border border-[#333] text-gray-400 p-2.5 rounded-lg text-sm focus:border-[#F5C518] outline-none font-mono"
              dir="ltr"
              placeholder="/collections/Type-Name"
            />
          </div>

          <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 p-2 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex justify-between items-center mt-1 pr-12">
           {depth < 3 ? (
            <button onClick={() => addItem(item.id)} className="text-[10px] font-black text-[#F5C518] flex items-center gap-1 hover:text-white transition">
              <CornerDownLeft size={12} /> + إضافة فرع تحت {item.title}
            </button>
           ) : <span />}
           
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">تمييز باللون الذهبي؟</span>
              <input 
                type="checkbox" 
                checked={item.highlight} 
                onChange={(e) => updateItem(item.id, "highlight", e.target.checked)}
                className="accent-[#F5C518]"
              />
           </div>
        </div>
      </div>
    );
  };

  // حماية لمنع الـ Flash قبل التحميل
  if (!isMounted || loading) {
    return (
      <div className="p-10 text-center text-[#F5C518] bg-[#121212] min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={48}/>
        <p className="font-black tracking-widest animate-pulse">WIND NAVIGATION ENGINE</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      
      {/* الشريط العلوي */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-10 bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
             <span className="bg-[#F5C518] text-black px-3 py-1 rounded-md text-xl">WIND</span> 
             إدارة المنيو
          </h1>
          <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
            <Info size={14} className="text-[#F5C518]" />
            اربط الأقسام بالـ Type الموجود في الشيت باستخدام: <code className="bg-black px-2 py-1 rounded text-[#F5C518]">/collections/Type</code>
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => addItem(null)} className="flex-1 md:flex-none px-6 py-3 bg-[#222] border border-[#333] text-white rounded-xl hover:border-[#F5C518] transition flex items-center justify-center gap-2 font-bold">
            <Plus size={20} /> قسم رئيسي
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none px-8 py-3 bg-[#F5C518] text-black font-black rounded-xl hover:bg-white transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,197,24,0.2)]">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ التغييرات
          </button>
        </div>
      </div>

      {/* منطقة بناء المنيو */}
      <div className="max-w-4xl mx-auto pb-32">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={(newItems) => setItems(newItems)}
          maxDepth={4} 
          threshold={40}
        />
        
        {items.length === 0 && (
          <div className="text-center py-24 border-2 border-dashed border-[#333] rounded-2xl bg-[#1a1a1a]/50">
            <p className="text-gray-500 font-bold mb-4">قائمة الموقع فارغة تماماً</p>
            <button onClick={() => addItem(null)} className="bg-[#F5C518] text-black px-6 py-2 rounded-lg font-black hover:scale-105 transition">ابدأ بناء المنيو الآن</button>
          </div>
        )}
      </div>

      {/* تحسينات التصميم الخاصة بالمكتبة */}
      <style jsx global>{`
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { 
          background-color: #1a1a1a !important; 
          border: 2px solid #F5C518 !important; 
          border-radius: 12px; 
          width: 100%; 
          opacity: 0.9;
        }
        .nestable-list { list-style: none; padding: 0; margin: 0; }
        .nestable-item-children { 
          margin-right: 40px; 
          border-right: 1px dashed #444; 
          padding-right: 20px;
          margin-top: 10px;
        }
        .nestable-handle { cursor: grab; }
        .nestable-handle:active { cursor: grabbing; }
      `}</style>
    </div>
  );
}