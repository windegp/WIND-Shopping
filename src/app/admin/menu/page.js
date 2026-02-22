"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft, Star, Navigation } from "lucide-react";

// استايل المكتبة الأساسي لضمان السحب والإفلات
import "react-nestable/dist/styles/index.css"; 

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null); 
  const [availableCollections, setAvailableCollections] = useState([]); 

  // 1. جلب البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const colsQuery = await getDocs(collection(db, "collections"));
        const colsData = colsQuery.docs.map(d => ({ 
          name: String(d.data().name || "بدون اسم"), 
          slug: String(d.data().slug || "") 
        }));
        setAvailableCollections(colsData);

        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: item.id || uuidv4(), 
              title: String(item.title || ""),
              link: String(item.link || ""),
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        } else {
          setItems([
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
            { id: uuidv4(), title: "تخفيضات", link: "/collections/sale", children: [], highlight: true },
          ]);
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
      const clean = (list) => list.map((item) => ({
        title: String(item.title || "قسم جديد"),
        link: String(item.link || "#"),
        highlight: !!item.highlight,
        children: item.children ? clean(item.children) : [],
      }));
      await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items) });
      alert("تم حفظ منيو WIND بنجاح! 🎉");
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (parentId = null) => {
    const newId = uuidv4();
    const newItem = { id: newId, title: "قسم جديد", link: "/", children: [], highlight: false };
    if (!parentId) setItems([...items, newItem]);
    else {
      const rec = (list) => list.map(item => 
        item.id === parentId ? { ...item, children: [...(item.children || []), newItem] } : 
        { ...item, children: item.children ? rec(item.children) : [] }
      );
      setItems(rec(items));
    }
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const updateItem = (id, field, value) => {
    const rec = (list) => list.map(item => 
      item.id === id ? { ...item, [field]: value } : 
      { ...item, children: item.children ? rec(item.children) : [] }
    );
    setItems(rec(items));
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    const isNew = item.id === lastAddedId;
    // التأكد من أن العنوان نصي دائماً لمنع Error 130
    const safeTitle = typeof item.title === 'string' ? item.title : "قسم";

    return (
      <div className={`flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-xl mb-2 transition-all ${isNew ? 'border-[#F5C518]' : 'border-[#333]'}`}>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1">
            <GripVertical size={20} />
          </div>

          <div className="text-[#F5C518] w-6 flex justify-center">{collapseIcon}</div>

          <div className="flex-[1.5] w-full">
            <input
              type="text"
              value={safeTitle}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:border-[#F5C518] outline-none"
              placeholder="اسم القسم"
            />
          </div>

          <div className="flex-[2] w-full flex gap-1">
            <select
              value={item.link.startsWith('/collections/') ? item.link.replace('/collections/', '') : ""}
              onChange={(e) => updateItem(item.id, "link", e.target.value ? `/collections/${e.target.value}` : "/")}
              className="bg-[#121212] border border-[#333] text-[#F5C518] p-2 rounded text-[10px] outline-none w-28"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={item.link}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="flex-1 bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-xs outline-none text-left"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => updateItem(item.id, "highlight", !item.highlight)} className={`p-2 rounded ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600'}`}>
              <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
            </button>
            <button 
                onClick={() => {
                    if(confirm("حذف القسم؟")) {
                        const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: i.children ? del(i.children) : []}));
                        setItems(del(items));
                    }
                }} 
                className="text-gray-600 hover:text-red-500 p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {depth < 3 && (
          <div className="mr-10 flex items-center gap-2">
            <CornerDownLeft size={14} className="text-gray-600" />
            <button onClick={() => addItem(item.id)} className="text-[11px] font-bold text-[#F5C518] hover:underline flex items-center gap-1">
              <Plus size={12} /> إضافة فرعي
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]">
        <h1 className="text-2xl font-black flex items-center gap-3"><Navigation className="text-[#F5C518]"/> إدارة منيو <span className="text-[#F5C518]">WIND</span></h1>
        <div className="flex gap-3">
          <button onClick={() => addItem(null)} className="px-4 py-2 bg-[#222] border border-[#333] rounded-lg hover:border-[#F5C518] transition flex items-center gap-2 text-sm">
            <Plus size={16} /> قسم رئيسي
          </button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-[#F5C518] text-black font-black rounded-lg hover:scale-105 transition flex items-center gap-2 shadow-lg">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ المنيو
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-20">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={(newItems) => setItems(newItems)}
          maxDepth={4}
        />
      </div>

      <style jsx global>{`
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background-color: #1a1a1a !important; border: 1px solid #F5C518 !important; border-radius: 8px; }
        .nestable-item-children { margin-right: 30px; border-right: 2px dashed #333; padding-right: 15px; margin-top: 10px; }
      `}</style>
    </div>
  );
}

export default function MenuManager() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]">Loading...</div>}>
      <MenuManagerContent />
    </Suspense>
  );
}