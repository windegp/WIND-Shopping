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

  // --- مكون المحاكاة البصرية (نفس ستايل الموقع الأصلي تماماً) ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, subTitle } = section;
    
    return (
      <div className="w-full bg-[#121212] rounded-3xl p-6 border border-white/5 space-y-6 mb-4 overflow-hidden">
        {/* محاكاة الهيدر الأصلي (بنفس أحجام الخطوط التي طلبتها) */}
        <div className="flex items-center justify-between px-2" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm shadow-[0_0_10px_rgba(245,197,24,0.4)]"></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title || "عنوان القسم"}</h2>
              {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
            </div>
          </div>
          <div className="text-[#F5C518] text-sm font-bold flex items-center gap-1 opacity-80 cursor-default">
            عرض الكل <span className="text-xl leading-none">›</span>
          </div>
        </div>

        {/* محاكاة ستايلات العرض (IMDb Styles) */}
        <div className="px-2">
            {layout === 'grid_default' && (
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5"></div>)}
                </div>
            )}

            {layout === 'imdb_posters' && (
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[100px] aspect-[2/3] bg-white/5 rounded-2xl border border-white/5 relative">
                            <div className="absolute bottom-2 right-2 w-8 h-2 bg-[#F5C518]/20 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}

            {layout === 'bento_modern' && (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-40">
                    <div className="col-span-2 row-span-2 bg-[#F5C518]/10 rounded-3xl border border-[#F5C518]/20"></div>
                    <div className="col-span-2 row-span-1 bg-white/5 rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-white/5 rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black font-black text-[8px]">WIND</div>
                </div>
            )}

            {layout === 'circle_avatars' && (
                <div className="flex gap-6 justify-center py-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 shadow-xl"></div>
                            <div className="w-10 h-2 bg-white/10 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}

            {layout === 'marquee_promo' && (
                <div className="bg-[#F5C518] py-4 -mx-6 flex items-center justify-center overflow-hidden">
                    <div className="text-black font-black text-xl italic tracking-tighter animate-pulse">WIND PROMO MARQUEE • WIND PROMO MARQUEE</div>
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
      { id: 'imdb_fan_picks', name: 'IMDb: Landscape Cards', icon: '⭐' },
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
    <div className="min-h-screen bg-[#080808] text-white p-6 md:p-10 font-sans selection:bg-[#F5C518] selection:text-black" dir="rtl">
        
        {/* --- Top Global Bar --- */}
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-center mb-12 bg-[#111] p-8 rounded-[3rem] border border-white/5 gap-8 shadow-2xl">
            <div className="flex items-center gap-6 text-center lg:text-right">
                <div className="w-16 h-16 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black text-3xl font-black shadow-[0_0_30px_rgba(245,197,24,0.3)]">W</div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">WIND Stage <span className="text-[#F5C518]">Architect</span></h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.4em] mt-1 italic">Professional Interface Engine v6.2</p>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم التحديث بنجاح!"); }} 
                    className="bg-[#F5C518] text-black px-12 py-5 rounded-3xl font-black text-sm hover:scale-105 transition-all shadow-xl active:scale-95">
                    {loading ? "جاري الرفع..." : "نشر التعديلات للموقع 🚀"}
                </button>
            </div>
        </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* === Left Config Side (5 Columns) === */}
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-[#111] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F5C518]/50 to-transparent"></div>
            
            <h2 className="text-xl font-black flex items-center gap-4 text-white uppercase tracking-tighter">
                <span className="p-2 bg-white/5 rounded-xl">🛠️</span>
                {editingId ? "تعديل إعدادات القسم" : "بناء قسم جديد"}
            </h2>

            {/* Inputs Group */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">العنوان الرئيسي</label>
                        <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="مثلاً: الأكثر مبيعاً هذا الأسبوع" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm focus:border-[#F5C518] transition-all outline-none font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">العنوان الفرعي (Subtitle)</label>
                        <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="وصف قصير يظهر أسفل العنوان" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm opacity-60 outline-none" />
                    </div>
                </div>

                <div className="flex bg-black p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`flex-1 py-4 text-xs rounded-xl font-black transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>عرض منتجات</button>
                    <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-4 text-xs rounded-xl font-black transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>عرض كولكشنات</button>
                </div>

                {/* Content Logic Box */}
                <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-inner">
                    {newSection.type === 'products' ? (
                        <>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setNewSection({...newSection, selectionMode: 'automated'})} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all border ${newSection.selectionMode === 'automated' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'text-gray-500 border-white/10'}`}>اختيار كولكشن كامل</button>
                                <button onClick={() => setNewSection({...newSection, selectionMode: 'manual'})} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all border ${newSection.selectionMode === 'manual' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'text-gray-500 border-white/10'}`}>اختيار قطع يدوية</button>
                            </div>

                            {newSection.selectionMode === 'automated' ? (
                                <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold appearance-none text-[#F5C518] text-center">
                                    <option value="">-- اختر القسم المصدر --</option>
                                    {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <div className="space-y-4">
                                    <input type="text" placeholder="🔍 ابحث عن اسم المنتج..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs" />
                                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto scrollbar-hide pr-2">
                                        {dataLibrary.products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                            <label key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${newSection.selectedItems.includes(p.id) ? 'bg-[#F5C518]/10 border-[#F5C518]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={p.images?.[0] || p.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                    <span className="text-[11px] font-bold">{p.title}</span>
                                                </div>
                                                <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => toggleItem(p.id, 'selectedItems')} className="w-5 h-5 accent-[#F5C518]" />
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-center text-[10px] text-[#F5C518] font-black uppercase italic">تم اختيار {newSection.selectedItems.length} منتجات</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto scrollbar-hide p-1">
                            {dataLibrary.categories.map(cat => (
                                <label key={cat} className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all cursor-pointer ${newSection.selectedCollections.includes(cat) ? 'bg-[#F5C518]/10 border-[#F5C518] scale-105 shadow-lg' : 'bg-black border-white/5 opacity-40 hover:opacity-100'}`}>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-[#F5C518]">{cat.charAt(0)}</div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{cat}</span>
                                    <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">ستايل العرض (Visual Layout)</label>
                <div className="grid grid-cols-2 gap-4">
                    {(layoutOptions[newSection.type] || []).map(l => (
                        <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} className={`p-5 border-2 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all ${newSection.layout === l.id ? 'border-[#F5C518] bg-[#F5C518]/10 shadow-[0_0_20px_rgba(245,197,24,0.1)]' : 'border-white/5 opacity-40 hover:opacity-100'}`}>
                            <span className="text-3xl filter drop-shadow-md">{l.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-center">{l.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-6 rounded-full text-sm uppercase tracking-widest hover:bg-[#F5C518] transition-all shadow-2xl active:scale-95">
                {editingId ? "تحديث القسم المختار ✓" : "إضافة القسم للهيكل المباشر +"}
            </button>
          </div>
        </div>

        {/* === Right Stage Side (7 Columns) === */}
        <div className="xl:col-span-7 space-y-8">
            <div className="flex justify-between items-center px-6">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.6em]">Live Structure Feed</h2>
                <div className="flex gap-2 text-[9px] font-black text-[#F5C518] animate-pulse">
                    <span>●</span> <span>LIVE PREVIEW ACTIVE</span>
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="py-48 text-center border-4 border-dashed border-white/5 rounded-[4rem] text-gray-800 font-black italic text-2xl uppercase tracking-tighter bg-white/[0.01]">
                    Stage is Empty... <br/>Build your Story.
                </div>
            ) : (
                <div className="space-y-10 pb-40">
                    {sections.map((s, i) => (
                        <div key={s.id} className="relative group perspective-1000">
                            {/* Control Floating Icons */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all z-20 translate-x-4 group-hover:translate-x-0">
                                <button onClick={() => { setNewSection(s); setEditingId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-14 h-14 bg-white text-black rounded-3xl flex items-center justify-center shadow-2xl hover:bg-[#F5C518] transition-colors font-black">✎</button>
                                <button onClick={() => { if(confirm("حذف هذا القسم؟")) setSections(sections.filter(x => x.id !== s.id)) }} className="w-14 h-14 bg-red-600 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-red-500 transition-colors font-black text-xl">✕</button>
                            </div>
                            
                            {/* The Professional Mockup Rendering */}
                            <div className="relative z-10 bg-black/40 p-4 rounded-[4rem] border border-white/5 shadow-2xl transition-all group-hover:border-[#F5C518]/20 group-hover:-translate-y-2">
                                <div className="text-[10px] text-[#F5C518] font-black uppercase mb-4 px-6 opacity-30">Stage Position #0{i+1}</div>
                                <WINDVisualMockup section={s} />
                                
                                {/* Info Footer for Section */}
                                <div className="mt-6 flex justify-between items-center px-10 pb-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-gray-600 font-black uppercase">Layout Mode</span>
                                            <span className="text-[10px] text-white font-bold uppercase">{s.layout.replace('_', ' ')}</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/10 mx-2"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-gray-600 font-black uppercase">Content Source</span>
                                            <span className="text-[10px] text-white font-bold uppercase">
                                                {s.type === 'products' ? (s.selectionMode === 'manual' ? `Manual (${s.selectedItems.length})` : s.selectedCategory) : `${s.selectedCollections.length} Categories`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-full h-full bg-[#F5C518] opacity-20"></div>
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

// أضف هذه الستايلات في ملف CSS العالمي الخاص بك لضمان السحب والإفلات أو الأنيميشن
// .scrollbar-hide::-webkit-scrollbar { display: none; }
// .perspective-1000 { perspective: 1000px; }