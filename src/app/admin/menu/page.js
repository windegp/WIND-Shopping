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
      <div className={`space-y-3 ${depth > 0 ? 'mt-3 mr-3 sm:mr-8 border-r-2 border-gray-100 pr-3 sm:pr-5' : ''}`}>
        {list.map((item, index) => {
          const currentPath = [...path, index];
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id} className="relative animate-[fadeIn_0.2s_ease-out]">
              <div className={`
                bg-white border ${isExpanded ? 'border-gray-300 shadow-md ring-1 ring-gray-100' : 'border-gray-200 shadow-sm'} 
                p-4 sm:p-5 rounded-xl flex flex-col lg:flex-row lg:items-center gap-4 transition-all duration-200 hover:border-gray-300 relative z-10
              `}>
                
                {/* 1. أيقونة الأكورديون + السحب (بصرياً) */}
                <div className="flex items-center gap-3">
                  {hasChildren ? (
                    <button 
                      onClick={() => toggleAccordion(item.id)} 
                      className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-gray-200 text-[#202223]' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      title={isExpanded ? "طي القائمة" : "إظهار القائمة الفرعية"}
                    >
                      {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* 2. منطقة الإدخال (ربط القسم والعنوان) */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  
                  {/* ربط الكولكشن */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ربط بقسم (اختياري)</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-sm text-[#202223] outline-none focus:bg-white focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all cursor-pointer"
                      value={availableCollections.find(c => `/collections/${c.slug}` === item.link)?.slug || ""}
                      onChange={(e) => {
                        const selected = availableCollections.find(c => c.slug === e.target.value);
                        if (selected) {
                          updateItem(currentPath, 'title', selected.name);
                          updateItem(currentPath, 'link', `/collections/${selected.slug}`);
                        }
                      }}
                    >
                      <option value="">-- اختر قسماً للربط --</option>
                      {availableCollections.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* العنوان */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">عنوان البند (الذي يظهر للعميل)</label>
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                      className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm font-bold text-[#202223] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all"
                      placeholder="مثال: أحدث الشيلان"
                    />
                  </div>
                </div>

                {/* 3. الرابط (يظهر في الشاشات الكبيرة) */}
                <div className="hidden xl:flex flex-col flex-1 max-w-[200px]">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">الرابط الوجهة</label>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                    <LinkIcon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 font-mono truncate" dir="ltr" title={item.link}>{item.link}</span>
                  </div>
                </div>

                {/* 4. أزرار الإجراءات */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0 mt-2 lg:mt-0">
                  <button 
                    onClick={() => addItem(currentPath)} 
                    className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-[#202223] text-xs font-bold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                    title="إضافة قائمة فرعية متفرعة من هذا البند"
                  >
                    <Plus size={14} /> <span>تفريع</span>
                  </button>
                  <button 
                    onClick={() => deleteItem(currentPath)} 
                    className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 rounded-lg transition-colors"
                    title="حذف هذا البند"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* منطقة الأبناء (تفتح وتقفل) */}
              {hasChildren && isExpanded && (
                <div className="animate-[slideDown_0.3s_ease-out]">
                  <RenderMenuTree list={item.children} path={currentPath} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-[#202223]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#202223] mb-4"></div>
        <p className="font-bold text-sm text-gray-500">جاري تحميل شجرة القوائم...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#f4f6f8] min-h-screen text-[#202223] font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto pb-24">
        
        {/* الهيدر العلوي */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[#202223]">
              <Layers size={28}/>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#202223]">القوائم (Navigation)</h1>
              <p className="text-xs text-gray-500 mt-1">نظام إدارة الأقسام الشجرية المترابطة (Menu)</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <button 
              onClick={() => addItem()} 
              className="w-full sm:w-auto bg-white border border-gray-300 text-[#202223] px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Plus size={16}/> قائمة رئيسية
            </button>
            <button 
              onClick={async () => {
                setSaving(true);
                await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
                setSaving(false);
                alert("تم الحفظ بنجاح! ✨");
              }} 
              disabled={saving}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                saving ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#1a1a1a] text-white hover:bg-black'
              }`}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </header>

        {/* مساحة عرض الشجرة */}
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[50vh]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
              <Menu size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-500">القائمة فارغة</h3>
              <p className="text-sm text-gray-400 mt-1">ابدأ بإضافة قائمة رئيسية لمتجرك لترتيب الأقسام.</p>
              <button onClick={() => addItem()} className="mt-6 text-[#008060] font-bold text-sm hover:underline flex items-center gap-1"><Plus size={16}/> أضف قائمتك الأولى</button>
            </div>
          ) : (
            <RenderMenuTree list={items} />
          )}
        </div>

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}