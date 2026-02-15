"use client";

import React, { useState, useEffect } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid"; // لتوليد ارقام تعريفية مؤقتة
import { db } from "@/lib/firebase"; // تأكد من مسار الفايربيز عندك
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2 } from "lucide-react";
import "react-nestable/dist/styles/index.css"; // استايل المكتبة الجاهز

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. جلب البيانات من Firebase عند فتح الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().menuItems) {
          // لازم نضيف ID لكل عنصر عشان المكتبة تعرف تحركه، وبعدين هنشيله واحنا بنحفظ
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: uuidv4(), // رقم مؤقت
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. دالة تنظيف البيانات قبل الحفظ في Firebase
  // (بنشيل الـ ID المؤقت وبنحذف الـ Children الفاضية)
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

  // 3. حفظ البيانات
  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = cleanDataForFirebase(items);
      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanedItems,
      });
      alert("تم حفظ القائمة بنجاح! 🎉");
    } catch (error) {
      console.error("Error saving menu:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  // 4. إضافة عنصر جديد
  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      title: "عنصر جديد",
      link: "/",
      children: [],
    };
    setItems([...items, newItem]);
  };

  // 5. تعديل بيانات عنصر (الاسم أو الرابط)
  const updateItem = (id, field, value) => {
    const updateRecursive = (list) => {
      return list.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setItems(updateRecursive(items));
  };

  // 6. حذف عنصر
  const deleteItem = (id) => {
    // دالة لحذف العنصر حتى لو كان جوه قائمة فرعية
    const deleteRecursive = (list) => {
      return list
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: item.children ? deleteRecursive(item.children) : [],
        }));
    };
    if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
      setItems(deleteRecursive(items));
    }
  };

  // 7. شكل العنصر الواحد (Render Item)
  const renderItem = ({ item }) => {
    return (
      <div className="flex flex-col md:flex-row items-center gap-2 bg-white border border-gray-200 p-3 rounded-md shadow-sm mb-2 group hover:border-blue-400 transition-all">
        {/* مقبض السحب */}
        <div className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical size={20} />
        </div>

        {/* خانة الاسم */}
        <div className="flex-1 w-full">
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateItem(item.id, "title", e.target.value)}
            placeholder="اسم القسم (مثال: نسائي)"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* خانة الرابط */}
        <div className="flex-1 w-full">
          <input
            type="text"
            value={item.link}
            onChange={(e) => updateItem(item.id, "link", e.target.value)}
            placeholder="الرابط (مثال: /category/women)"
            className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:outline-none focus:border-blue-500 dir-ltr"
            style={{ direction: "ltr" }}
          />
        </div>

        {/* زر الحذف */}
        <button
          onClick={() => deleteItem(item.id)}
          className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">جاري تحميل القائمة...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة قائمة الموقع</h1>
          <p className="text-gray-500 text-sm mt-1">
            رتب الأقسام بالسحب والإفلات. اسحب لليمين لإنشاء قائمة فرعية.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Plus size={18} />
            إضافة عنصر
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            حفظ التغييرات
          </button>
        </div>
      </div>

      {/* منطقة السحب والإفلات */}
      <div className="menu-builder-area">
     <Nestable
  items={Array.isArray(items) ? items : []} // تأكد إنها مصفوفة، لو مش مصفوفة ابعت واحدة فاضية
  renderItem={renderItem}
  onChange={(newItems) => setItems(newItems)}
  maxDepth={5}
  threshold={30}
/>
      </div>

      {/* رسالة مساعدة لو القائمة فاضية */}
      {items.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">القائمة فارغة، ابدأ بإضافة عناصر!</p>
        </div>
      )}
    </div>
  );
}