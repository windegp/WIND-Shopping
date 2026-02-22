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
  const [lastAddedId, setLastAddedId] = useState(null); 
  const [availableCollections, setAvailableCollections] = useState([]); 

  // دالة أمان: بتحول أي داتا مش نص لـ نص فاضي عشان ريأكت متهنجش
  const safeString = (val) => (typeof val === 'string' ? val : "");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colsQuery = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsQuery.docs.map(d => ({ 
          name: safeString(d.data().name || "بدون اسم"), 
          slug: safeString(d.data().slug || "") 
        })));

        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) => list.map((item) => ({
            ...item,
            id: item.id || uuidv4(), 
            title: safeString(item.title),
            link: safeString(item.link),
            children: item.children ? addIds(item.children) : [],
          }));
          setItems(addIds(snap.data().menuItems));
        } else {
          setItems([
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
          ]);
        }
      } catch (error) { console.error("Menu Load Error:", error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = (list) => list.map(item => ({
        title: safeString(item.title) || "بدون اسم",
        link: safeString(item.link) || "#",
        highlight: !!item.highlight,
        children: item.children ? clean(item.children) : []
      }));
      await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items) });
      alert("تم حفظ منيو WIND بنجاح! 🎉");
    } catch (error) { alert("خطأ في الحفظ"); } 
    finally { setSaving(false); }
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
    const currentLink = safeString(item.link);

    return (
      <div className={`flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-xl mb-2 shadow-xl transition-all ${isNew ? 'border-[#F5C518]' : 'border-[#333]'}`}>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1"><GripVertical size={20} /></div>
          
          {/* الـ collapseIcon لازم نتأكد إنه مش Object تائه */}
          <div className="text-[#F5C518] w-6 flex justify-center cursor-pointer">{collapseIcon}</div>

          <div className="flex-[1.5] w-full">
            <input
              type="text"
              value={safeString(item.title)}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:border-[#F5C518] outline-none"
              placeholder="اسم القسم"
            />
          </div>

          <div className="flex-[2] w-full flex gap-1">
            <select
              value={currentLink.startsWith('/collections/') ? currentLink.replace('/collections/', '') : ""}
              onChange={(e) => updateItem(item.id, "link", e.target.value ? `/collections/${e.target.value}` : "/")}
              className="bg-[#121212] border border-[#333] text-[#F5C518] p-2 rounded text-[10px] outline-none w-28"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={currentLink}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="flex-1 bg-[#121212] border border-[#333] text-gray-500 p-2 rounded text-xs outline-none text-left font-mono"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => updateItem(item.id, "highlight", !item.highlight)} className={`p-2 rounded transition-colors ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600'}`}>
              <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
            </button>
            <button onClick={() => {
              if(confirm("حذف؟")) {
                const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: i.children ? del(i.children) : []}));
                setItems(del(items));
              }
            }} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18} /></button>
          </div>
        </div>

        {depth < 3 && (
          <div className="mr-10 flex items-center gap-2">
            <CornerDownLeft size={14} className="text-gray-600" />
            <button onClick={() => {
              const newId = uuidv4();
              const newItem = { id: newId, title: "قسم فرعي", link: "/", children: [] };
              const add = (list) => list.map(i => i.id === item.id ? { ...i, children: [...(i.children || []), newItem] } : { ...i, children: i.children ? add(i.children) : [] });
              setItems(add(items));
            }} className="text-[11px] font-bold text-[#F5C518] hover:underline">+ إضافة فرعي</button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]">
        <h1 className="text-2xl font-black flex items-center gap-3"><Navigation className="text-[#F5C518]"/> إدارة المنيو</h1>
        <div className="flex gap-3">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي", link: "/", children: [] }])} className="px-4 py-2 bg-[#222] border border-[#333] rounded-lg text-sm transition flex items-center gap-2 hover:border-[#F5C518]"><Plus size={16}/> قسم رئيسي</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-[#F5C518] text-black font-black rounded-lg hover:scale-105 transition flex items-center gap-2 shadow-lg shadow-yellow-500/20">
            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} حفظ المنيو
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto pb-20">
        <Nestable items={items} renderItem={renderItem} onChange={setItems} maxDepth={4} />
      </div>
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