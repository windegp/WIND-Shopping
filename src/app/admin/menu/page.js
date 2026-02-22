"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, Star, Navigation, Link as LinkIcon } from "lucide-react";

import "react-nestable/dist/styles/index.css"; 

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableCollections, setAvailableCollections] = useState([]);

  // دالة الحماية القصوى: تمنع ظهور Error 130 نهائياً
  const forceString = (val) => {
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return ""; // لو أوبجيكت أو أي حاجة تانية يرجع نص فاضي
  };

  useEffect(() => {
    const initMenu = async () => {
      try {
        // 1. جلب الكولكشنز
        const colsSnap = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsSnap.docs.map(d => ({
          name: forceString(d.data().name || d.id),
          slug: forceString(d.data().slug || d.id)
        })));

        // 2. جلب المنيو
        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists() && menuSnap.data().menuItems) {
          const prepare = (list) => list.map(item => ({
            id: forceString(item.id || uuidv4()),
            title: forceString(item.title),
            link: forceString(item.link),
            highlight: !!item.highlight,
            children: Array.isArray(item.children) ? prepare(item.children) : []
          }));
          setItems(prepare(menuSnap.data().menuItems));
        } else {
          setItems([{ id: uuidv4(), title: "الرئيسية", link: "/", children: [] }]);
        }
      } catch (err) {
        console.error("Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    initMenu();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = (list) => list.map(item => ({
        title: forceString(item.title),
        link: forceString(item.link),
        highlight: !!item.highlight,
        children: clean(item.children || [])
      }));
      await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items) });
      alert("تم الحفظ بنجاح!");
    } catch (e) { alert("خطأ أثناء الحفظ"); }
    finally { setSaving(false); }
  };

  const renderItem = ({ item, collapseIcon, handler }) => {
    return (
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] p-3 rounded-xl mb-2 shadow-sm">
        {/* مقبض السحب */}
        <div {...handler} className="p-2 text-gray-600 hover:text-[#F5C518] cursor-grab">
          <GripVertical size={18} />
        </div>

        {/* أيقونة الطي */}
        <div className="w-4 flex justify-center">{collapseIcon}</div>

        {/* حقل العنوان */}
        <input 
          type="text" 
          value={forceString(item.title)} 
          onChange={(e) => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, title: e.target.value} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="flex-1 bg-[#121212] border border-[#333] p-2 rounded-lg text-sm text-white outline-none focus:border-[#F5C518]"
          placeholder="العنوان"
        />

        {/* سلكت الكولكشن */}
        <select 
          value={item.link.includes("/collections/") ? item.link.split("/").pop() : ""}
          onChange={(e) => {
            const newLink = e.target.value ? `/collections/${e.target.value}` : "/";
            const update = (list) => list.map(i => i.id === item.id ? {...i, link: newLink} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="bg-[#121212] border border-[#333] p-2 rounded-lg text-[10px] text-[#F5C518] outline-none"
        >
          <option value="">رابط يدوي</option>
          {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>

        {/* حقل الرابط */}
        <input 
          type="text" 
          value={forceString(item.link)} 
          onChange={(e) => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, link: e.target.value} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="w-32 bg-[#121212] border border-[#333] p-2 rounded-lg text-[10px] text-gray-500 font-mono"
          dir="ltr"
        />

        {/* أزرار التحكم */}
        <div className="flex gap-1 border-r border-[#333] pr-2 mr-2">
          <button onClick={() => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, highlight: !i.highlight} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }} className={`p-2 rounded-lg ${item.highlight ? 'bg-[#F5C518] text-black' : 'text-gray-500 hover:bg-[#222]'}`}>
            <Star size={16} fill={item.highlight ? "currentColor" : "none"} />
          </button>
          
          <button onClick={() => {
            const newItem = { id: uuidv4(), title: "قسم فرعي", link: "/", children: [] };
            const update = (list) => list.map(i => i.id === item.id ? {...i, children: [...(i.children || []), newItem]} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }} className="p-2 text-[#F5C518] hover:bg-[#222] rounded-lg">
            <Plus size={16} />
          </button>

          <button onClick={() => {
            if(confirm("حذف؟")) {
              const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: del(i.children || [])}));
              setItems(del(items));
            }
          }} className="p-2 text-gray-600 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-8 bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] shadow-lg">
        <h1 className="text-xl font-black flex items-center gap-3"><Navigation className="text-[#F5C518]"/> WIND MENU <span className="text-[#F5C518] text-xs font-normal">v3.0</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي", link: "/", children: [] }])} className="bg-[#222] border border-[#333] px-4 py-2 rounded-xl text-sm hover:border-[#F5C518] transition">قسم رئيسي +</button>
          <button onClick={handleSave} disabled={saving} className="bg-[#F5C518] text-black px-8 py-2 rounded-xl font-black shadow-xl hover:scale-105 transition active:scale-95 disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-40">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={setItems}
          maxDepth={3}
        />
      </div>

      <style jsx global>{`
        .nestable-item-children { margin-right: 40px; border-right: 2px dashed #333; padding-right: 20px; margin-top: 10px; }
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background: #1a1a1a !important; border-radius: 12px; }
      `}</style>
    </div>
  );
}

export default function MenuPage() {
  return <Suspense><MenuManagerContent /></Suspense>;
}