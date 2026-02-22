"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft, Star, Navigation } from "lucide-react";

import "react-nestable/dist/styles/index.css"; 

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null); 
  const [availableCollections, setAvailableCollections] = useState([]); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colsQuery = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsQuery.docs.map(d => ({ 
          name: String(d.data().name || "بدون اسم"), 
          slug: String(d.data().slug || "") 
        })));

        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) => list.map((item) => ({
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
      } catch (error) { console.error("Error:", error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = (list) => list.map(item => ({
        title: String(item.title),
        link: String(item.link),
        highlight: !!item.highlight,
        children: item.children ? clean(item.children) : []
      }));
      await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items) });
      alert("تم حفظ منيو WIND! 🚀");
    } catch (e) { alert("خطأ في الحفظ"); } 
    finally { setSaving(false); }
  };

  const addItem = (parentId = null) => {
    const newId = uuidv4();
    const newItem = { id: newId, title: "قسم جديد", link: "/", children: [], highlight: false };
    if (!parentId) setItems([...items, newItem]);
    else {
      const rec = (list) => list.map(item => item.id === parentId ? { ...item, children: [...(item.children || []), newItem] } : { ...item, children: item.children ? rec(item.children) : [] });
      setItems(rec(items));
    }
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const updateItem = (id, field, value) => {
    const rec = (list) => list.map(item => item.id === id ? { ...item, [field]: value } : { ...item, children: item.children ? rec(item.children) : [] });
    setItems(rec(items));
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    const isNew = item.id === lastAddedId;
    return (
      <div className={`flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-xl mb-2 transition-all ${isNew ? 'border-[#F5C518] shadow-[0_0_15px_rgba(245,197,24,0.2)]' : 'border-[#333]'}`}>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1"><GripVertical size={20} /></div>
          <div className="text-[#F5C518] w-6 flex justify-center">{collapseIcon}</div>
          <input type="text" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} className="flex-1 bg-[#121212] border border-[#333] p-2 rounded text-sm outline-none focus:border-[#F5C518]" placeholder="اسم القسم"/>
          <div className="flex-[2] flex gap-2">
            <select value={item.link.startsWith('/collections/') ? item.link.replace('/collections/', '') : ""} onChange={e => updateItem(item.id, "link", e.target.value ? `/collections/${e.target.value}` : "/")} className="bg-[#121212] border border-[#333] text-[#F5C518] p-2 rounded text-[10px] outline-none w-28">
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input type="text" value={item.link} onChange={e => updateItem(item.id, "link", e.target.value)} className="flex-1 bg-[#121212] border border-[#333] text-gray-500 p-2 rounded text-xs outline-none text-left" dir="ltr"/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateItem(item.id, "highlight", !item.highlight)} className={`p-2 rounded ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600'}`}><Star size={18} fill={item.highlight ? "currentColor" : "none"} /></button>
            <button onClick={() => {if(confirm("حذف؟")) setItems(prev => {const del = (l)=>l.filter(i=>i.id!==item.id).map(i=>({...i,children:i.children?del(i.children):[]})); return del(prev)})}} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18} /></button>
          </div>
        </div>
        {depth < 3 && (
          <button onClick={() => addItem(item.id)} className="mr-12 text-[10px] font-bold text-[#F5C518] flex items-center gap-1 hover:underline"><Plus size={12}/> إضافة فرعي</button>
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
          <button onClick={() => addItem(null)} className="px-4 py-2 bg-[#222] border border-[#333] rounded-lg hover:border-[#F5C518] transition flex items-center gap-2 text-sm"><Plus size={16}/> قسم رئيسي</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-[#F5C518] text-black font-black rounded-lg hover:scale-105 transition flex items-center gap-2 shadow-lg">
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

export default function MenuManager() { return <Suspense><MenuManagerContent /></Suspense>; }