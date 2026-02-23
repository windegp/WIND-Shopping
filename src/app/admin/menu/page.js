"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Plus, Save, Loader2, Trash2, ArrowUp, ArrowDown, 
  Link as LinkIcon, Layers, Database, ChevronLeft, Layout
} from "lucide-react";

export default function IntegratedMenuManager() {
  const [items, setItems] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. جلب البيانات (الأقسام + المنيو الحالي) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الأقسام (المصدر)
        const colsSnap = await getDocs(collection(db, "collections"));
        const cols = colsSnap.docs.map(d => ({
          id: d.id,
          name: String(d.data().name || "بدون اسم"),
          slug: String(d.data().slug || ""),
          productCount: d.data().productCount || 0
        }));
        setAvailableCollections(cols);

        // جلب المنيو الحالي
        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists()) {
          const data = menuSnap.data().menuItems || [];
          setItems(sanitizeData(data)); // تنظيف البيانات لضمان عدم وجود Objects
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // دالة لضمان أن كل البيانات نصوص (تجنباً لـ Error 130)
  const sanitizeData = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: String(item.id || Math.random().toString(36).substr(2, 9)),
      title: String(item.title || ""),
      link: String(item.link || "/"),
      children: sanitizeData(item.children || [])
    }));
  };

  // --- 2. وظائف الإدارة (إضافة، حذف، ترتيب) ---
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "navigation"), { menuItems: items });
      alert("تم حفظ المنيو المترابط بنجاح! 🚀");
    } catch (e) {
      alert("حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
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
    }
    setItems(newItems);
  };

  const deleteItem = (path) => {
    if (!confirm("هل تريد حذف هذا البند وكل فروعه؟")) return;
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

  // --- 3. المكون الرسومي المتكرر (Recursive Component) ---
  const RenderMenuTree = ({ list, path = [] }) => {
    return (
      <div className="space-y-4">
        {list.map((item, index) => {
          const currentPath = [...path, index];
          return (
            <div key={item.id} className="relative">
              {/* Box البند */}
              <div className="bg-[#111] border border-[#222] p-4 rounded-2xl flex flex-col lg:flex-row items-center gap-4 hover:border-[#F5C518]/30 transition-all shadow-xl">
                
                {/* 1. اختيار الكولكشن (الربط المباشر) */}
                <div className="w-full lg:w-64">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={12} className="text-[#F5C518]" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">الارتباط بالأقسام</span>
                  </div>
                  <select 
                    className="w-full bg-black border border-[#333] p-2.5 rounded-xl text-xs text-[#F5C518] outline-none"
                    value={availableCollections.find(c => `/collections/${c.slug}` === item.link)?.slug || ""}
                    onChange={(e) => {
                      const selected = availableCollections.find(c => c.slug === e.target.value);
                      if (selected) {
                        updateItem(currentPath, 'title', selected.name);
                        updateItem(currentPath, 'link', `/collections/${selected.slug}`);
                      }
                    }}
                  >
                    <option value="">-- اختر قسم للربط --</option>
                    {availableCollections.map(c => (
                      <option key={c.id} value={c.slug}>{c.name} ({c.productCount} منتج)</option>
                    ))}
                  </select>
                </div>

                {/* 2. تعديل العنوان (title) */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout size={12} className="text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">عنوان المنيو</span>
                  </div>
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={(e) => updateItem(currentPath, 'title', e.target.value)}
                    className="w-full bg-black border border-[#333] p-2.5 rounded-xl text-sm text-white outline-none focus:border-[#F5C518]"
                  />
                </div>

                {/* 3. عرض الرابط (link) */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon size={12} className="text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">المسار (Link)</span>
                  </div>
                  <input 
                    type="text" 
                    value={item.link} 
                    onChange={(e) => updateItem(currentPath, 'link', e.target.value)}
                    className="w-full bg-black border border-[#222] p-2.5 rounded-xl text-[10px] text-gray-500 font-mono"
                    dir="ltr"
                  />
                </div>

                {/* 4. أزرار التحكم */}
                <div className="flex items-center gap-2 mt-4 lg:mt-6 border-t lg:border-t-0 lg:border-r border-[#222] pt-4 lg:pt-0 lg:pr-4">
                  <button onClick={() => addItem(currentPath)} className="p-2 bg-[#F5C518]/10 text-[#F5C518] rounded-lg hover:bg-[#F5C518] hover:text-black transition-all" title="إضافة فرع">
                    <Plus size={18} />
                  </button>
                  <button onClick={() => deleteItem(currentPath)} className="p-2 text-gray-600 hover:text-red-500 transition-all" title="حذف">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* رسم الأبناء (Sub-items) */}
              {item.children && item.children.length > 0 && (
                <div className="mr-8 mt-4 border-r-2 border-[#222] pr-4">
                  <RenderMenuTree list={item.children} path={currentPath} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#F5C518]" size={40} />
      <p className="text-[#F5C518] font-black tracking-widest animate-pulse">WIND INTEGRATED ENGINE...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen text-white font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto pb-40">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#111] p-8 rounded-3xl border border-[#222] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-black rounded-2xl border border-[#222] text-[#F5C518]"><Layers size={30} /></div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">Integrated <span className="text-[#F5C518]">Nav</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">الربط المباشر بين المنيو والأقسام</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={() => addItem()} className="flex-1 md:flex-none bg-[#222] px-8 py-3 rounded-2xl text-sm font-bold border border-[#333] hover:border-[#F5C518] transition-all">+ قسم رئيسي</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 md:flex-none bg-[#F5C518] text-black px-12 py-3 rounded-2xl font-black shadow-lg hover:bg-white transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : "حفظ التغييرات"}
            </button>
          </div>
        </header>

        {/* Tree Render */}
        <RenderMenuTree list={items} />

        {items.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-[#111] rounded-3xl text-gray-700 font-black uppercase">
            المنيو فارغ حالياً
          </div>
        )}

      </div>
    </div>
  );
}