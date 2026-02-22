"use client";

import React, { useState, useEffect, Suspense } from "react";
import Nestable from "react-nestable";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Trash2, GripVertical, Plus, Save, Loader2, Star, Navigation } from "lucide-react";

import "react-nestable/dist/styles/index.css"; 

// دالة الحماية من Error 130 - تضمن أن القيمة نصية فقط
const ensureString = (val) => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return ""; // لو أوبجيكت أو مصفوفة، يرجع نص فاضي عشان ميوقعش الصفحة
};

function MenuManagerContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableCollections, setAvailableCollections] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const colsSnap = await getDocs(collection(db, "collections"));
        setAvailableCollections(colsSnap.docs.map(d => ({
          name: ensureString(d.data().name || d.id),
          slug: ensureString(d.data().slug || d.id)
        })));

        const menuSnap = await getDoc(doc(db, "settings", "navigation"));
        if (menuSnap.exists() && menuSnap.data().menuItems) {
          const sanitize = (list) => list.map(item => ({
            id: ensureString(item.id || uuidv4()),
            title: ensureString(item.title),
            link: ensureString(item.link),
            highlight: !!item.highlight,
            children: Array.isArray(item.children) ? sanitize(item.children) : []
          }));
          setItems(sanitize(menuSnap.data().menuItems));
        } else {
          setItems([{ id: uuidv4(), title: "الرئيسية", link: "/", children: [] }]);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const renderItem = ({ item, collapseIcon, handler }) => {
    // نضمن إننا بنعرض نصوص فقط جوه الـ JSX
    const displayTitle = ensureString(item.title);
    const displayLink = ensureString(item.link);

    return (
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl mb-3 shadow-lg group">
        <div {...handler} className="p-2 text-gray-600 hover:text-[#F5C518] cursor-grab transition-colors">
          <GripVertical size={20} />
        </div>
        
        <div className="w-5 flex justify-center text-[#F5C518]">{collapseIcon}</div>

        <input 
          type="text" 
          value={displayTitle} 
          onChange={(e) => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, title: e.target.value} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }}
          className="flex-1 bg-[#121212] border border-[#222] p-3 rounded-xl text-sm text-white focus:border-[#F5C518] outline-none transition-all"
        />

        <div className="hidden md:flex flex-1 items-center gap-2">
            <select 
              value={displayLink.includes("/collections/") ? displayLink.split("/").pop() : ""}
              onChange={(e) => {
                const newL = e.target.value ? `/collections/${e.target.value}` : "/";
                const update = (list) => list.map(i => i.id === item.id ? {...i, link: newL} : {...i, children: update(i.children || [])});
                setItems(update(items));
              }}
              className="bg-[#121212] border border-[#222] p-3 rounded-xl text-[10px] text-[#F5C518] outline-none"
            >
              <option value="">رابط يدوي</option>
              {availableCollections.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input 
              type="text" 
              value={displayLink} 
              onChange={(e) => {
                const update = (list) => list.map(i => i.id === item.id ? {...i, link: e.target.value} : {...i, children: update(i.children || [])});
                setItems(update(items));
              }}
              className="w-24 bg-[#121212] border border-[#222] p-3 rounded-xl text-[10px] text-gray-500 font-mono outline-none"
              dir="ltr"
            />
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            const update = (list) => list.map(i => i.id === item.id ? {...i, highlight: !i.highlight} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }} className={`p-2 rounded-xl transition-all ${item.highlight ? 'bg-[#F5C518] text-black shadow-lg shadow-yellow-500/20' : 'text-gray-600 hover:bg-[#222]'}`}>
            <Star size={18} fill={item.highlight ? "currentColor" : "none"} />
          </button>
          
          <button onClick={() => {
            const newSub = { id: uuidv4(), title: "فرعي جديد", link: "/", children: [] };
            const update = (list) => list.map(i => i.id === item.id ? {...i, children: [...(i.children || []), newSub]} : {...i, children: update(i.children || [])});
            setItems(update(items));
          }} className="p-2 text-[#F5C518] hover:bg-[#222] rounded-xl"><Plus size={18} /></button>

          <button onClick={() => {
            if(confirm("حذف؟")) {
              const del = (list) => list.filter(i => i.id !== item.id).map(i => ({...i, children: del(i.children || [])}));
              setItems(del(items));
            }
          }} className="p-2 text-gray-600 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={18} /></button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#F5C518] font-black tracking-widest animate-pulse">WIND SYSTEM LOADING...</div>;

  return (
    <div className="p-6 min-h-screen bg-[#121212] text-white selection:bg-[#F5C518] selection:text-black" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#1a1a1a] p-8 rounded-3xl border border-[#333] shadow-2xl">
        <h1 className="text-3xl font-black flex items-center gap-4 italic uppercase tracking-tighter">
          <Navigation className="text-[#F5C518]" size={32} /> إدارة المنيو
        </h1>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setItems([...items, { id: uuidv4(), title: "قسم رئيسي", link: "/", children: [] }])} className="flex-1 md:flex-none bg-[#222] border border-[#333] px-6 py-4 rounded-2xl text-sm font-bold hover:border-[#F5C518] transition-all">إضافة قسم +</button>
          <button onClick={async () => {
            setSaving(true);
            try {
              const clean = (list) => list.map(item => ({
                title: ensureString(item.title),
                link: ensureString(item.link),
                highlight: !!item.highlight,
                children: clean(item.children || [])
              }));
              await setDoc(doc(db, "settings", "navigation"), { menuItems: clean(items), lastUpdated: new Date().toISOString() });
              alert("تم الحفظ بنجاح! 🚀");
            } catch (e) { alert("حدث خطأ في الحفظ"); }
            finally { setSaving(false); }
          }} disabled={saving} className="flex-1 md:flex-none bg-[#F5C518] text-black px-10 py-4 rounded-2xl font-black shadow-[0_10px_30px_rgba(245,197,24,0.3)] hover:bg-white transition-all disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ التغييرات
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-40">
        <Nestable items={items} renderItem={renderItem} onChange={setItems} maxDepth={3} />
        {items.length === 0 && <div className="text-center py-20 border-2 border-dashed border-[#222] rounded-3xl text-gray-600 font-bold uppercase tracking-widest">القائمة فارغة تماماً</div>}
      </div>

      <style jsx global>{`
        .nestable-item-children { margin-right: 40px; border-right: 2px dashed #222; padding-right: 20px; margin-top: 10px; }
        .nestable-drag-layer { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
        .nestable-drag-layer > .nestable-item, .nestable-row { background: #1a1a1a !important; border: 2px solid #F5C518 !important; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
}

export default function MenuPage() { return <Suspense><MenuManagerContent /></Suspense>; }