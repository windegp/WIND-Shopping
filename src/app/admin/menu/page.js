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
      <div className={`space-y-3 ${depth > 0 ? 'mt-3 mr-4 sm:mr-8 border-r-2 border-gray-200 pr-4 sm:pr-6 relative' : ''}`}>
        {list.map((item, index) => {
          const currentPath = [...path, index];
          const isExpanded = expandedItems.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          // تدرج لوني ذكي حسب العمق
          const depthBgClass = 
            depth === 0 ? "bg-white border-gray-200 shadow-sm" : 
            depth === 1 ? "bg-[#fafafa] border-gray-200" : 
            depth === 2 ? "bg-[#f4f6f8] border-gray-300" : 
            "bg-[#eeeeee] border-gray-300";

          return (
            <div key={item.id} className="relative animate-[fadeIn_0.2s_ease-out]">
              
              {/* خط التوصيل الأفقي للأبناء (عشان يبان إنه متفرع من اللي فوقه) */}
              {depth > 0 && (
                <div className="absolute top-8 -right-4 sm:-right-6 w-4 sm:w-6 h-[2px] bg-gray-200"></div>
              )}

              <div className={`
                border ${depthBgClass} 
                p-4 sm:p-5 rounded-xl transition-all duration-200 hover:border-[#008060]/50 relative z-10
                ${isExpanded && depth === 0 ? 'ring-1 ring-gray-200 shadow-md' : ''}
              `}>
                
                {/* 1. رأس الكارت (مؤشر المستوى + أزرار الطي والحذف) */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200/60">
                  <div className="flex items-center gap-3">
                    {hasChildren ? (
                      <button 
                        onClick={() => toggleAccordion(item.id)} 
                        className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-[#008060] text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        title={isExpanded ? "طي القائمة" : "إظهار القوائم الفرعية"}
                      >
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>
                    ) : (
                      <div className="w-7 h-7 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                    )}
                    <span className="bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-1 rounded border border-gray-200">
                      مستوى {depth + 1}
                    </span>
                    <h3 className="text-sm font-bold text-[#202223] truncate max-w-[150px] sm:max-w-xs">{item.title || "بند جديد"}</h3>
                  </div>

                  <button 
                    onClick={() => deleteItem(currentPath)} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100"
                    title="حذف هذا القسم بالكامل"
                  >
                    <Trash2 size={14} /> <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>

                {/* 2. منطقة الإدخال (الربط والعنوان) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ربط الكولكشن */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">ربط بقسم موجود (اختياري)</label>
                    <select 
                      className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm text-[#202223] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all cursor-pointer"
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
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">عنوان القسم (لظهوره للعميل)</label>
                    <input 
                      type="text" 
                      value={item.title} 
                      onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                      className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm font-bold text-[#202223] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all"
                      placeholder="مثال: أحدث الشيلان"
                    />
                  </div>
                </div>

                {/* 3. الرابط (عرض فقط للتأكيد) وزر التفريع */}
                <div className="mt-4 pt-4 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <LinkIcon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 font-mono truncate w-full" dir="ltr" title={item.link}>{item.link}</span>
                  </div>
                  
                  {/* الزر السحري الخاص بإضافة أبناء لهذا القسم فقط */}
                  <button 
                    onClick={() => addItem(currentPath)} 
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#202223] text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-sm"
                  >
                    <Plus size={14} /> إضافة تفريع داخلي
                  </button>
                </div>

              </div>

              {/* منطقة الأبناء (تفتح وتقفل بناءً على الأكورديون) */}
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
        <p className="font-bold text-sm text-gray-500">جاري تحميل هيكل المتجر...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#f4f6f8] min-h-screen text-[#202223] font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto pb-24">
        
        {/* الهيدر العلوي */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[#008060]">
              <Layers size={28}/>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#202223]">القوائم الرئيسية (Navigation)</h1>
              <p className="text-xs text-gray-500 mt-1">نظام إدارة الأقسام الشجرية المترابطة</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            {/* الزر ده مخصص للقسم الرئيسي فقط (مستوى 1) */}
            <button 
              onClick={() => addItem()} 
              className="w-full sm:w-auto bg-white border border-gray-300 text-[#202223] px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Plus size={16}/> إضافة قائمة رئيسية
            </button>
            <button 
              onClick={async () => {
                setSaving(true);
                await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
                setSaving(false);
                alert("تم حفظ الهيكل بنجاح! سيتم تحديث قائمة المتجر للمستخدمين.");
              }} 
              disabled={saving}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                saving ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#008060] text-white hover:bg-[#006e52]'
              }`}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "جاري الحفظ..." : "حفظ الهيكل"}
            </button>
          </div>
        </header>

        {/* مساحة عرض الشجرة */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[50vh]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-80">
              <Menu size={56} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-[#202223]">القائمة فارغة تماماً</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">لم تقم بإضافة أي أقسام لقائمة التنقل الخاصة بالمتجر. ابدأ بإضافة القوائم الرئيسية ثم فرّع منها.</p>
              <button onClick={() => addItem()} className="mt-6 bg-gray-50 border border-gray-200 text-[#202223] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={16}/> أضف قسمك الرئيسي الأول
              </button>
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