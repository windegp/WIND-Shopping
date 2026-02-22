"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, CornerDownLeft, Star } from "lucide-react";

// استايل المكتبة الأساسي
import "react-nestable/dist/styles/index.css"; 

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null); 
  const [availableCollections, setAvailableCollections] = useState([]); 

  // 1. جلب البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الكولكشنز عشان تظهر في السلكت
        const colsQuery = await getDocs(collection(db, "collections"));
        const colsData = colsQuery.docs.map(d => ({ 
          name: d.data().name || "بدون اسم", 
          slug: d.data().slug || "" 
        }));
        setAvailableCollections(colsData);

        // جلب المنيو
        const docRef = doc(db, "settings", "navigation");
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().menuItems) {
          const addIds = (list) =>
            list.map((item) => ({
              ...item,
              id: uuidv4(), 
              title: String(item.title || ""),
              link: String(item.link || ""),
              children: item.children ? addIds(item.children) : [],
            }));
          setItems(addIds(snap.data().menuItems));
        } else {
          setItems([
            { id: uuidv4(), title: "الرئيسية", link: "/", children: [] },
            { id: uuidv4(), title: "تخفيضات", link: "/collections/sale", children: [], highlight: true },
          ]);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cleanDataForFirebase = (list) => {
    return list.map((item) => {
      const cleanedItem = {
        title: String(item.title || "بدون اسم"),
        link: String(item.link || "#"),
        highlight: !!item.highlight
      };
      if (item.children && item.children.length > 0) {
        cleanedItem.children = cleanDataForFirebase(item.children);
      }
      return cleanedItem;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = cleanDataForFirebase(items);
      await setDoc(doc(db, "settings", "navigation"), {
        menuItems: cleanedItems,
      });
      alert("تم حفظ قائمة WIND بنجاح! 🎉");
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (parentId = null) => {
    const newId = uuidv4();
    const newItem = { id: newId, title: "قسم جديد", link: "/", children: [], highlight: false };
    if (parentId === null) {
      setItems([...items, newItem]);
    } else {
      const addRecursive = (list) => list.map(item => {
        if (item.id === parentId) return { ...item, children: [...(item.children || []), newItem] };
        if (item.children) return { ...item, children: addRecursive(item.children) };
        return item;
      });
      setItems(addRecursive(items));
    }
    setLastAddedId(newId);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const updateItem = (id, field, value) => {
    const updateRecursive = (list) => list.map((item) => {
      if (item.id === id) return { ...item, [field]: value };
      if (item.children) return { ...item, children: updateRecursive(item.children) };
      return item;
    });
    setItems(updateRecursive(items));
  };

  const deleteItem = (id) => {
    if (confirm("هل تريد حذف هذا القسم؟")) {
      const deleteRecursive = (list) => list.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : [],
      }));
      setItems(deleteRecursive(items));
    }
  };

  const renderItem = ({ item, collapseIcon, handler, depth }) => {
    const isNew = item.id === lastAddedId;
    const currentLink = String(item.link || "");

    return (
      <div className={`flex flex-col gap-2 bg-[#1a1a1a] border p-4 rounded-lg mb-2 shadow-md transition-all duration-500 ${isNew ? 'border-[#F5C518]' : 'border-[#333]'}`}>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div {...handler} className="cursor-grab text-gray-500 hover:text-[#F5C518] p-1">
            <GripVertical size={20} />
          </div>

          <div className="text-[#F5C518] cursor-pointer w-6 flex justify-center">{collapseIcon}</div>

          <div className="flex-[1.5] w-full">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full bg-[#121212] border border-[#333] text-white p-2 rounded text-sm focus:border-[#F5C518] outline-none"
              placeholder="اسم القسم"
            />
          </div>

          <div className="flex-[2] w-full flex gap-1">
            <select
              value={currentLink.startsWith('/collections/') ? currentLink.replace('/collections/', '') : ""}
              onChange={(e) => {
                const slug = e.target.value;
                updateItem(item.id, "link", slug ? `/collections/${slug}` : "/");
              }}
              className="bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-[10px] focus:border-[#F5C518] outline-none w-[100px]"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={item.link}
              onChange={(e) => updateItem(item.id, "link", e.target.value)}
              className="flex-1 bg-[#121212] border border-[#333] text-gray-400 p-2 rounded text-sm focus:border-[#F5C518] outline-none text-left"
              style={{ direction: "ltr" }}
              placeholder="/link"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateItem(item.id, "highlight", !item.highlight)} 
              className={`p-2 rounded transition-colors ${item.highlight ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-600 hover:bg-[#222]'}`}
            >
              <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
            </button>
            <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 p-2 rounded hover:bg-[#222]">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {depth < 3 && (
          <div className="mr-10 flex items-center gap-2">
            <CornerDownLeft size={14} className="text-gray-600" />
            <button 
              onClick={() => addItem(item.id)}
              className="text-[11px] font-bold text-[#F5C518] hover:bg-[#333] px-2 py-1 rounded transition flex items-center gap-1 border border-dashed border-[#F5C518]/30"
            >
              <Plus size={12} /> إضافة فرعي
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-[#F5C518] bg-[#121212] min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <h1 className="text-2xl font-bold tracking-wider">إدارة قائمة <span className="text-[#F5C518]">WIND</span></h1>
        <div className="flex gap-3">
          <button onClick={() => addItem(null)} className="px-4 py-3 bg-[#222] border border-[#333] text-white rounded-lg hover:border-[#F5C518] transition flex items-center gap-2">
            <Plus size={18} /> قسم رئيسي
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-[#F5C518] text-black font-black rounded-lg hover:bg-yellow-500 transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,197,24,0.3)]">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ المنيو
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-20">
        <Nestable
          items={items}
          renderItem={renderItem}
          onChange={(newItems) => setItems(newItems)}
          maxDepth={4}
        />
      </div>

      <style jsx global>{`
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background-color: #1a1a1a !important; border: 1px solid #F5C518 !important; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .nestable-list { list-style: none; padding: 0; margin: 0; }
        .nestable-item { margin-bottom: 10px; }
        .nestable-item-children { margin-right: 30px; border-right: 2px dashed #333; padding-right: 15px; }
      `}</style>
    </div>
  );
}

export default function MenuManager() {
  return (
    <Suspense fallback={<div className="text-center py-20 bg-[#121212] text-[#F5C518]">Loading...</div>}>
      <MenuManagerContent />
    </Suspense>
  );
}