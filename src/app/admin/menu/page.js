"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, Plus, Save, Loader2, Navigation, AlertCircle } from "lucide-react";

export default function SimpleMenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- دالة التأكد من النصوص (حماية ريأكت 19) ---
  const toText = (val) => (typeof val === 'string' ? val : "");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "navigation"));
        if (snap.exists() && snap.data().menuItems) {
          // بنقرأ الداتا ونحولها لقائمة بسيطة عشان ريأكت 19 متزعلش
          const clean = snap.data().menuItems.map(item => ({
            title: toText(item.title),
            link: toText(item.link),
            id: Math.random().toString()
          }));
          setItems(clean);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadMenu();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "navigation"), { 
        menuItems: items.map(i => ({ title: i.title, link: i.link, children: [] })) 
      });
      alert("تم الحفظ بنجاح! 🚀");
    } catch (e) { alert("خطأ في الحفظ"); } 
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-[#F5C518] text-center font-black animate-pulse">جاري فحص نظام WIND...</div>;

  return (
    <div className="p-6 min-h-screen bg-[#0a0a0a] text-white font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-[#111] p-6 rounded-2xl border border-[#222]">
          <h1 className="text-xl font-black flex items-center gap-3 italic"><Navigation className="text-[#F5C518]"/> إدارة المنيو (الوضع الآمن)</h1>
          <button onClick={handleSave} disabled={saving} className="bg-[#F5C518] text-black px-8 py-2 rounded-xl font-black hover:scale-105 transition-all">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>

        {/* Warning Box */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-yellow-500 shrink-0" size={20} />
          <p className="text-xs text-yellow-200/70 leading-relaxed">
            أنت الآن في <b>"الوضع الآمن"</b>. تم تعطيل ميزة السحب والإفلات مؤقتاً لتجاوز خطأ React 19 وتأمين بياناتك في الفايربيس. يمكنك تعديل العناوين والروابط الآن وحفظها.
          </p>
        </div>

        {/* Menu Items List */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 bg-[#111] border border-[#222] p-4 rounded-xl group hover:border-[#F5C518]/50 transition-all">
              <span className="text-gray-600 font-mono text-xs">{index + 1}</span>
              <input 
                type="text" 
                value={item.title} 
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].title = e.target.value;
                  setItems(newItems);
                }}
                className="flex-1 bg-black border border-[#222] p-2 rounded-lg text-sm focus:border-[#F5C518] outline-none"
                placeholder="اسم القسم"
              />
              <input 
                type="text" 
                value={item.link} 
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].link = e.target.value;
                  setItems(newItems);
                }}
                className="flex-1 bg-black border border-[#222] p-2 rounded-lg text-xs text-gray-500 font-mono outline-none"
                placeholder="الرابط"
                dir="ltr"
              />
              <button 
                onClick={() => setItems(items.filter((_, idx) => idx !== index))}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button 
            onClick={() => setItems([...items, { id: Math.random().toString(), title: "قسم جديد", link: "/" }])}
            className="w-full py-4 border-2 border-dashed border-[#222] rounded-xl text-gray-500 hover:border-[#F5C518] hover:text-[#F5C518] transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus size={18}/> إضافة قسم جديد
          </button>
        </div>

      </div>
    </div>
  );
}