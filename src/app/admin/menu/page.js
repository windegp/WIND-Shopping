"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, Plus, Save, Loader2, Navigation, ChevronRight, ChevronDown, Link as LinkIcon, Layers } from "lucide-react";

export default function AdvancedSafeMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. تنظيف الداتا لضمان عدم حدوث Error 130 في أي مستوى ---
  const sanitize = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: typeof item.title === 'string' ? item.title : "⚠️ يحتاج تسمية",
      link: typeof item.link === 'string' ? item.link : "/",
      children: item.children ? sanitize(item.children) : []
    }));
  };

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "navigation"));
        if (snap.exists() && snap.data().menuItems) {
          setItems(sanitize(snap.data().menuItems));
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadMenu();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // حفظ الداتا بنفس الهيكل الشجري النظيف
      await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
      alert("تم الحفظ بنجاح! 🚀");
    } catch (e) { alert("خطأ في الحفظ"); } 
    finally { setSaving(false); }
  };

  // --- 2. مكون القسم (Recursive Component) ---
  // ده اللي بيرسم نفسه جوه نفسه عشان يظهر كل المستويات
  const MenuItem = ({ item, path }) => {
    const [isOpen, setIsOpen] = useState(true);

    const updateThis = (field, value) => {
      const newItems = [...items];
      let current = { children: newItems };
      path.forEach(idx => { current = current.children[idx]; });
      current[field] = value;
      setItems(newItems);
    };

    const deleteThis = () => {
      const newItems = [...items];
      if (path.length === 1) {
        newItems.splice(path[0], 1);
      } else {
        let parent = { children: newItems };
        for (let i = 0; i < path.length - 1; i++) { parent = parent.children[path[i]]; }
        parent.children.splice(path[path.length - 1], 1);
      }
      setItems(newItems);
    };

    const addSub = () => {
      const newItems = [...items];
      let current = { children: newItems };
      path.forEach(idx => { current = current.children[idx]; });
      current.children.push({ id: Math.random().toString(), title: "قسم فرعي جديد", link: "/", children: [] });
      setItems(newItems);
      setIsOpen(true);
    };

    return (
      <div className="mt-4 border-r-2 border-[#333] pr-4 mr-2">
        <div className="flex flex-col md:flex-row items-center gap-3 bg-[#111] border border-[#222] p-4 rounded-xl group hover:border-[#F5C518]/40 transition-all">
          <button onClick={() => setIsOpen(!isOpen)} className="text-[#F5C518]">
            {item.children?.length > 0 ? (isOpen ? <ChevronDown size={20}/> : <ChevronRight size={20}/>) : <Layers size={16} className="text-gray-600"/>}
          </button>

          <input 
            type="text" 
            value={item.title} 
            onChange={(e) => updateThis("title", e.target.value)}
            className="flex-1 bg-black border border-[#222] p-2.5 rounded-lg text-sm font-bold text-white focus:border-[#F5C518] outline-none"
            placeholder="اسم القسم"
          />

          <div className="flex items-center gap-2 flex-1 w-full">
            <LinkIcon size={14} className="text-gray-600 shrink-0" />
            <input 
              type="text" 
              value={item.link} 
              onChange={(e) => updateThis("link", e.target.value)}
              className="w-full bg-black border border-[#222] p-2.5 rounded-lg text-[11px] text-gray-400 font-mono outline-none focus:border-[#F5C518]"
              placeholder="/link"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <button onClick={addSub} title="إضافة فرعي" className="p-2 bg-[#F5C518]/10 text-[#F5C518] rounded-lg hover:bg-[#F5C518] hover:text-black transition-all">
              <Plus size={16} />
            </button>
            <button onClick={deleteThis} title="حذف" className="p-2 text-gray-600 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* رسم الأبناء لو القسم مفتوح */}
        {isOpen && item.children?.map((child, idx) => (
          <MenuItem key={child.id} item={child} path={[...path, idx]} />
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#F5C518]" size={40} />
      <p className="text-[#F5C518] font-black tracking-widest animate-pulse">WIND DATA DECRYPTING...</p>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-[#0a0a0a] text-white font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto pb-40">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#111] p-8 rounded-3xl border border-[#222] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-black rounded-2xl border border-[#222] text-[#F5C518] shadow-inner">
              <Navigation size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">Wind Menu <span className="text-[#F5C518] text-sm not-italic font-bold tracking-normal">Hierarchy</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">إدارة الهيكل التنظيمي الكامل</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setItems([...items, { id: Math.random().toString(), title: "قسم رئيسي جديد", link: "/", children: [] }])}
              className="flex-1 md:flex-none bg-[#222] border border-[#333] px-6 py-3 rounded-2xl text-sm font-bold hover:border-[#F5C518] transition-all"
            >
              + قسم رئيسي
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 md:flex-none bg-[#F5C518] text-black px-12 py-3 rounded-2xl font-black shadow-[0_10px_30px_rgba(245,197,24,0.3)] hover:bg-white transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mx-auto" size={20}/> : "حفظ التغييرات"}
            </button>
          </div>
        </div>

        {/* Tree List */}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <MenuItem key={item.id} item={item} path={[idx]} />
          ))}

          {items.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-[#222] rounded-3xl text-gray-600 font-black uppercase tracking-widest">
              القائمة فارغة
            </div>
          )}
        </div>

      </div>
    </div>
  );
}