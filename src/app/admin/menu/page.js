"use client";

import React, { useState, useEffect } from "react";
// استخدام @ لضمان الوصول للمجلدات من أي مكان في المشروع
import { db } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { 
  Plus, Save, Loader2, Trash2, 
  Link as LinkIcon, Layers, Database, 
  Layout, MonitorSmartphone, Menu,
  ChevronDown, ChevronRight, Info, X, ChevronUp, ArrowRight
} from "lucide-react";

export default function ProfessionalMenuManager() {
  const [items, setItems] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  // --- 1. جلب البيانات (مزامنة حية) ---
  useEffect(() => {
    // جلب الأقسام المتاحة لربطها
    const fetchCollections = async () => {
      try {
        const colsSnap = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsSnap.docs.map(d => ({
          id: d.id,
          name: String(d.data().name || "بدون اسم"),
          slug: String(d.data().slug || ""),
          productCount: d.data().productCount || 0
        })));
      } catch (err) { console.error("Error fetching collections:", err); }
    };

    // جلب المنيو (اتصال حي)
    const unsubMenu = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().menuItems) {
        setItems(sanitizeData(docSnap.data().menuItems));
      }
      setLoading(false);
    });

    fetchCollections();
    return () => unsubMenu();
  }, []);

  // دالة حماية لمنع الأوبجكت من دخول الـ Inputs (تجنب Error 130)
  const sanitizeData = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: String(item.id || Math.random().toString(36).substr(2, 9)),
      title: typeof item.title === 'string' ? item.title : "",
      link: typeof item.link === 'string' ? item.link : "/",
      children: sanitizeData(item.children || [])
    }));
  };

  // --- 2. وظائف التحكم ---
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
      alert("تم حفظ منيو WIND المترابط بنجاح! 🚀");
    } catch (e) {
      alert("حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

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
    if (path === null) {
      newItems.push(newItem);
    } else {
      let current = { children: newItems };
      path.forEach(idx => { current = current.children[idx]; });
      current.children.push(newItem);
      if (current.id) {
        const nextExp = new Set(expandedItems);
        nextExp.add(current.id);
        setExpandedItems(nextExp);
      }
    }
    setItems(newItems);
  };

  const deleteItem = (path) => {
    if (!confirm("سيتم حذف القسم وفروعه، هل أنت متأكد؟")) return;
    const newItems = JSON.parse(JSON.stringify(items));
    if (path.length === 1) {
      newItems.splice(path[0], 1);
    } else {
      let parent = { children: newItems };
      for (let i = 0; i < path.length - 1; i++) { parent = parent.children[path[i]]; }
      parent.children.splice(path[path.length - 1], 1);
    }
    setItems(newItems);
  };

  // --- 3. مكون شجرة المنيو (أكورديون) ---
  const RenderMenuTree = ({ list, path = [], depth = 0 }) => {
    return (
      <div className={`space-y-4 ${depth > 0 ? 'mt-4 mr-4 md:mr-10 border-r-2 border-[#1a1a1a] pr-4' : ''}`}>
        {list.map((item, index) => {
          const currentPath = [...path, index];
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id} className="relative animate-in slide-in-from-right duration-300">
              <div className={`
                bg-[#111] border ${isExpanded ? 'border-[#F5C518]/40 shadow-xl' : 'border-[#222]'} 
                p-4 md:p-5 rounded-[1.5rem] flex flex-col xl:flex-row items-center gap-4 transition-all
              `}>
                
                {/* التحكم بالأكورديون */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {hasChildren ? (
                    <button onClick={() => toggleAccordion(item.id)} className="p-2 bg-black rounded-lg text-[#F5C518]">
                      {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-gray-800">•</div>
                  )}
                </div>

                {/* ربط الكولكشن */}
                <div className="w-full xl:w-64">
                  <select 
                    className="w-full bg-black border border-[#333] p-3 rounded-xl text-[11px] text-[#F5C518] font-bold outline-none"
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
                    {availableCollections.map(c => (
                      <option key={c.id} value={c.slug}>{c.name} ({c.productCount})</option>
                    ))}
                  </select>
                </div>

                {/* العنوان */}
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                    className="w-full bg-transparent border-b border-[#222] focus:border-[#F5C518] p-2 text-sm font-black text-white outline-none"
                    placeholder="اسم البند"
                  />
                </div>

                {/* عرض الرابط */}
                <div className="hidden xl:flex flex-1 items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-[#222]">
                  <LinkIcon size={12} className="text-gray-600" />
                  <span className="text-[9px] text-gray-500 font-mono truncate" dir="ltr">{item.link}</span>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => addItem(currentPath)} className="p-3 bg-[#F5C518] text-black rounded-xl hover:scale-105 transition-all">
                    <Plus size={18} />
                  </button>
                  <button onClick={() => deleteItem(currentPath)} className="p-3 text-gray-600 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* الأبناء */}
              {hasChildren && isExpanded && (
                <RenderMenuTree list={item.children} path={currentPath} depth={depth + 1} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#F5C518]" size={40} />
      <p className="text-[#F5C518] font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">WIND Navigation Secure Build...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 bg-[#080808] min-h-screen text-white font-sans selection:bg-[#F5C518] selection:text-black" dir="rtl">
      <div className="max-w-6xl mx-auto pb-60">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 bg-[#111] p-10 rounded-[2.5rem] border border-[#222] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5C518]/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-black rounded-3xl border border-[#222] text-[#F5C518] shadow-2xl">
              <MonitorSmartphone size={32}/>
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Integrated <span className="text-[#F5C518]">Nav</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3">نظام إدارة الأقسام الشجرية المترابطة</p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto relative z-10">
            <button onClick={() => addItem()} className="flex-1 md:flex-none bg-[#1a1a1a] px-8 py-4 rounded-2xl text-[10px] font-black border border-[#333] hover:border-[#F5C518] transition-all tracking-widest">+ قسم رئيسي</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 md:flex-none bg-[#F5C518] text-black px-12 py-4 rounded-2xl font-black shadow-[0_15px_40px_rgba(245,197,24,0.2)] hover:bg-white hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {saving ? " جاري الحفظ" : " حفظ المنيو"}
            </button>
          </div>
        </header>

        <RenderMenuTree list={items} />

        {items.length === 0 && (
          <div className="py-40 text-center border-4 border-dashed border-[#111] rounded-[4rem] text-gray-800 font-black uppercase tracking-[0.5em]">
            Menu is Empty
          </div>
        )}
      </div>
    </div>
  );
}