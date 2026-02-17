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

  // --- 1. محاكي العرض المتطور (Mockup Engine) ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, subTitle } = section;
    
    return (
      <div className="w-full bg-[#0d0d0d] rounded-3xl p-6 border border-white/5 space-y-6 overflow-hidden transition-all duration-500">
        {/* الهيدر الأصلي الخاص بك */}
        <div className="flex items-center justify-between px-2" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm shadow-[0_0_10px_rgba(245,197,24,0.4)]"></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">{title || "عنوان القسم"}</h2>
              {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
            </div>
          </div>
          <div className="text-[#F5C518] text-sm font-bold flex items-center gap-1 opacity-80">
            عرض الكل <span className="text-xl leading-none">›</span>
          </div>
        </div>

        {/* رسم الأنماط الجديدة كلياً */}
        <div className="px-2 min-h-[120px]">
            {/* الأكثر مبيعاً - ستايل 1/3 و 2/3 */}
            {layout === 'bestseller_split' && (
                <div className="flex gap-4 h-40">
                    <div className="w-1/3 bg-[#F5C518]/10 border border-[#F5C518]/30 rounded-xl relative">
                        <div className="absolute top-2 right-2 bg-[#F5C518] w-8 h-3 rounded-full"></div>
                    </div>
                    <div className="w-2/3 grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-white/5 rounded-lg border border-white/5"></div>)}
                    </div>
                </div>
            )}

            {/* ماركي لا نهائي - التشكيلة الجديدة */}
            {layout === 'infinite_marquee' && (
                <div className="py-6 border-y border-white/5 flex gap-4 animate-pulse overflow-hidden">
                    {[...Array(6)].map((_, i) => <div key={i} className="min-w-[80px] aspect-[3/4] bg-white/5 rounded-xl"></div>)}
                </div>
            )}

            {/* شريط الثقة WIND */}
            {layout === 'trust_bar' && (
                <div className="bg-gradient-to-r from-transparent via-white/5 to-transparent py-6 border-y border-white/10 flex justify-around">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-8 h-4 bg-white/20 rounded-md"></div>
                            <div className="w-12 h-2 bg-white/5 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* مجلة ويند - Magazine Grid */}
            {layout === 'magazine_grid' && (
                <div className="grid grid-cols-2 gap-2 h-32">
                    <div className="bg-white/5 rounded-xl relative overflow-hidden">
                        <div className="absolute bottom-2 right-2 w-12 h-2 bg-[#F5C518] rounded-full"></div>
                    </div>
                    <div className="bg-white/5 rounded-xl relative overflow-hidden">
                        <div className="absolute bottom-2 right-2 w-12 h-2 bg-[#F5C518] rounded-full"></div>
                    </div>
                </div>
            )}

            {/* آراء العملاء - Testimonials */}
            {layout === 'review_marquee' && (
                <div className="flex gap-4 py-4 overflow-hidden">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="min-w-[150px] bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-[#F5C518]/20"></div>
                                <div className="w-10 h-2 bg-white/20 rounded-full"></div>
                            </div>
                            <div className="w-full h-8 bg-white/5 rounded-md"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* قصة ويند - Story Banner */}
            {layout === 'story_banner' && (
                <div className="h-40 bg-white/5 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center border border-white/10">
                    <div className="text-[#F5C518] text-2xl font-black mb-2 italic">WIND STORY</div>
                    <div className="w-3/4 h-2 bg-white/10 rounded-full mb-1"></div>
                    <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                </div>
            )}

            {/* الأنماط التقليدية السابقة */}
            {layout === 'grid_default' && (
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5"></div>)}
                </div>
            )}
            {layout === 'imdb_posters' && (
                <div className="flex gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="min-w-[80px] aspect-[2/3] bg-white/5 rounded-2xl"></div>)}
                </div>
            )}
        </div>
      </div>
    );
  };

  // --- تحديث قائمة الاستايلات لتشمل الاستايلات الجديدة ---
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'WIND: أحدث الصيحات (Scroll)', icon: '▦' },
      { id: 'infinite_marquee', name: 'WIND: تشكيلة الماركي (Infinite)', icon: '🏃' },
      { id: 'bestseller_split', name: 'WIND: الأكثر مبيعاً (1/3 Grid)', icon: '🏆' },
      { id: 'sale_grid', name: 'WIND: تخفيضات (Yellow Bar)', icon: '🏷️' },
      { id: 'imdb_posters', name: 'IMDb: Vertical Posters', icon: '🎬' },
      { id: 'bento_modern', name: 'Bento: Hero Layout', icon: '🍱' },
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'WIND: مجموعات (Circles)', icon: '◯' },
        { id: 'rect_banners', name: 'Category Posters', icon: '▭' },
        { id: 'trust_bar', name: 'WIND: شريط الثقة (Stats)', icon: '🛡️' },
        { id: 'review_marquee', name: 'WIND: آراء العملاء (Reviews)', icon: '💬' },
        { id: 'magazine_grid', name: 'WIND: المجلة (Articles)', icon: '📖' },
        { id: 'story_banner', name: 'WIND: قصة البراند (Story)', icon: '📜' },
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
    <div className="min-h-screen bg-[#080808] text-white p-6 font-cairo" dir="rtl">
        
        {/* --- Header Bar --- */}
        <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-12 bg-[#111] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black text-3xl font-black">W</div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Architect <span className="text-[#F5C518]">v6.5</span></h1>
            </div>
            <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم نشر التعديلات!"); }} 
                className="bg-[#F5C518] text-black px-12 py-5 rounded-3xl font-black text-sm hover:scale-105 transition-all shadow-xl">
                {loading ? "جاري الحفظ..." : "نشر التعديلات 🚀"}
            </button>
        </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* === التحكم (Sticky Sidebar) === */}
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-[#111] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10 sticky top-6">
            <h2 className="text-xl font-black text-[#F5C518] uppercase">⚙️ إعدادات القسم</h2>

            <div className="space-y-4">
                <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="عنوان القسم" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm outline-none font-bold" />
                <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm opacity-60 outline-none" />
            </div>

            <div className="flex bg-black p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`flex-1 py-4 text-xs rounded-xl font-black transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>منتجات</button>
                <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-4 text-xs rounded-xl font-black transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>محتوى عام</button>
            </div>

            {/* --- القائمة المنسدلة الجديدة للاستايلات --- */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">اختر ستايل العرض (Style Selector)</label>
                <select 
                    value={newSection.layout} 
                    onChange={e => setNewSection({...newSection, layout: e.target.value})}
                    className="w-full bg-black border-2 border-white/10 p-5 rounded-2xl text-sm font-black text-[#F5C518] focus:border-[#F5C518] transition-all outline-none appearance-none cursor-pointer"
                >
                    {(layoutOptions[newSection.type] || []).map(l => (
                        <option key={l.id} value={l.id} className="bg-[#111] text-white">{l.icon} {l.name}</option>
                    ))}
                </select>
                <div className="text-[9px] text-gray-500 italic px-2">* سيظهر شكل التصميم المختار بالأسفل مباشرة قبل الحفظ.</div>
            </div>

            {/* معاينة التصميم فورا قبل الحفظ */}
            <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black text-[#F5C518] mr-2 uppercase">معاينة مباشرة (Quick Preview)</label>
                <WINDVisualMockup section={newSection} />
            </div>

            <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                {newSection.type === 'products' ? (
                    <div className="space-y-4">
                        <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value, selectionMode: 'automated'})} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold text-[#F5C518] outline-none">
                            <option value="">-- اختيار آلي لكل المنتجات --</option>
                            {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {/* نظام الـ Checkboxes للاختيار اليدوي */}
                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                            {dataLibrary.products.map(p => (
                                <label key={p.id} className="flex items-center justify-between p-3 bg-black/50 rounded-xl border border-white/5 cursor-pointer hover:border-[#F5C518]/30 transition-all">
                                    <span className="text-[11px] font-bold">{p.title}</span>
                                    <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => {
                                        toggleItem(p.id, 'selectedItems');
                                        setNewSection(prev => ({...prev, selectionMode: 'manual'}));
                                    }} className="w-4 h-4 accent-[#F5C518]" />
                                </label>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto scrollbar-hide">
                        {dataLibrary.categories.map(cat => (
                            <label key={cat} className={`p-4 rounded-2xl border text-[10px] font-black text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-[#F5C518]/20 border-[#F5C518]' : 'bg-black opacity-40'}`}>
                                {cat}
                                <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-6 rounded-full text-sm uppercase tracking-widest hover:bg-[#F5C518] transition-all active:scale-95">
                {editingId ? "تحديث القسم ✓" : "إضافة القسم للهيكل +"}
            </button>
          </div>
        </div>

        {/* === الهيكل الحالي (Preview Feed) === */}
        <div className="xl:col-span-7 space-y-10">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.5em] pr-4">ترتيب محتوى الصفحة (Live Stage)</h2>
            {sections.map((s, i) => (
                <div key={s.id} className="relative group">
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all z-20">
                        <button onClick={() => { setNewSection(s); setEditingId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-14 h-14 bg-white text-black rounded-3xl flex items-center justify-center shadow-2xl hover:bg-[#F5C518] transition-all font-black">✎</button>
                        <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-14 h-14 bg-red-600 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-red-500 transition-all font-black text-xl">✕</button>
                    </div>
                    <div className="bg-[#111] p-2 rounded-[3.5rem] border border-white/5 transition-all group-hover:border-[#F5C518]/20 group-hover:-translate-y-2">
                        <div className="bg-black/20 p-8 rounded-[3.2rem]">
                            <WINDVisualMockup section={s} />
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: Cairo, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}