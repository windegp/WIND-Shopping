"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Plus, Save, Loader2, Trash2, 
  Link as LinkIcon, Layers, Database, 
  Layout, MonitorSmartphone, Menu,
  ChevronDown, ChevronRight, Info, X, ChevronUp
} from "lucide-react";

export default function ProfessionalMenuManager() {
  const [items, setItems] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set()); // لإدارة الأكورديون

  // --- جلب البيانات ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const colsSnap = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsSnap.docs.map(d => ({
          id: d.id,
          name: String(d.data().name || "بدون اسم"),
          slug: String(d.data().slug || ""),
          productCount: d.data().productCount || 0
        })));

        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists()) {
          const data = menuSnap.data().menuItems || [];
          setItems(sanitizeData(data));
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const sanitizeData = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: String(item.id || Math.random().toString(36).substr(2, 9)),
      title: String(item.title || ""),
      link: String(item.link || "/"),
      children: sanitizeData(item.children || [])
    }));
  };

  // --- وظائف التحكم ---
  const toggleAccordion = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedItems(newExpanded);
  };

  const updateItem = (path, field, value) => {
    const newItems = JSON.parse(JSON.stringify(items));
    let current = { children: newItems };
    path.forEach(idx => { current = current.children[idx]; });
    current[field] = value;
    setItems(newItems);
  };

  const addItem = (path = null) => {
    const newItem = { id: Math.random().toString(36).substr(2, 9), title: "بند جديد", link: "/", children: [] };
    const newItems = JSON.parse(JSON.stringify(items));
    if (path === null) newItems.push(newItem);
    else {
      let current = { children: newItems };
      path.forEach(idx => { current = current.children[idx]; });
      current.children.push(newItem);
      // فتح الأكورديون تلقائياً عند إضافة فرع
      const parentId = current.id;
      if (parentId) {
        const newExpanded = new Set(expandedItems);
        newExpanded.add(parentId);
        setExpandedItems(newExpanded);
      }
    }
    setItems(newItems);
  };

  const deleteItem = (path) => {
    if (!confirm("سيتم حذف هذا القسم وكل ما بداخله، هل أنت متأكد؟")) return;
    const newItems = JSON.parse(JSON.stringify(items));
    if (path.length === 1) newItems.splice(path[0], 1);
    else {
      let parent = { children: newItems };
      for (let i = 0; i < path.length - 1; i++) { parent = parent.children[path[i]]; }
      parent.children.splice(path[path.length - 1], 1);
    }
    setItems(newItems);
  };

  // --- مكون الشجرة (الأكورديون) ---
  const RenderMenuTree = ({ list, path = [], depth = 0 }) => {
    return (
      <div className={`space-y-4 ${depth > 0 ? 'mt-4 mr-4 md:mr-10 border-r border-[#222] pr-4' : ''}`}>
        {list.map((item, index) => {
          const currentPath = [...path, index];
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id} className="relative">
              <div className={`
                bg-[#111] border ${isExpanded ? 'border-[#F5C518]/40 shadow-[0_0_20px_rgba(245,197,24,0.05)]' : 'border-[#222]'} 
                p-4 md:p-5 rounded-[2rem] flex flex-col xl:flex-row items-center gap-4 transition-all duration-300
              `}>
                
                {/* أيقونة الأكورديون + السحب (بصرياً) */}
                <div className="flex items-center gap-3 self-start md:self-center">
                  {hasChildren ? (
                    <button onClick={() => toggleAccordion(item.id)} className="p-2 bg-black rounded-full text-[#F5C518] hover:scale-110 transition-transform">
                      {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-gray-800"><div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div></div>
                  )}
                </div>

                {/* ربط الكولكشن */}
                <div className="w-full xl:w-64">
                  <select 
                    className="w-full bg-black border border-[#333] p-3 rounded-2xl text-[11px] text-[#F5C518] font-bold outline-none focus:border-[#F5C518]"
                    value={availableCollections.find(c => `/collections/${c.slug}` === item.link)?.slug || ""}
                    onChange={(e) => {
                      const selected = availableCollections.find(c => c.slug === e.target.value);
                      if (selected) {
                        updateItem(currentPath, 'title', selected.name);
                        updateItem(currentPath, 'link', `/collections/${selected.slug}`);
                      }
                    }}
                  >
                    <option value="">-- ربط بقسم --</option>
                    {availableCollections.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>

                {/* العنوان */}
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                    className="w-full bg-transparent border-b border-[#222] focus:border-[#F5C518] p-2 text-sm font-black text-white outline-none"
                    placeholder="عنوان البند"
                  />
                </div>

                {/* الرابط */}
                <div className="hidden lg:flex flex-1 items-center gap-2 bg-black/40 px-4 py-2.5 rounded-2xl border border-[#222]">
                  <LinkIcon size={12} className="text-gray-600" />
                  <span className="text-[9px] text-gray-500 font-mono truncate" dir="ltr">{item.link}</span>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-[#222] pt-3 md:pt-0">
                  <button onClick={() => addItem(currentPath)} className="p-2.5 bg-[#F5C518] text-black rounded-xl hover:bg-white transition-all shadow-lg">
                    <Plus size={18} />
                  </button>
                  <button onClick={() => deleteItem(currentPath)} className="p-2.5 text-gray-600 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* منطقة الأبناء (تفتح وتقفل) */}
              {hasChildren && isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <RenderMenuTree list={item.children} path={currentPath} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-[#F5C518] font-black tracking-widest animate-pulse">WIND NAVIGATION LOADING...</div>;

  return (
    <div className="p-4 md:p-10 bg-[#080808] min-h-screen text-white font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto pb-40">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 bg-[#111] p-8 md:p-12 rounded-[3rem] border border-[#222] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5C518]/5 blur-[100px] rounded-full"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-black rounded-[2rem] border border-[#222] text-[#F5C518] shadow-2xl"><MonitorSmartphone size={32}/></div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">Integrated <span className="text-[#F5C518]">Nav</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">نظام إدارة الأقسام الشجرية المترابطة</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto relative z-10">
            <button onClick={() => addItem()} className="flex-1 md:flex-none bg-[#1a1a1a] px-8 py-4 rounded-2xl text-[10px] font-black border border-[#333] hover:border-[#F5C518] transition-all uppercase tracking-widest">+ رئيسي</button>
            <button 
              onClick={async () => {
                setSaving(true);
                await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
                setSaving(false);
                alert("تم الحفظ بنجاح! ✨");
              }} 
              disabled={saving}
              className="flex-1 md:flex-none bg-[#F5C518] text-black px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-white transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : "حفظ الهيكل"}
            </button>
          </div>
        </header>

        <RenderMenuTree list={items} />

      </div>
    </div>
  );
}