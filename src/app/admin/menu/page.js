"use client";

import React, { useState, useEffect } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2 } from "lucide-react";

// استايل المكتبة الأساسي
import "react-nestable/dist/styles/index.css"; 

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. جلب البيانات من Firebase أو وضع القائمة الحالية كافتراضية
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: uuidv4(),
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        } else {
          // لو الفايربيز فاضي، يظهر القوائم الموجودة حالياً في WIND
          const defaultItems = [
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
            { id: uuidv4(), title: "وصل حديثاً", link: "/new-arrivals", children: [] },
            { id: uuidv4(), title: "الأكثر مبيعاً", link: "/best-sellers", children: [] },
            { id: uuidv4(), title: "تخفيضات", link: "/sale", children: [], highlight: true },
          ];
          setItems(defaultItems);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // دالة تنظيف البيانات قبل الحفظ
  const cleanDataForFirebase = (list) => {
    return list.map((item) => {
      const cleanedItem = {
        title: item.title || "بدون اسم",
        link: item.link || "#",
      };
      if (item.children && item.children.length > 0) {
        cleanedItem.children = cleanDataForFirebase(item.children);
      }
      return cleanedItem;
    });
  };

  // حفظ البيانات إلى Firebase
  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = cleanDataForFirebase(items);
      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanedItems,
      });
      alert("تم حفظ قائمة WIND بنجاح! 🎉");
    } catch (error) {
      console.error("Error saving menu:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  // إضافة عنصر جديد للقائمة
  const addItem = () => {
    setItems([...items, { id: uuidv4(), title: "قسم جديد", link: "/", children: [] }]);
  };

  // تحديث بيانات عنصر (الاسم أو الرابط)
  const updateItem = (id, field, value) => {
    const updateRecursive = (list) =>
      list.map((item) => {
        if (item.id === id) return { ...item, [field]: value };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    setItems(updateRecursive(items));
  };

  // حذف عنصر
  const deleteItem = (id) => {
    const deleteRecursive = (list) =>
      list.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : [],
      }));
    if (confirm("هل تريد حذف هذا القسم من WIND؟")) setItems(deleteRecursive(items));
  };

  // شكل العنصر الواحد (تصميم داكن متناسق مع لوحة التحكم)
  const renderItem = ({ item, collapseIcon, handler }) => {
    return (
      <div className="flex flex-col md:flex-row items-center gap-3 bg-[#1a1a1a] border border-[#333] p-4 rounded-lg mb-2 group hover:border-[#F5C518] transition-all shadow-md w-full">
        {/* مقبض السحب */}
        <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518]">
          <GripVertical size={20} />
        </div>

        {/* أيقونة فتح القائمة الفرعية */}
        <div className="text-[#F5C518]">{collapseIcon}</div>

        {/* خانة الاسم */}
        <div className="flex-1 w-full">
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateItem(item.id, "title", e.target.value)}
            className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:outline-none focus:border-[#F5C518] placeholder-gray-600"
            placeholder="اسم القسم"
          />
        </div>

        {/* خانة الرابط */}
        <div className="flex-1 w-full">
          <input
            type="text"
            value={item.link}
            onChange={(e) => updateItem(item.id, "link", e.target.value)}
            className="w-full bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-sm focus:outline-none focus:border-[#F5C518] dir-ltr"
            style={{ direction: "ltr" }}
            placeholder="/link"
          />
        </div>

        {/* زر الحذف */}
        <button onClick={() => deleteItem(item.id)} className="text-gray-500 hover:text-red-500 transition-colors px-2">
          <Trash2 size={18} />
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-[#F5C518] bg-[#121212] min-h-screen">جاري تحميل قائمة WIND...</div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <div>
          <h1 className="text-2xl font-bold tracking-wider">إدارة قائمة الموقع</h1>
          <p className="text-gray-400 text-sm mt-1">رتب الأقسام بالسحب والإفلات. اسحب العنصر لليسار لإنشاء قائمة فرعية.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-[#222] border border-[#333] text-white rounded-lg hover:border-[#F5C518] transition">
            <Plus size={18} /> إضافة عنصر
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-[#F5C518] text-black font-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 shadow-[0_0_15px_rgba(245,197,24,0.3)]">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ التغييرات
          </button>
        </div>
      </div>

      {/* منطقة السحب والإفلات */}
      <div className="menu-builder-area max-w-4xl mx-auto pb-20">
        <Nestable
          items={Array.isArray(items) ? items : []}
          renderItem={renderItem}
          onChange={(newItems) => setItems(newItems)}
          maxDepth={3}
          threshold={30}
        />
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-lg">
          <p className="text-gray-500 font-bold">القائمة فارغة، ابدأ بإضافة عناصر!</p>
        </div>
      )}

      {/* تنسيقات CSS مخصصة لإصلاح شكل المكتبة في الوضع الداكن */}
      <style jsx global>{`
        .nestable-item-children { padding-right: 40px; }
        .nestable-list { list-style: none; padding: 0; }
        .nestable-item-content { background: transparent !important; border: none !important; padding: 0 !important; }
        .nestable-item { margin-bottom: 8px; }
        .nestable-drag-layer { z-index: 1000; }
        /* تحسين شكل الأيقونة الافتراضية للمكتبة */
        .nestable-item-icon { 
            color: #F5C518 !important; 
            margin-left: 10px;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}