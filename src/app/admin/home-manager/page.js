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
    title: '', 
    subTitle: '', 
    type: 'products', 
    selectionMode: 'automated',
    selectedCategory: '', 
    selectedItems: [], 
    selectedCollections: [], 
    layout: 'grid_default',
  });

  // --- 1. محاكي العرض (Mockup) - مقاسات WIND الأصلية 100% ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, subTitle } = section;
    
    return (
      <div className="w-full bg-[#121212] rounded-3xl p-6 border border-white/5 space-y-6 overflow-hidden transform scale-[0.85] origin-top mb-[-20px]">
        {/* الهيدر الأصلي - نفس الكود والمقاسات التي أرسلتها أنت */}
        <div className="flex items-center justify-between px-2" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm shadow-[0_0_10px_rgba(245,197,24,0.4)]"></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">{title || "عنوان القسم"}</h2>
              {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
            </div>
          </div>
          <div className="text-[#F5C518] text-sm font-bold flex items-center gap-1 opacity-80 cursor-default">
            عرض الكل <span className="text-xl leading-none">›</span>
          </div>
        </div>

        {/* محاكاة الأنماط الاحترافية المتعددة */}
        <div className="px-2 min-h-[100px]">
            {layout === 'grid_default' && (
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5"></div>)}
                </div>
            )}
            {layout === 'imdb_posters' && (
                <div className="flex gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[80px] aspect-[2/3] bg-white/5 rounded-2xl border border-white/5 relative">
                            <div className="absolute bottom-2 right-2 w-8 h-2 bg-[#F5C518]/20 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}
            {layout === 'bento_modern' && (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-32">
                    <div className="col-span-2 row-span-2 bg-[#F5C518]/10 rounded-3xl border border-[#F5C518]/20"></div>
                    <div className="col-span-2 row-span-1 bg-white/5 rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-white/5 rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black font-black text-[8px]">WIND</div>
                </div>
            )}
            {layout === 'circle_avatars' && (
                <div className="flex gap-6 justify-center py-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 shadow-xl"></div>
                            <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}
            {layout === 'marquee_promo' && (
                <div className="bg-[#F5C518] py-4 -mx-6 flex items-center justify-center overflow-hidden">
                    <div className="text-black font-black text-xl italic tracking-tighter animate-pulse">WIND PROMO MARQUEE • WIND PROMO</div>
                </div>
            )}
            {layout === 'imdb_fan_picks' && (
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(2)].map((_, i) => <div key={i} className="aspect-video bg-white/5 rounded-2xl border border-white/5"></div>)}
                </div>
            )}
        </div>
      </div>
    );
  };

  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'WIND Classic Grid', icon: '▦' },
      { id: 'imdb_posters', name: 'IMDb: Vertical Posters', icon: '🎬' },
      { id: 'imdb_fan_picks', name: 'IMDb: Wide Cards', icon: '⭐' },
      { id: 'bento_modern', name: 'Bento: Hero Layout', icon: '🍱' },
      { id: 'marquee_promo', name: 'Scrolling Text Bar', icon: '🏃' },
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'Born Today (Circles)', icon: '◯' },
        { id: 'rect_banners', name: 'Category Posters', icon: '▭' }
    ]
  };

  useEffect(() => {
    const fetchContent = async () => {
      setFetching(true);
      try {
        const prodsSnap = await getDocs(collection(db, "products"));
        const prods = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const cats = new Set();
        prods.forEach(p => { 
            if(p.category) cats.add(p.category);
            if(p.categories && Array.isArray(p.categories)) p.categories.forEach(c => cats.add(c));
        });
        setDataLibrary({ products: prods, categories: Array.from(cats) });
        const docSnap = await getDoc(doc(db, "settings", "homePage_v2"));
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
      } catch (e) { console.error(e); }
      setFetching(false);
    };
    fetchContent();
  }, []);

  const toggleItem = (id, listType) => {
    const currentList = [...newSection[listType]];
    const updatedList = currentList.includes(id) ? currentList.filter(item => item !== id) : [...currentList, id];
    setNewSection({ ...newSection, [listType]: updatedList });
  };

  const handleAddOrUpdate = () => {
    if (!newSection.title) return alert("يرجى إدخال العنوان الرئيسي");
    const sectionData = { ...newSection, id: editingId || Date.now().toString() };
    if (editingId) {
        setSections(sections.map(s => s.id === editingId ? sectionData : s));
        setEditingId(null);
    } else { setSections([...sections, sectionData]); }
    setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8 font-sans" dir="rtl">
        
        {/* --- Header Bar --- */}
        <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-8 bg-[#111] p-6 rounded-3xl border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5C518] rounded-2xl flex items-center justify-center text-black text-2xl font-black shadow-[0_0_20px_rgba(245,197,24,0.3)]">W</div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase">WIND Architect <span className="text-[#F5C518] text-sm">v6.2</span></h1>
            </div>
            <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم تحديث الموقع بنجاح!"); }} 
                className="bg-[#F5C518] text-black px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl active:scale-95">
                {loading ? "جاري الحفظ..." : "نشر التعديلات 🚀"}
            </button>
        </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* === الجانب الأيمن: التحكم (Sticky Sidebar) === */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 sticky top-6">
            <h2 className="text-lg font-black flex items-center gap-4 text-[#F5C518] uppercase tracking-tighter">
                {editingId ? "✏️ تعديل إعدادات القسم" : "➕ بناء قسم جديد"}
            </h2>

            <div className="space-y-4">
                <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="العنوان الرئيسي" className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm focus:border-[#F5C518] transition-all outline-none font-bold" />
                <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي" className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm opacity-60 outline-none" />
            </div>

            <div className="flex bg-black p-1 rounded-2xl border border-white/5">
                <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`flex-1 py-3 text-xs rounded-xl font-black transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>منتجات</button>
                <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-3 text-xs rounded-xl font-black transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>كولكشنات</button>
            </div>

            <div className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-5 shadow-inner">
                {newSection.type === 'products' ? (
                    <div className="space-y-4">
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setNewSection({...newSection, selectionMode: 'automated'})} className={`px-4 py-2 rounded-full text-[10px] font-black border ${newSection.selectionMode === 'automated' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'text-gray-500 border-white/10'}`}>كولكشن آلي</button>
                            <button onClick={() => setNewSection({...newSection, selectionMode: 'manual'})} className={`px-4 py-2 rounded-full text-[10px] font-black border ${newSection.selectionMode === 'manual' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'text-gray-500 border-white/10'}`}>اختيار يدوياً</button>
                        </div>
                        {newSection.selectionMode === 'automated' ? (
                            <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm font-bold text-[#F5C518] text-center outline-none">
                                <option value="">-- اختر القسم --</option>
                                {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                <input type="text" placeholder="🔍 بحث عن منتج..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs" />
                                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto scrollbar-hide pr-2">
                                    {dataLibrary.products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                        <label key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${newSection.selectedItems.includes(p.id) ? 'bg-[#F5C518]/10 border-[#F5C518]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                            <span className="text-[10px] font-bold truncate max-w-[80%]">{p.title}</span>
                                            <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => toggleItem(p.id, 'selectedItems')} className="w-4 h-4 accent-[#F5C518]" />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                        {dataLibrary.categories.map(cat => (
                            <label key={cat} className={`p-3 rounded-2xl border text-[10px] font-black text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-[#F5C518]/20 border-[#F5C518] scale-105 shadow-lg' : 'bg-black border-white/5 opacity-40 hover:opacity-100'}`}>
                                {cat}
                                <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">اختر ستايل العرض</label>
                <div className="grid grid-cols-2 gap-3">
                    {(layoutOptions[newSection.type] || []).map(l => (
                        <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} className={`p-4 border-2 rounded-3xl flex flex-col items-center gap-2 transition-all ${newSection.layout === l.id ? 'border-[#F5C518] bg-[#F5C518]/10 shadow-lg' : 'border-white/5 opacity-40 hover:opacity-100 grayscale'}`}>
                            <span className="text-2xl">{l.icon}</span>
                            <span className="text-[9px] font-black uppercase text-center">{l.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-5 rounded-full text-sm uppercase tracking-widest hover:bg-[#F5C518] transition-all shadow-2xl active:scale-95">
                {editingId ? "تعديل القسم ✓" : "إضافة القسم للهيكل +"}
            </button>
          </div>
        </div>

        {/* === الجانب الأيسر: معاينة الهيكل (Dynamic Feed) === */}
        <div className="xl:col-span-8 space-y-6">
            <div className="flex justify-between items-center px-4">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">ترتيب الصفحة الحالية</h2>
                <span className="text-[10px] text-[#F5C518] font-bold">● LIVE STAGE</span>
            </div>

            {sections.length === 0 ? (
                <div className="py-40 text-center border-4 border-dashed border-white/5 rounded-[4rem] text-gray-800 font-black italic text-xl uppercase tracking-tighter bg-white/[0.01]">
                    لا توجد أقسام مضافة بعد...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {sections.map((s, i) => (
                        <div key={s.id} className="relative group bg-[#111] p-2 rounded-[3rem] border border-white/5 hover:border-[#F5C518]/30 transition-all shadow-xl h-fit">
                            {/* التحكم السريع */}
                            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                                <button onClick={() => { setNewSection(s); setEditingId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl hover:bg-[#F5C518] transition-colors font-black">✎</button>
                                <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-10 h-10 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-red-500 transition-colors font-black">✕</button>
                            </div>
                            
                            {/* المعاينة المصغرة */}
                            <div className="bg-black/20 p-4 rounded-[2.8rem]">
                                <div className="text-[10px] text-[#F5C518] font-black px-4 mb-2 uppercase opacity-40">Section #0{i+1}</div>
                                <WINDVisualMockup section={s} />
                                
                                <div className="mt-4 flex gap-2 px-6 pb-2">
                                    <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full text-gray-500 uppercase font-bold">{s.layout}</span>
                                    <span className="text-[8px] bg-white/5 px-2 py-1 rounded-full text-gray-500 uppercase font-bold">{s.selectionMode}</span>
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