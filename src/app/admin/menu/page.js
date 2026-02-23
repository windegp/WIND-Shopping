"use client";

import React, { useState, useEffect } from "react";
import Nestable from "react-nestable";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Plus, Save, Loader2, GripVertical, Trash2, 
  Link as LinkIcon, Layers, Database, ChevronDown 
} from "lucide-react";

import "react-nestable/dist/styles/index.css"; 

export default function UltimateMenuManager() {
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. دالة التنظيف العميق (React 19 Security) ---
  const deepClean = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: String(item.title || "قسم جديد"),
      link: String(item.link || "/"),
      type: item.type || "custom",
      children: deepClean(item.children || []) // هنا السحر: بيعالج كل المستويات الفرعية
    }));
  };

  // --- 2. جلب البيانات (مزامنة كاملة) ---
  useEffect(() => {
    const init = async () => {
      try {
        const colsSnap = await getDocs(collection(db, "collections"));
        setCollections(colsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists()) {
          setItems(deepClean(menuSnap.data().menuItems));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  // --- 3. حفظ البيانات ---
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
      alert("تم حفظ هيكل WIND المترابط بنجاح! 🚀");
    } catch (e) { alert("حدث خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  // --- 4. دالة الربط بالكولكشن (تسميع تلقائي) ---
  const connectItemToCollection = (itemId, slug) => {
    const target = collections.find(c => c.slug === slug);
    if (!target) return;

    const updateNested = (list) => list.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          title: target.name, // بيسحب الاسم أوتوماتيك من الكولكشن
          link: `/collections/${target.slug}`, // بيبني الرابط أوتوماتيك
          type: "collection" 
        };
      }
      return { ...item, children: updateNested(item.children || []) };
    });
    setItems(updateNested(items));
  };

  // --- 5. رسم السطر الواحد (The Recursive Row) ---
  const renderItem = ({ item, collapseIcon, handler }) => {
    return (
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#111] border border-[#222] p-4 rounded-2xl mb-3 group hover:border-[#F5C518]/40 transition-all shadow-sm">
        <div {...handler} className="cursor-grab text-gray-700 hover:text-[#F5C518] pr-2 border-l border-[#222] ml-2">
          <GripVertical size={20} />
        </div>
        
        <div className="text-[#F5C518]">{collapseIcon}</div>

        {/* اختيار الكولكشن (الربط المباشر) */}
        <div className="w-full md:w-64">
          <select 
            value={item.link.includes('/collections/') ? item.link.split('/').pop() : ""}
            onChange={(e) => connectItemToCollection(item.id, e.target.value)}
            className="w-full bg-black border border-[#333] p-2.5 rounded-xl text-[10px] text-[#F5C518] outline-none font-bold cursor-pointer"
          >
            <option value="">-- ربط بقسم موجود --</option>
            {collections.map(c => (
              <option key={c.id} value={c.slug}>{c.name} ({c.productCount || 0} منتج)</option>
            ))}
          </select>
        </div>

        {/* تعديل الاسم يدوياً */}
        <input 
          type="text" 
          value={item.title} 
          onChange={(e) => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, title: e.target.value} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="flex-1 bg-transparent border-b border-transparent focus:border-[#F5C518] p-2 text-sm font-black outline-none transition-all"
          placeholder="عنوان البند"
        />

        {/* عرض الرابط النهائي */}
        <div className="hidden lg:flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg border border-[#222]">
          <LinkIcon size={12} className="text-gray-600" />
          <span className="text-[9px] text-gray-500 font-mono truncate max-w-[150px]" dir="ltr">{item.link}</span>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const sub = { id: Math.random().toString(), title: "فرعي جديد", link: "/", children: [] };
              const update = (list) => list.map(i => i.id === item.id ? {...i, children: [...(i.children || []), sub]} : {...i, children: update(i.children || [])});
              setItems(update(items));
            }}
            className="p-2 text-[#F5C518] hover:bg-[#F5C518]/10 rounded-xl transition-all"
            title="إضافة مستوى فرعي"
          ><Plus size={18}/></button>
          
          <button 
            onClick={() => {
              const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: del(i.children || [])}));
              setItems(del(items));
            }}
            className="p-2 text-gray-600 hover:text-red-500 transition-all"
          ><Trash2 size={18}/></button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#F5C518]" size={50} />
      <div className="text-center">
        <h2 className="text-[#F5C518] font-black tracking-[0.3em] uppercase text-xl">Wind Engine</h2>
        <p className="text-gray-600 text-[10px] font-bold mt-2 uppercase">مزامنة الهيكل التنظيمي المترابط...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen text-white font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto pb-40">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#111] p-8 rounded-[2.5rem] border border-[#222] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C518]/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-black rounded-2xl border border-[#222] text-[#F5C518] shadow-inner"><Layers size={32}/></div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Integrated <span className="text-[#F5C518]">Navigation</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">إدارة الأقسام الرئيسية والفرعية المترابطة</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto relative z-10">
            <button 
              onClick={() => setItems([...items, { id: Math.random().toString(), title: "قسم رئيسي جديد", link: "/", children: [] }])}
              className="flex-1 md:flex-none bg-[#1a1a1a] border border-[#333] px-8 py-4 rounded-2xl text-sm font-bold hover:border-[#F5C518] transition-all"
            >+ قسم رئيسي</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 md:flex-none bg-[#F5C518] text-black px-12 py-4 rounded-2xl font-black shadow-[0_10px_40px_rgba(245,197,24,0.2)] hover:bg-white transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" /> : "حفظ الهيكل"}
            </button>
          </div>
        </header>

        {/* Nestable Engine */}
        <div className="custom-nestable-wrapper">
          <Nestable
            items={items}
            renderItem={renderItem}
            onChange={(newItems) => setItems(newItems)}
            maxDepth={10} // يدعم حتى 10 مستويات تداخل
            threshold={30}
          />
        </div>

        {items.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-[#111] rounded-[3rem] text-gray-800 font-black uppercase tracking-[0.5em]">
            Menu is Empty
          </div>
        )}

      </div>

      <style jsx global>{`
        .nestable-item-children { margin-right: 45px; border-right: 2px solid #1a1a1a; padding-right: 20px; margin-top: 15px; position: relative; }
        .nestable-item-children::before { content: ''; position: absolute; top: -15px; right: -2px; width: 20px; h-8 border-bottom: 2px solid #1a1a1a; border-right: 2px solid #1a1a1a; border-bottom-right-radius: 15px; }
        .nestable-drag-layer { z-index: 1000; }
        .nestable-handle { cursor: grab; }
      `}</style>
    </div>
  );
}