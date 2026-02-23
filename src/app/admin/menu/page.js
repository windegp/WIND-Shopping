"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft, Star, Navigation } from "lucide-react";

// استايل المكتبة الأساسي
import "react-nestable/dist/styles/index.css"; 

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableCollections, setAvailableCollections] = useState([]); 

  // --- ركن التعليم: دالة التأكد من أن القيمة نصية (String) ---
  // دي اللي بتقتل Error 130 نهائياً
  const ensureString = (value, fallback = "") => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    // لو القيمة طلعت Object (سبب المشكلة)، بنرجع علامة تنبيه بدل ما نوقع الصفحة
    return value ? "⚠️ يحتاج تعديل" : fallback;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الكولكشنز المتاحة
        const colsQuery = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsQuery.docs.map(d => ({ 
          name: ensureString(d.data().name, "بدون اسم"), 
          slug: ensureString(d.data().slug, "") 
        })));

        // جلب المنيو من الفايربيس
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          // دالة تنظيف البيانات القديمة (Sanitize)
          const sanitize = (list) =>
            list.map((item) => ({
              ...item,
              id: item.id || uuidv4(), 
              title: ensureString(item.title, "قسم جديد"),
              link: ensureString(item.link, "/"),
              children: Array.isArray(item.children) ? sanitize(item.children) : [],
            }));
          setItems(sanitize(snap.data().menuItems));
        } else {
          setItems([{ id: uuidv4(), title: "الرئيسية", link: "/", children: [] }]);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // قبل الحفظ، نتأكد إننا بنبعت نصوص فقط للفايربيس
      const cleanData = (list) => list.map((item) => ({
        title: ensureString(item.title, "بدون اسم"),
        link: ensureString(item.link, "#"),
        highlight: !!item.highlight,
        children: Array.isArray(item.children) ? cleanData(item.children) : []
      }));

      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanData(items),
        updatedAt: new Date().toISOString()
      });
      alert("تم حفظ قائمة WIND بنجاح! 🎉");
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (id, field, value) => {
    const updateRecursive = (list) => list.map((item) => {
      if (item.id === id) return { ...item, [field]: value };
      if (item.children) return { ...item, children: updateRecursive(item.children) };
      return item;
    });
    setItems(updateRecursive(items));
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    return (
      <div className="flex flex-col gap-2 bg-[#1a1a1a] border border-[#333] p-4 rounded-xl mb-2 shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1">
            <GripVertical size={20} />
          </div>

          <div className="text-[#F5C518] w-6 flex justify-center">{collapseIcon}</div>

          <div className="flex-[1.5] w-full">
            <input
              type="text"
              value={ensureString(item.title)}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className={`w-full bg-[#121212] border p-2 rounded text-sm focus:border-[#F5C518] outline-none ${typeof item.title !== 'string' ? 'border-red-500' : 'border-[#333]'}`}
              placeholder="اسم القسم"
            />
          </div>

          <div className="flex-[2] w-full flex gap-1">
            <select
              value={ensureString(item.link).includes('/collections/') ? item.link.split('/').pop() : ""}
              onChange={(e) => updateItem(item.id, "link", e.target.value ? `/collections/${e.target.value}` : "/")}
              className="bg-[#121212] border border-[#333] text-[#F5C518] p-2 rounded text-[10px] outline-none w-28"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={ensureString(item.link)}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="flex-1 bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-xs outline-none text-left"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => updateItem(item.id, "highlight", !item.highlight)} className={`p-2 rounded transition-colors ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600'}`}>
              <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
            </button>
            <button onClick={() => {
              if(confirm("حذف القسم؟")) {
                const del = (l) => l.filter(i => i.id !== item.id).map(i => ({...i, children: i.children ? del(i.children) : []}));
                setItems(del(items));
              }
            }} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18} /></button>
          </div>
        </div>

        {depth < 3 && (
          <button 
            onClick={() => {
              const newItem = { id: uuidv4(), title: "قسم فرعي جديد", link: "/", children: [] };
              const add = (l) => l.map(i => i.id === item.id ? {...i, children: [...(i.children || []), newItem]} : {...i, children: i.children ? add(i.children) : []});
              setItems(add(items));
            }} 
            className="mr-12 text-[10px] font-bold text-[#F5C518] flex items-center gap-1 hover:underline"
          >
            <Plus size={12} /> إضافة فرعي
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]">
        <h1 className="text-2xl font-black flex items-center gap-3"><Navigation className="text-[#F5C518]"/> إدارة مـنيو <span className="text-[#F5C518]">WIND</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي جديد", link: "/", children: [] }])} className="px-4 py-2 bg-[#222] border border-[#333] rounded-lg text-sm hover:border-[#F5C518] transition flex items-center gap-2"><Plus size={16}/> قسم رئيسي</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-[#F5C518] text-black font-black rounded-lg hover:scale-105 transition flex items-center gap-2 shadow-lg">
            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ المنيو
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-40">
        <Nestable items={items} renderItem={renderItem} onChange={setItems} maxDepth={3} />
      </div>

      <style jsx global>{`
        .nestable-item-children { margin-right: 40px; border-right: 2px dashed #333; padding-right: 20px; margin-top: 10px; }
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background-color: #1a1a1a !important; border: 1px solid #F5C518 !important; border-radius: 12px; }
      `}</style>
    </div>
  );
}

export default function MenuManager() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]">جاري التحميل...</div>}>
      <MenuManagerContent />
    </Suspense>
  );
}