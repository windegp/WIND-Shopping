"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [dataLibrary, setDataLibrary] = useState({ products: [], categories: [] });

  const [newSection, setNewSection] = useState({
    title: '', subTitle: '', type: 'products', selectionMode: 'automated',
    selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default',
  });

  // --- مكون المعاينة الحقيقية المصغرة (Visual Component Engine) ---
  const VisualPreview = ({ section }) => {
    const { layout, title, subTitle } = section;
    
    return (
      <div className="w-full bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
        {/* Header Preview */}
        <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-[#F5C518] rounded-full"></div>
            <div>
                <div className="text-[10px] font-black text-white uppercase leading-none">{title || "عنوان القسم"}</div>
                <div className="text-[7px] text-gray-500 leading-none mt-1">{subTitle || "الوصف الفرعي"}</div>
            </div>
        </div>

        {/* Layout Mockup */}
        {layout === 'grid_default' && (
            <div className="grid grid-cols-4 gap-1">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/10 rounded-sm"></div>)}
            </div>
        )}

        {layout === 'imdb_posters' && (
            <div className="flex gap-2 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[60px] aspect-[2/3] bg-white/10 rounded-md relative">
                        <div className="absolute bottom-1 left-1 w-4 h-1 bg-[#F5C518]/50 rounded-full"></div>
                    </div>
                ))}
            </div>
        )}

        {layout === 'bento_modern' && (
            <div className="grid grid-cols-3 gap-1 h-20">
                <div className="col-span-2 bg-[#F5C518]/20 rounded-md"></div>
                <div className="space-y-1">
                    <div className="h-[48%] bg-white/10 rounded-md"></div>
                    <div className="h-[48%] bg-white/10 rounded-md"></div>
                </div>
            </div>
        )}

        {layout === 'circle_avatars' && (
            <div className="flex gap-3 justify-center">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20"></div>
                        <div className="w-4 h-1 bg-white/20 rounded-full"></div>
                    </div>
                ))}
            </div>
        )}

        {layout === 'imdb_fan_picks' && (
            <div className="grid grid-cols-2 gap-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="aspect-video bg-white/10 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  };

  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'WIND Classic Grid', icon: '▦' },
      { id: 'imdb_posters', name: 'IMDb: Vertical Posters', icon: '🎬' },
      { id: 'imdb_fan_picks', name: 'IMDb: Wide Cards', icon: '⭐' },
      { id: 'bento_modern', name: 'Bento: Hero Grid', icon: '🍱' },
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'Born Today (Circles)', icon: '◯' },
        { id: 'rect_banners', name: 'IMDb Category Banners', icon: '▭' }
    ]
  };

  useEffect(() => {
    const fetchContent = async () => {
      setFetching(true);
      try {
        const prodsSnap = await getDocs(collection(db, "products"));
        const prods = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const cats = new Set();
        prods.forEach(p => { if(p.category) cats.add(p.category); });
        setDataLibrary({ products: prods, categories: Array.from(cats) });
        const docSnap = await getDoc(doc(db, "settings", "homePage_v2"));
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
      } catch (e) { console.error(e); }
      setFetching(false);
    };
    fetchContent();
  }, []);

  const handleAddOrUpdate = () => {
    if (!newSection.title) return alert("يرجى كتابة العنوان");
    const sectionData = { ...newSection, id: editingId || Date.now().toString() };
    if (editingId) {
        setSections(sections.map(s => s.id === editingId ? sectionData : s));
        setEditingId(null);
    } else { setSections([...sections, sectionData]); }
    setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans" dir="rtl">
        {/* Header */}
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 bg-gradient-to-r from-[#121212] to-black p-8 rounded-[2.5rem] border border-white/5 gap-6">
            <div>
                <h1 className="text-3xl font-black text-[#F5C518] tracking-tighter">WIND ARCHITECT <span className="text-white/20 text-[10px] block font-mono">LAYOUT ENGINE V5.0</span></h1>
            </div>
            <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("تم التحديث بنجاح!"); }} 
                className="bg-[#F5C518] text-black px-12 py-4 rounded-full font-black text-sm hover:shadow-[0_0_40px_rgba(245,197,24,0.3)] transition-all active:scale-95">
                {loading ? "جاري الرفع..." : "تحديث الموقع الآن 🚀"}
            </button>
        </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* العمود الأيمن: التحكم */}
        <div className="lg:col-span-5 space-y-6 h-fit sticky top-6">
          <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
            <h2 className="text-[#F5C518] font-black text-lg flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#F5C518] rounded-full"></span>
                {editingId ? "تعديل القسم الحالي" : "بناء قسم جديد"}
            </h2>

            <div className="space-y-4">
                <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="العنوان الرئيسي" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm focus:border-[#F5C518] transition-all outline-none" />
                <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm opacity-50 outline-none" />
            </div>

            <div className="space-y-4">
                <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`flex-1 py-3 text-xs rounded-xl transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black font-black' : 'text-gray-500'}`}>منتجات</button>
                    <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-3 text-xs rounded-xl transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black font-black' : 'text-gray-500'}`}>كولكشنات</button>
                </div>

                <div className="p-5 bg-black/60 rounded-3xl border border-white/5 space-y-4">
                    {newSection.type === 'products' ? (
                        <>
                            <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value, selectionMode: 'automated'})} className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm">
                                <option value="">-- كولكشن آلي --</option>
                                {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                                {dataLibrary.products.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-[10px]">
                                        <span className="truncate max-w-[80%]">{p.title}</span>
                                        <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => {
                                            const items = newSection.selectedItems.includes(p.id) ? newSection.selectedItems.filter(i => i !== p.id) : [...newSection.selectedItems, p.id];
                                            setNewSection({...newSection, selectedItems: items, selectionMode: items.length > 0 ? 'manual' : 'automated'});
                                        }} className="accent-[#F5C518]" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                            {dataLibrary.categories.map(cat => (
                                <label key={cat} className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/10 text-[10px] cursor-pointer hover:border-[#F5C518]/30">
                                    <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => {
                                        const cats = newSection.selectedCollections.includes(cat) ? newSection.selectedCollections.filter(c => c !== cat) : [...newSection.selectedCollections, cat];
                                        setNewSection({...newSection, selectedCollections: cats});
                                    }} /> {cat}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">اختر شكل العرض الاحترافي</label>
                <div className="grid grid-cols-2 gap-3">
                    {(layoutOptions[newSection.type] || []).map(l => (
                        <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} className={`p-4 border-2 rounded-[2rem] flex flex-col items-center gap-2 transition-all ${newSection.layout === l.id ? 'border-[#F5C518] bg-[#F5C518]/10' : 'border-white/5 opacity-40 grayscale hover:opacity-100'}`}>
                            <span className="text-2xl">{l.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-tighter">{l.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-[#F5C518] text-black font-black py-5 rounded-full shadow-2xl hover:bg-white transition-all">
                {editingId ? "تحديث القسم ✓" : "إضافة القسم للهيكل +"}
            </button>
          </div>

          {/* المعاينة الحية فور الاختيار */}
          <div className="mt-6 p-6 bg-[#F5C518]/5 rounded-[2.5rem] border border-[#F5C518]/20">
             <div className="text-[10px] text-[#F5C518] font-black mb-4 uppercase text-center tracking-[0.2em]">معاينة سريعة للشكل المختار</div>
             <VisualPreview section={newSection} />
          </div>
        </div>

        {/* العمود الأيسر: المعاينة الحقيقية للهيكل */}
        <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] pr-4">Structure Preview</h2>
            {sections.length === 0 ? (
                <div className="py-40 text-center border-2 border-dashed border-white/10 rounded-[3rem] text-gray-700 font-black italic">
                    STAGE IS EMPTY... START BUILDING
                </div>
            ) : (
                <div className="space-y-8">
                    {sections.map((s, i) => (
                        <div key={s.id} className="relative group">
                            {/* Actions */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                <button onClick={() => { setNewSection(s); setEditingId(s.id); }} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl">✎</button>
                                <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl">✕</button>
                            </div>
                            
                            {/* The Real Visual Card */}
                            <div className="bg-[#121212] p-2 rounded-[2.5rem] border border-white/5 group-hover:border-[#F5C518]/30 transition-all">
                                <div className="bg-black/20 p-6 rounded-[2.2rem]">
                                    <VisualPreview section={s} />
                                    <div className="mt-4 flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-[#F5C518]">#{i+1} ORDER</span>
                                        <div className="flex gap-2">
                                            <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full text-gray-400 font-mono uppercase">{s.layout}</span>
                                            <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full text-gray-400 font-mono uppercase">{s.selectionMode}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}