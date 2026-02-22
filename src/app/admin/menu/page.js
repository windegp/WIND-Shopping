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

  // --- دالة أمان لتحويل أي داتا تائهة لنص ---
  const toSafeString = (val) => {
    if (typeof val === 'string') return val;
    if (!val) return "";
    return JSON.stringify(val); // لو أوبجيكت حوله لنص عشان ريأكت متزعلش
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colsQuery = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsQuery.docs.map(d => ({ 
          name: toSafeString(d.data().name || "بدون اسم"), 
          slug: toSafeString(d.data().slug || "") 
        })));

        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const sanitize = (list) => list.map((item) => ({
            ...item,
            id: toSafeString(item.id || uuidv4()), 
            title: toSafeString(item.title),
            link: toSafeString(item.link),
            children: item.children ? sanitize(item.children) : [],
          }));
          setItems(sanitize(snap.data().menuItems));
        } else {
          setItems([
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
          ]);
        }
      } catch (error) { console.error("Load Error:", error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = (list) => list.map(item => ({
        title: toSafeString(item.title),
        link: toSafeString(item.link),
        highlight: !!item.highlight,
        children: item.children ? clean(item.children) : []
      }));
      await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items) });
      alert("تم الحفظ بنجاح! 🎉");
    } catch (e) { alert("خطأ في الحفظ"); } 
    finally { setSaving(false); }
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    // هنا مربط الفرس: نتأكد إننا بنعرض String فقط
    const displayTitle = toSafeString(item.title);

    return (
      <div className="flex flex-col gap-2 bg-[#1a1a1a] border border-[#333] p-4 rounded-xl mb-2">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1">
            <GripVertical size={20} />
          </div>

          <div className="text-[#F5C518] w-6 flex justify-center">{collapseIcon}</div>

          <div className="flex-[1.5] w-full">
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => {
                const update = (list) => list.map(i => i.id === item.id ? { ...i, title: e.target.value } : { ...i, children: i.children ? update(i.children) : [] });
                setItems(update(items));
              }}
              className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:border-[#F5C518] outline-none"
            />
          </div>

          <div className="flex-[2] w-full flex gap-1">
            <select
              value={item.link.startsWith('/collections/') ? item.link.replace('/collections/', '') : ""}
              onChange={(e) => {
                const newLink = e.target.value ? `/collections/${e.target.value}` : "/";
                const update = (list) => list.map(i => i.id === item.id ? { ...i, link: newLink } : { ...i, children: i.children ? update(i.children) : [] });
                setItems(update(items));
              }}
              className="bg-[#121212] border border-[#333] text-[#F5C518] p-2 rounded text-[10px] outline-none w-28"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={toSafeString(item.link)}
              onChange={(e) => {
                const update = (list) => list.map(i => i.id === item.id ? { ...i, link: e.target.value } : { ...i, children: i.children ? update(i.children) : [] });
                setItems(update(items));
              }}
              className="flex-1 bg-[#121212] border border-[#333] text-gray-500 p-2 rounded text-xs outline-none text-left font-mono"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => {
              const update = (list) => list.map(i => i.id === item.id ? { ...i, highlight: !i.highlight } : { ...i, children: i.children ? update(i.children) : [] });
              setItems(update(items));
            }} className={`p-2 rounded ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600'}`}>
              <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
            </button>
            <button onClick={() => {
              if(confirm("حذف؟")) {
                const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: i.children ? del(i.children) : []}));
                setItems(del(items));
              }
            }} className="text-gray-600 hover:text-red-500 p-2 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {depth < 3 && (
          <div className="mr-12 flex items-center gap-2">
            <CornerDownLeft size={14} className="text-gray-600" />
            <button 
              onClick={() => {
                const newItem = { id: uuidv4(), title: "قسم جديد", link: "/", children: [] };
                const add = (list) => list.map(i => i.id === item.id ? { ...i, children: [...(i.children || []), newItem] } : { ...i, children: i.children ? add(i.children) : [] });
                setItems(add(items));
              }} 
              className="text-[10px] font-bold text-[#F5C518] hover:underline"
            >+ إضافة فرعي</button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-10 bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] shadow-lg">
        <h1 className="text-2xl font-black flex items-center gap-3"><Navigation className="text-[#F5C518]"/> مـنيو <span className="text-[#F5C518]">WIND</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي", link: "/", children: [] }])} className="px-4 py-2 bg-[#222] border border-[#333] rounded-xl hover:border-[#F5C518] transition text-sm flex items-center gap-2"><Plus size={16}/> قسم رئيسي</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-[#F5C518] text-black font-black rounded-xl hover:scale-105 transition flex items-center gap-2 shadow-xl">
            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ المنيو
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-32">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={setItems}
          maxDepth={4}
        />
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
    <Suspense fallback={<div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]">Loading...</div>}>
      <MenuManagerContent />
    </Suspense>
  );
}