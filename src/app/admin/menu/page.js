"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Plus, Save, Loader2, Trash2, Link as LinkIcon, 
  Layers, Database, ChevronDown, ChevronRight, Layout, Menu, MonitorMobile
} from "lucide-react";

export default function IntegratedLightMenu() {
  const [items, setItems] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set()); // لتخزين الأقسام المفتوحة

  // --- 1. جلب البيانات ---
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

  // --- 2. وظائف التحكم ---
  const toggleAccordion = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  const updateItem = (path, field, value) => {
    const newItems = JSON.parse(JSON.stringify(items));
    let current = { children: newItems };
    path.forEach(idx => { current = current.children[idx]; });
    current[field] = value;
    setItems(newItems);
  };

  const addItem = (path = null) => {
    const newItem = { id: Math.random().toString(36).substr(2, 9), title: "قسم جديد", link: "/", children: [] };
    const newItems = JSON.parse(JSON.stringify(items));
    if (path === null) newItems.push(newItem);
    else {
      let current = { children: newItems };
      path.forEach(idx => { current = current.children[idx]; });
      current.children.push(newItem);
      // فتح الأب تلقائياً عند إضافة ابن
      const parentId = current.id;
      if (parentId) {
        const newExpanded = new Set(expandedIds);
        newExpanded.add(parentId);
        setExpandedIds(newExpanded);
      }
    }
    setItems(newItems);
  };

  const deleteItem = (path) => {
    if (!confirm("حذف هذا البند؟")) return;
    const newItems = JSON.parse(JSON.stringify(items));
    if (path.length === 1) newItems.splice(path[0], 1);
    else {
      let parent = { children: newItems };
      for (let i = 0; i < path.length - 1; i++) parent = parent.children[path[i]];
      parent.children.splice(path[path.length - 1], 1);
    }
    setItems(newItems);
  };

  // --- 3. المكون الشجري (Accordion System) ---
  const RenderMenuTree = ({ list, path = [], level = 0 }) => {
    return (
      <div className="space-y-4 w-full">
        {list.map((item, index) => {
          const currentPath = [...path, index];
          const isOpen = expandedIds.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id} className="w-full">
              {/* Box البند - تصميم Light Mode */}
              <div className={`
                flex flex-col border border-gray-200 rounded-2xl transition-all duration-300 overflow-hidden
                ${isOpen ? 'bg-white shadow-xl ring-1 ring-yellow-400/20' : 'bg-gray-50/50 hover:bg-white hover:border-yellow-400/50'}
              `}>
                
                {/* Header البند (دائماً ظاهر) */}
                <div className="flex flex-wrap items-center gap-3 p-3 md:p-4">
                  {/* زر الأكورديون */}
                  <button 
                    onClick={() => toggleAccordion(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${hasChildren ? 'text-yellow-600 bg-yellow-50' : 'text-gray-300'}`}
                  >
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  {/* الاسم والرابط */}
                  <div className="flex-1 min-w-[200px] flex flex-col md:flex-row gap-2">
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                      className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="اسم القسم"
                    />
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl">
                      <LinkIcon size={14} className="text-gray-400" />
                      <span className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]" dir="ltr">{item.link}</span>
                    </div>
                  </div>

                  {/* أزرار التحكم السريع (Plus & Delete) */}
                  <div className="flex items-center gap-2 mr-auto border-r border-gray-100 pr-2">
                    <button onClick={() => addItem(currentPath)} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-xl" title="إضافة فرعي">
                      <Plus size={18} />
                    </button>
                    <button onClick={() => deleteItem(currentPath)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* تفاصيل الربط (تظهر فقط عند الفتح أو كجزء من الأكورديون) */}
                {isOpen && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Database size={12}/> الربط التلقائي بالكولكشن
                        </label>
                        <select 
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none"
                          value={item.link.split('/').pop()}
                          onChange={(e) => {
                            const selected = availableCollections.find(c => c.slug === e.target.value);
                            if (selected) {
                              updateItem(currentPath, 'title', selected.name);
                              updateItem(currentPath, 'link', `/collections/${selected.slug}`);
                            }
                          }}
                        >
                          <option value="">-- اختر قسم من المتجر --</option>
                          {availableCollections.map(c => (
                            <option key={c.id} value={c.slug}>{c.name} ({c.productCount} منتج)</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Layout size={12}/> الرابط اليدوي
                        </label>
                        <input 
                          type="text" 
                          value={item.link} 
                          onChange={(e) => updateItem(currentPath, 'link', e.target.value)}
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-mono text-gray-600"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* الأبناء (إزاحة ذكية) */}
              {isOpen && hasChildren && (
                <div className="mr-6 md:mr-10 mt-4 border-r-2 border-gray-100 pr-4 md:pr-6">
                  <RenderMenuTree list={item.children} path={currentPath} level={level + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-gray-100 border-t-yellow-400 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-400 font-bold tracking-widest animate-pulse">WIND LIGHT CMS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans pb-20 px-4 md:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto pt-8">
        
        {/* Header - موبايل فريندلي */}
        <header className="bg-white border border-gray-200 p-6 md:p-8 rounded-[2rem] shadow-sm mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-400 text-black rounded-2xl shadow-lg shadow-yellow-400/20">
              <Menu size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-tighter">
                إدارة المنيو <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md tracking-normal not-italic">V7.0</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1">
                <MonitorMobile size={10}/> تصميم متجاوب 100%
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => addItem()}
              className="flex-1 md:flex-none bg-gray-100 text-gray-700 px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
            >+ قسم رئيسي</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 md:flex-none bg-yellow-400 text-black px-10 py-3.5 rounded-2xl font-black hover:bg-black hover:text-white transition-all shadow-lg shadow-yellow-400/10 disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ الهيكل"}
            </button>
          </div>
        </header>

        {/* قائمة المنيو (أكورديون) */}
        <div className="max-w-4xl mx-auto">
          <RenderMenuTree list={items} />
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
            <Layers className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold uppercase text-xs">قائمة التنقل فارغة</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700;900&display=swap');
        body { font-family: 'Public Sans', sans-serif; background-color: #FDFDFD; }
        input::placeholder { color: #9CA3AF; }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}