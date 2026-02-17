"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// --- القالب الافتراضي: يطابق تماماً أقسام الصفحة الرئيسية الحالية ---
const DEFAULT_SECTIONS_TEMPLATE = [
    {
        id: "sec_new_arrivals",
        title: "أحدث صيحات WIND",
        subTitle: "تصاميم شتوية تلامس الروح",
        type: "products",
        layout: "grid_default",
        selectionMode: "automated",
        selectedCategory: "new-arrivals",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_shop_new",
        title: "تسوق التشكيلة الجديدة",
        subTitle: "أناقة WIND في كل خطوة",
        type: "products",
        layout: "infinite_marquee",
        selectionMode: "automated",
        selectedCategory: "new-collection",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_bestsellers",
        title: "الأكثر مبيعاً",
        subTitle: "",
        type: "products",
        layout: "bestseller_split",
        selectionMode: "automated",
        selectedCategory: "bestsellers",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_trust_bar",
        title: "تقييم العملاء",
        subTitle: "",
        type: "collections_list",
        layout: "trust_bar",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_collections",
        title: "مجموعات مميزة",
        subTitle: "",
        type: "collections_list",
        layout: "circle_avatars",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: ["فساتين", "بلوزات", "تنانير", "أطقم"]
    },
    {
        id: "sec_reviews",
        title: "آراء عائلة WIND",
        subTitle: "",
        type: "collections_list",
        layout: "review_marquee",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_magazine",
        title: "WIND Magazine",
        subTitle: "مقالات في الأناقة",
        type: "collections_list",
        layout: "magazine_grid",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_top_rated",
        title: "الأعلى تقييماً",
        subTitle: "القطع التي نالت إعجاب الجميع",
        type: "products",
        layout: "grid_default",
        selectionMode: "automated",
        selectedCategory: "top-rated",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_story",
        title: "قصة WIND",
        subTitle: "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء...",
        type: "collections_list",
        layout: "story_banner",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_footer_cats",
        title: "تسوق حسب الفئة",
        subTitle: "",
        type: "collections_list",
        layout: "rect_banners",
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_sale",
        title: "تخفيضات WIND الحصرية",
        subTitle: "لفترة محدودة",
        type: "products",
        layout: "sale_grid",
        selectionMode: "automated",
        selectedCategory: "sale",
        selectedItems: [],
        selectedCollections: []
    }
];

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [dataLibrary, setDataLibrary] = useState({ products: [], categories: [] });

  // إضافة حالة للتحكم في نوع اختيار المنتجات (كل المنتجات / أقسام)
  const [productSource, setProductSource] = useState('all'); // 'all' or 'collections'

  const [newSection, setNewSection] = useState({
    title: '', subTitle: '', type: 'products', selectionMode: 'automated',
    selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default',
  });

  // --- محرك المعاينة (كما هو) ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, subTitle } = section;
    return (
      <div className="w-full bg-neutral-900/50 rounded-xl p-4 border border-white/5 space-y-3 overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
        <div className="flex items-center justify-between px-1" dir="rtl">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,197,24,0.4)]"></div>
            <div>
              <h2 className="text-sm font-bold text-neutral-200 leading-none">{title || "عنوان القسم"}</h2>
              {subTitle && <p className="text-neutral-500 text-[9px] mt-0.5 font-medium">{subTitle}</p>}
            </div>
          </div>
        </div>
        <div className="px-1 min-h-[60px] flex flex-col justify-center relative opacity-80 group-hover:opacity-100 transition-opacity">
            {layout === 'bestseller_split' && <div className="flex gap-2 h-16 w-full"><div className="w-1/3 bg-neutral-800 rounded-lg border border-white/5"></div><div className="w-2/3 grid grid-cols-2 gap-1.5">{[...Array(4)].map((_, i) => <div key={i} className="bg-neutral-800 rounded-md border border-white/5"></div>)}</div></div>}
            {layout === 'infinite_marquee' && <div className="flex gap-2 overflow-hidden opacity-60">{[...Array(5)].map((_, i) => <div key={i} className="min-w-[50px] aspect-[3/4] bg-neutral-800 rounded-lg border border-white/5"></div>)}</div>}
            {layout === 'trust_bar' && <div className="bg-neutral-800/50 py-2 border-y border-white/5 flex justify-evenly items-center rounded-lg">{[...Array(3)].map((_, i) => <div key={i} className="w-6 h-6 rounded-full bg-neutral-700/50 border border-white/5 flex items-center justify-center text-amber-500 text-[8px]">★</div>)}</div>}
            {layout === 'magazine_grid' && <div className="grid grid-cols-2 gap-2 h-16"><div className="bg-neutral-800 rounded-lg border border-white/5"></div><div className="bg-neutral-800 rounded-lg border border-white/5"></div></div>}
            {layout === 'review_marquee' && <div className="flex gap-2 overflow-hidden">{[...Array(2)].map((_, i) => <div key={i} className="min-w-[100px] bg-neutral-800 p-2 rounded-lg border border-white/5 flex flex-col gap-1.5"><div className="w-full h-3 bg-neutral-900/50 rounded"></div></div>)}</div>}
            {layout === 'story_banner' && <div className="h-16 bg-neutral-800 rounded-xl flex flex-col items-center justify-center border border-white/5"><div className="text-amber-500/20 text-xs font-black italic">OUR STORY</div></div>}
            {layout === 'grid_default' && <div className="grid grid-cols-4 gap-1.5">{[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-800 rounded-lg border border-white/5"></div>)}</div>}
            {layout === 'imdb_posters' && <div className="flex gap-2 overflow-hidden">{[...Array(5)].map((_, i) => <div key={i} className="min-w-[50px] aspect-[2/3] bg-neutral-800 rounded-lg border border-white/5"></div>)}</div>}
            {layout === 'bento_modern' && <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-16"><div className="col-span-2 row-span-2 bg-neutral-800 rounded-lg border border-white/5"></div><div className="col-span-2 row-span-1 bg-neutral-800 rounded-lg border border-white/5"></div><div className="col-span-1 row-span-1 bg-neutral-800 rounded-lg border border-white/5"></div><div className="col-span-1 row-span-1 bg-amber-500/20 border border-amber-500/20 rounded-lg"></div></div>}
            {layout === 'sale_grid' && <div className="space-y-1"><div className="w-full h-4 bg-amber-500/90 rounded-md"></div><div className="grid grid-cols-4 gap-1.5">{[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-neutral-800 rounded-md border border-white/5"></div>)}</div></div>}
            {layout === 'circle_avatars' && <div className="flex justify-center gap-3 py-1">{[...Array(4)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10"></div>)}</div>}
            {layout === 'rect_banners' && <div className="grid grid-cols-2 gap-2 h-12">{[...Array(2)].map((_, i) => <div key={i} className="bg-neutral-800 rounded-lg border border-white/5"></div>)}</div>}
        </div>
      </div>
    );
  };

  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'أحدث الصيحات (Grid)', icon: '▦' },
      { id: 'infinite_marquee', name: 'شريط متحرك (Marquee)', icon: '🏃' },
      { id: 'bestseller_split', name: 'الأكثر مبيعاً (Split)', icon: '🏆' },
      { id: 'sale_grid', name: 'تخفيضات (Yellow)', icon: '🏷️' },
      { id: 'imdb_posters', name: 'بوسترات (Posters)', icon: '🎬' },
      { id: 'bento_modern', name: 'بنتو (Bento Grid)', icon: '🍱' },
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'أقسام دائرية (Circles)', icon: '◯' },
        { id: 'rect_banners', name: 'بانرات عريضة (Banners)', icon: '▭' },
        { id: 'trust_bar', name: 'شريط الثقة (Trust)', icon: '🛡️' },
        { id: 'review_marquee', name: 'آراء العملاء (Reviews)', icon: '💬' },
        { id: 'magazine_grid', name: 'المجلة (Magazine)', icon: '📖' },
        { id: 'story_banner', name: 'قصة البراند (Story)', icon: '📜' },
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
        if (docSnap.exists() && docSnap.data().sections && docSnap.data().sections.length > 0) {
            setSections(docSnap.data().sections);
        } else {
            setSections(DEFAULT_SECTIONS_TEMPLATE);
        }
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

  const moveSection = (index, direction) => {
    const newArr = [...sections];
    if (direction === 'up' && index > 0) {
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 'down' && index < sections.length - 1) {
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    setSections(newArr);
  };

  const handleAddOrUpdate = () => {
    if (!newSection.title) return alert("يرجى إدخال العنوان الرئيسي");
    const sectionData = { ...newSection, id: editingId || Date.now().toString() };
    if (editingId) {
        setSections(sections.map(s => s.id === editingId ? sectionData : s));
        setEditingId(null);
    } else { setSections([...sections, sectionData]); }
    setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });
    setProductSource('all');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-amber-500/30" dir="rtl">
        
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-black text-xl font-black shadow-lg shadow-amber-500/20">W</div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">WIND <span className="text-amber-500 font-light">Architect</span></h1>
                        <p className="text-[10px] text-neutral-400 font-medium tracking-widest uppercase">Visual Page Builder v7.0</p>
                    </div>
                </div>
                <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم النشر بنجاح"); }} 
                    className="group relative bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all duration-300 shadow-lg">
                    {loading ? "جاري الحفظ..." : "نشر التعديلات 🚀"}
                </button>
            </div>
        </div>

      {/* --- Main Layout --- */}
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-start h-[calc(100vh-80px)]">
        
        {/* === RIGHT PANEL (Inputs/Controls) - Expanded Width (col-span-6) === */}
        <div className="lg:col-span-6 h-full overflow-y-auto pb-32 pr-2 custom-scrollbar">
          <div className="bg-neutral-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-2xl relative">
            
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    {editingId ? "تعديل القسم الحالي" : "إضافة قسم جديد"}
                </h2>
                {editingId && <button onClick={() => {setEditingId(null); setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });}} className="text-xs text-red-400 hover:text-red-300">إلغاء التعديل</button>}
            </div>

            <div className="space-y-6">
                {/* 1. العناوين */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400 font-medium mr-1">العنوان الرئيسي</label>
                        <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="مثلاً: الأكثر مبيعاً" className="w-full bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400 font-medium mr-1">العنوان الفرعي</label>
                        <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="وصف قصير..." className="w-full bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 outline-none transition-all" />
                    </div>
                </div>

                {/* 2. نوع المحتوى واختياراته */}
                <div className="space-y-4">
                     <label className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mr-1">نوع المحتوى</label>
                     <div className="bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 flex relative">
                        <button onClick={() => { setNewSection({...newSection, type: 'products'}); setProductSource('all'); }} className={`flex-1 py-3 text-xs rounded-xl font-bold transition-all duration-300 ${newSection.type === 'products' ? 'text-black bg-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>منتجات 👕</button>
                        <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-3 text-xs rounded-xl font-bold transition-all duration-300 ${newSection.type === 'collections_list' ? 'text-black bg-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>محتوى عام 📚</button>
                    </div>

                    {/* خيارات المنتجات */}
                    {newSection.type === 'products' && (
                        <div className="space-y-3 px-2">
                             <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="prodSource" checked={productSource === 'all'} onChange={() => { setProductSource('all'); setNewSection({...newSection, selectionMode: 'automated', selectedCategory: ''}) }} className="accent-amber-500" />
                                    <span className="text-xs text-neutral-300 font-medium">كل المنتجات (آلي)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="prodSource" checked={productSource === 'collections'} onChange={() => setProductSource('collections')} className="accent-amber-500" />
                                    <span className="text-xs text-neutral-300 font-medium">أقسام مرتبطة</span>
                                </label>
                             </div>

                             {/* قائمة الأقسام المرتبطة (تظهر فقط عند اختيارها) */}
                             {productSource === 'collections' && (
                                <div className="mt-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                                    {dataLibrary.categories.map(cat => (
                                        <label key={cat} className={`p-2 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                                            {cat} <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                        </label>
                                    ))}
                                </div>
                             )}
                        </div>
                    )}

                    {/* خيارات المحتوى العام (تظهر القائمة مباشرة) */}
                    {newSection.type === 'collections_list' && (
                         <div className="mt-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                            {dataLibrary.categories.map(cat => (
                                <label key={cat} className={`p-2 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                                    {cat} <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. التصميم والمعاينة */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mr-1">اختر التصميم</label>
                    <div className="relative group">
                        <select value={newSection.layout} onChange={e => setNewSection({...newSection, layout: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-sm font-medium text-white focus:border-amber-500 transition-all outline-none appearance-none cursor-pointer hover:bg-neutral-900">
                            {(layoutOptions[newSection.type] || []).map(l => <option key={l.id} value={l.id} className="bg-neutral-900">{l.icon} &nbsp; {l.name}</option>)}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none group-hover:text-amber-500 transition-colors">▼</div>
                    </div>
                </div>

                <div className="bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50">
                     <WINDVisualMockup section={newSection} />
                </div>

                <button onClick={handleAddOrUpdate} className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-amber-500/20">
                    {editingId ? "حفظ التعديلات ✓" : "إضافة القسم للقائمة +"}
                </button>
            </div>
          </div>
        </div>

        {/* === LEFT PANEL (Structure List) - Smaller Width (col-span-6) === */}
        <div className="lg:col-span-6 h-full overflow-y-auto pb-32 custom-scrollbar pl-2">
            <div className="sticky top-0 bg-neutral-950/80 backdrop-blur-md z-20 pb-4 mb-2 border-b border-white/5 flex justify-between items-end">
                 <h2 className="text-xs font-black text-neutral-500 uppercase tracking-[0.4em]">هيكل الصفحة ({sections.length})</h2>
            </div>
            
            {sections.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20">
                    <p className="text-neutral-600 font-medium">جاري تحميل البيانات...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((s, i) => (
                        <div key={s.id} className="group relative bg-neutral-900/40 hover:bg-neutral-900/80 border border-white/5 hover:border-white/10 rounded-2xl p-1 transition-all duration-200">
                            <div className="flex items-stretch">
                                {/* Order Number & Controls (Arrows) */}
                                <div className="flex flex-col items-center justify-center w-12 border-l border-white/5 ml-2 gap-2">
                                    <button onClick={() => moveSection(i, 'up')} disabled={i === 0} className="text-neutral-500 hover:text-amber-500 disabled:opacity-20 transition-colors">▲</button>
                                    <span className="text-[10px] font-mono text-neutral-400 font-bold">{(i+1).toString().padStart(2, '0')}</span>
                                    <button onClick={() => moveSection(i, 'down')} disabled={i === sections.length - 1} className="text-neutral-500 hover:text-amber-500 disabled:opacity-20 transition-colors">▼</button>
                                </div>

                                {/* Content Preview & Actions */}
                                <div className="flex-1 py-2 pl-2">
                                     <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${s.type === 'products' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{s.type === 'products' ? 'PROD' : 'CONTENT'}</span>
                                            <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-white/5">{s.layout}</span>
                                            {s.selectedCollections.length > 0 && <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">+ {s.selectedCollections.length} Coll</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => { setNewSection(s); setEditingId(s.id); }} className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center">✎</button>
                                             <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-6 h-6 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">✕</button>
                                        </div>
                                     </div>
                                     <div className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                                         <WINDVisualMockup section={s} />
                                     </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;900&display=swap');
        .font-sans { font-family: 'Cairo', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
}