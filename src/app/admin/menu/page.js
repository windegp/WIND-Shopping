"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, Star, Navigation, AlertTriangle } from "lucide-react";

import "react-nestable/dist/styles/index.css"; 

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState([]);

  // --- 1. فلتر الأمان (The Sanitizer) ---
  // الدالة دي بتدخل جوه أي داتا "غريبة" وبتحولها لنص سليم غصب عنها
  const sanitize = (data) => {
    if (!data || typeof data !== 'object') return [];
    
    // لو البيانات جاية كأوبجيكت وجواها menuItems (زي داتا فايربيس)
    const list = Array.isArray(data) ? data : (data.menuItems || []);

    return list.map(item => {
      // تحويل العنوان والرابط لنصوص مهما كان نوعهم في الفايربيس
      const title = typeof item.title === 'string' ? item.title : "قسم غير معرف";
      const link = typeof item.link === 'string' ? item.link : "/";
      
      return {
        id: item.id || uuidv4(), // لازم ID فريد عشان السحب والإفلات يشتغل
        title: title,
        link: link,
        highlight: !!item.highlight,
        // تكرار العملية للأقسام الفرعية (Recursion) لضمان تعدد المستويات
        children: item.children ? sanitize(item.children) : []
      };
    });
  };

  // --- 2. جلب البيانات من الفايربيس ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // جلب الكولكشنز عشان تظهر في القائمة
        const colsSnap = await getDocs(collection(db, "collections"));
        setCollections(colsSnap.docs.map(d => ({ name: d.data().name, slug: d.data().slug })));

        // جلب مستند المنيو
        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists()) {
          const cleanData = sanitize(menuSnap.data());
          setItems(cleanData);
        } else {
          // منيو افتراضي لو الفايربيس فاضي
          setItems([{ id: uuidv4(), title: "الرئيسية", link: "/", children: [] }]);
        }
      } catch (err) {
        console.error("خطأ في التحميل:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // --- 3. حفظ البيانات بنظام "النظافة القصوى" ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // بنحفظ الداتا بنفس الترتيب اللي عملته بالسحب والإفلات
      const dataToSave = items.map(function clean(item) {
        return {
          title: String(item.title),
          link: String(item.link),
          highlight: !!item.highlight,
          children: item.children ? item.children.map(clean) : []
        };
      });

      await setDoc(doc(db, "settings", "navigation"), { menuItems: dataToSave });
      alert("تم الحفظ بنجاح! 🚀");
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  // --- 4. رسم كل عنصر في المنيو (UI) ---
  const renderItem = ({ item, collapseIcon, handler }) => {
    return (
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] p-3 rounded-xl mb-2 shadow-sm group hover:border-[#F5C518]/50 transition-all">
        {/* مقبض السحب */}
        <div {...handler} className="cursor-grab text-gray-600 hover:text-[#F5C518] p-1"><GripVertical size={18} /></div>
        
        {/* أيقونة الطي (تظهر لو فيه أبناء) */}
        <div className="w-4 text-[#F5C518] flex justify-center">{collapseIcon}</div>

        {/* خانة العنوان */}
        <input 
          type="text" 
          value={item.title} 
          onChange={(e) => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, title: e.target.value} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="flex-[1.5] bg-[#121212] border border-[#333] p-2 rounded-lg text-sm text-white focus:border-[#F5C518] outline-none"
          placeholder="عنوان القسم"
        />

        {/* اختيار كولكشن أو رابط يدوي */}
        <div className="flex-[2] hidden md:flex items-center gap-2">
          <select 
            value={item.link.startsWith('/collections/') ? item.link.split('/').pop() : ""}
            onChange={(e) => {
              const newLink = e.target.value ? `/collections/${e.target.value}` : "/";
              const update = (list) => list.map(i => i.id === item.id ? {...i, link: newLink} : {...i, children: update(i.children || [])});
              setItems(update(items));
            }}
            className="bg-[#121212] border border-[#333] p-2 rounded-lg text-[10px] text-[#F5C518] outline-none cursor-pointer"
          >
            <option value="">رابط يدوي</option>
            {collections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input 
            type="text" 
            value={item.link} 
            onChange={(e) => {
              const update = (list) => list.map(i => i.id === item.id ? {...i, link: e.target.value} : {...i, children: update(i.children || [])});
              setItems(update(items));
            }}
            className="flex-1 bg-[#121212] border border-[#333] p-2 rounded-lg text-[10px] text-gray-500 font-mono"
            dir="ltr"
          />
        </div>

        {/* أزرار الإضافة والحذف */}
        <div className="flex items-center gap-1">
          <button onClick={() => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, highlight: !i.highlight} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }} className={`p-2 rounded-lg ${item.highlight ? 'bg-[#F5C518] text-black' : 'text-gray-500 hover:bg-[#222]'}`}>
            <Star size={16} fill={item.highlight ? "currentColor" : "none"} />
          </button>
          
          <button 
            title="إضافة قسم فرعي"
            onClick={() => {
              const subItem = { id: uuidv4(), title: "قسم فرعي جديد", link: "/", children: [] };
              const update = (list) => list.map(i => i.id === item.id ? {...i, children: [...(i.children || []), subItem]} : {...i, children: update(i.children || [])});
              setItems(update(items));
            }}
            className="p-2 text-[#F5C518] hover:bg-[#222] rounded-lg"
          >
            <Plus size={18} />
          </button>

          <button onClick={() => {
            if(confirm("حذف هذا القسم وكل ما بداخله؟")) {
              const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: del(i.children || [])}));
              setItems(del(items));
            }
          }} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#F5C518]" size={40} />
      <p className="text-[#F5C518] font-black tracking-widest animate-pulse">WIND SYSTEM INITIALIZING...</p>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 bg-[#1a1a1a] p-8 rounded-3xl border border-[#333] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black rounded-2xl border border-[#222] text-[#F5C518]"><Navigation size={28}/></div>
          <div>
            <h1 className="text-2xl font-black italic">WIND MENU <span className="text-[#F5C518] text-sm not-italic font-bold">STRUCTURE</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">إدارة الهيكل التنظيمي للقائمة</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي جديد", link: "/", children: [] }])} className="flex-1 md:flex-none bg-[#222] border border-[#333] px-6 py-3 rounded-2xl text-sm font-bold hover:border-[#F5C518] transition-all">+ قسم رئيسي</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none bg-[#F5C518] text-black px-10 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin"/> : "حفظ الهيكل"}
          </button>
        </div>
      </div>

      {/* Nestable Area */}
      <div className="max-w-5xl mx-auto pb-40">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={setItems}
          maxDepth={5} // يسمح بـ 5 مستويات من الأقسام الفرعية
        />
      </div>

      <style jsx global>{`
        .nestable-item-children { margin-right: 40px; border-right: 2px dashed #333; padding-right: 20px; margin-top: 10px; }
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background: #1a1a1a !important; border: 1px solid #F5C518 !important; border-radius: 15px; opacity: 0.9; }
      `}</style>
    </div>
  );
}