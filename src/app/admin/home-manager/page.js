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
        layout: "grid_default", // استايل الشبكة العادية
        selectionMode: "automated",
        selectedCategory: "new-arrivals", // تأكد من أن هذا التصنيف موجود في منتجاتك
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_shop_new",
        title: "تسوق التشكيلة الجديدة",
        subTitle: "أناقة WIND في كل خطوة",
        type: "products",
        layout: "infinite_marquee", // استايل الشريط المتحرك
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
        layout: "bestseller_split", // استايل 1 كبير و 4 صغار
        selectionMode: "automated",
        selectedCategory: "bestsellers",
        selectedItems: [],
        selectedCollections: []
    },
    {
        id: "sec_trust_bar",
        title: "تقييم العملاء",
        subTitle: "",
        type: "collections_list", // نوع محتوى عام
        layout: "trust_bar", // استايل شريط الثقة
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
        layout: "circle_avatars", // استايل الدوائر
        selectionMode: "manual",
        selectedCategory: "",
        selectedItems: [],
        selectedCollections: ["فساتين", "بلوزات", "تنانير", "أطقم"] // أمثلة
    },
    {
        id: "sec_reviews",
        title: "آراء عائلة WIND",
        subTitle: "",
        type: "collections_list",
        layout: "review_marquee", // استايل شريط الآراء
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
        layout: "magazine_grid", // استايل المجلة
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
        layout: "story_banner", // استايل القصة
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
        layout: "rect_banners", // استايل البانرات المستطيلة (يشبه الفوتر)
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
        layout: "sale_grid", // استايل التخفيضات
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

  const [newSection, setNewSection] = useState({
    title: '', subTitle: '', type: 'products', selectionMode: 'automated',
    selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default',
  });

  // --- 1. محرك المعاينة الذكي (Smart Mockup Engine) ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, subTitle } = section;
    
    // تصميم محسن للمعاينة الداخلية
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

        <div className="px-1 min-h-[80px] flex flex-col justify-center relative opacity-80 group-hover:opacity-100 transition-opacity">
            {/* 1. ستايل الأكثر مبيعاً */}
            {layout === 'bestseller_split' && (
                <div className="flex gap-2 h-24 w-full">
                    <div className="w-1/3 bg-neutral-800 rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5">
                        <div className="absolute top-1 right-1 bg-amber-500 px-1.5 py-0.5 text-[6px] text-black font-black rounded">TOP</div>
                    </div>
                    <div className="w-2/3 grid grid-cols-2 gap-1.5">
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-neutral-800 rounded-md border border-white/5"></div>)}
                    </div>
                </div>
            )}
            {/* 2. ستايل الماركي */}
            {layout === 'infinite_marquee' && (
                <div className="flex gap-2 overflow-hidden opacity-60">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className="min-w-[60px] aspect-[3/4] bg-neutral-800 rounded-lg border border-white/5"></div>
                    ))}
                </div>
            )}
            {/* 3. شريط الثقة */}
            {layout === 'trust_bar' && (
                <div className="bg-neutral-800/50 py-3 border-y border-white/5 flex justify-evenly items-center rounded-lg">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-neutral-700/50 border border-white/5 flex items-center justify-center text-amber-500 text-[8px]">★</div>
                    ))}
                </div>
            )}
            {/* 4. المجلة */}
            {layout === 'magazine_grid' && (
                <div className="grid grid-cols-2 gap-2 h-24">
                    <div className="bg-neutral-800 rounded-lg border border-white/5 relative overflow-hidden"><div className="absolute bottom-2 right-2 w-10 h-1.5 bg-neutral-600 rounded-full"></div></div>
                    <div className="bg-neutral-800 rounded-lg border border-white/5 relative overflow-hidden"><div className="absolute bottom-2 right-2 w-10 h-1.5 bg-neutral-600 rounded-full"></div></div>
                </div>
            )}
            {/* 5. الآراء */}
            {layout === 'review_marquee' && (
                <div className="flex gap-2 overflow-hidden">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="min-w-[120px] bg-neutral-800 p-2 rounded-lg border border-white/5 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-amber-500"></div><div className="w-8 h-1 bg-neutral-600 rounded-full"></div></div>
                            <div className="w-full h-4 bg-neutral-900/50 rounded"></div>
                        </div>
                    ))}
                </div>
            )}
            {/* 6. القصة */}
            {layout === 'story_banner' && (
                <div className="h-24 bg-neutral-800 rounded-xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
                    <div className="text-amber-500/20 text-lg font-black italic tracking-tighter">OUR STORY</div>
                </div>
            )}
            {/* 7. شبكة افتراضية */}
            {layout === 'grid_default' && (
                <div className="grid grid-cols-4 gap-1.5">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-800 rounded-lg border border-white/5"></div>)}
                </div>
            )}
            {/* 8. بوسترات */}
            {layout === 'imdb_posters' && (
                <div className="flex gap-2 overflow-hidden">
                    {[...Array(5)].map((_, i) => <div key={i} className="min-w-[60px] aspect-[2/3] bg-neutral-800 rounded-lg border border-white/5"></div>)}
                </div>
            )}
            {/* 9. بنتو */}
             {layout === 'bento_modern' && (
                <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-24">
                    <div className="col-span-2 row-span-2 bg-neutral-800 rounded-lg border border-white/5"></div>
                    <div className="col-span-2 row-span-1 bg-neutral-800 rounded-lg border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-neutral-800 rounded-lg border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-amber-500/20 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 text-[6px] font-bold">WIND</div>
                </div>
            )}
            {/* 10. تخفيضات */}
            {layout === 'sale_grid' && (
                <div className="space-y-1.5">
                    <div className="w-full h-5 bg-amber-500/90 rounded-md flex items-center justify-center text-black font-black text-[8px] uppercase">SALE</div>
                    <div className="grid grid-cols-4 gap-1.5">{[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-neutral-800 rounded-md border border-white/5"></div>)}</div>
                </div>
            )}
            {/* 11. دوائر */}
            {layout === 'circle_avatars' && (
                <div className="flex justify-center gap-3 py-1">
                    {[...Array(4)].map((_, i) => <div key={i} className="flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10"></div></div>)}
                </div>
            )}
            {/* 12. بانرات مستطيلة */}
            {layout === 'rect_banners' && (
                <div className="grid grid-cols-2 gap-2 h-16">{[...Array(2)].map((_, i) => <div key={i} className="bg-neutral-800 rounded-lg border border-white/5"></div>)}</div>
            )}
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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-amber-500/30" dir="rtl">
        
        {/* --- Modern Floating Header --- */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5 supports-[backdrop-filter]:bg-black/20">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-black text-xl font-black shadow-lg shadow-amber-500/20">W</div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">WIND <span className="text-amber-500 font-light">Architect</span></h1>
                        <p className="text-[10px] text-neutral-400 font-medium tracking-widest uppercase">Visual Page Builder v7.0</p>
                    </div>
                </div>
                <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم النشر بنجاح"); }} 
                    className="group relative bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-amber-500/40 overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                        {loading ? "جاري الحفظ..." : "نشر التعديلات 🚀"}
                    </span>
                </button>
            </div>
        </div>

      <div className="max-w-[1920px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 p-6 items-start h-[calc(100vh-80px)]">
        
        {/* === Left Panel: Controls (Glassmorphism Card) === */}
        <div className="xl:col-span-5 space-y-6 h-full overflow-y-auto pb-32 pr-2 custom-scrollbar">
          <div className="bg-neutral-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-2xl relative">
            
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    {editingId ? "تعديل القسم الحالي" : "إضافة قسم جديد"}
                </h2>
                {editingId && <button onClick={() => {setEditingId(null); setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });}} className="text-xs text-red-400 hover:text-red-300">إلغاء التعديل</button>}
            </div>

            <div className="space-y-6">
                {/* Inputs Group */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400 font-medium mr-1">العنوان الرئيسي</label>
                        <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="مثلاً: الأكثر مبيعاً" 
                            className="w-full bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400 font-medium mr-1">العنوان الفرعي (اختياري)</label>
                        <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="وصف قصير..." 
                            className="w-full bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all" />
                    </div>
                </div>

                {/* Type Selector (Segmented Control) */}
                <div className="bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 flex relative">
                    <button onClick={() => setNewSection({...newSection, type: 'products'})} 
                        className={`flex-1 py-3 text-xs rounded-xl font-bold transition-all duration-300 relative z-10 ${newSection.type === 'products' ? 'text-black bg-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
                        منتجات 👕
                    </button>
                    <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} 
                        className={`flex-1 py-3 text-xs rounded-xl font-bold transition-all duration-300 relative z-10 ${newSection.type === 'collections_list' ? 'text-black bg-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
                        محتوى عام 📚
                    </button>
                </div>

                {/* Layout Selector */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mr-1">اختر التصميم</label>
                    <div className="relative group">
                        <select value={newSection.layout} onChange={e => setNewSection({...newSection, layout: e.target.value})} 
                            className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-sm font-medium text-white focus:border-amber-500 transition-all outline-none appearance-none cursor-pointer hover:bg-neutral-900">
                            {(layoutOptions[newSection.type] || []).map(l => (
                                <option key={l.id} value={l.id} className="bg-neutral-900">{l.icon} &nbsp; {l.name}</option>
                            ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none group-hover:text-amber-500 transition-colors">▼</div>
                    </div>
                </div>

                {/* Live Preview Inside Editor */}
                <div className="bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50">
                     <WINDVisualMockup section={newSection} />
                </div>

                {/* Data Selection Area */}
                <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
                    {newSection.type === 'products' ? (
                        <div className="space-y-5">
                            {/* Auto Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">1. المصدر الآلي</label>
                                <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value, selectionMode: 'automated'})} 
                                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-xs font-bold text-white outline-none focus:border-amber-500/50">
                                    <option value="">-- عرض كل المنتجات --</option>
                                    {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Manual Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">أو اختر يدوياً ({newSection.selectedItems.length})</label>
                                <div className="max-h-32 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar bg-neutral-900/50 p-2 rounded-lg border border-white/5">
                                    {dataLibrary.products.map(p => (
                                        <label key={p.id} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${newSection.selectedItems.includes(p.id) ? 'bg-amber-500/10 border-amber-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                                            <span className="text-[10px] font-medium truncate w-4/5 text-neutral-300">{p.title}</span>
                                            <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => { toggleItem(p.id, 'selectedItems'); setNewSection(prev => ({...prev, selectionMode: 'manual'})); }} className="w-3.5 h-3.5 accent-amber-500 bg-neutral-800 border-neutral-600 rounded" />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Related Collections */}
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                 <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span>🔗</span> أقسام مرتبطة (فلاتر/دوائر)
                                 </label>
                                 <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {dataLibrary.categories.map(cat => (
                                        <label key={cat} className={`p-2 rounded-lg border text-[9px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                                            {cat}
                                            <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">اختر الكولكشنات للعرض</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {dataLibrary.categories.map(cat => (
                                    <label key={cat} className={`p-3 rounded-xl border text-[10px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                                        {cat}
                                        <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleAddOrUpdate} className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-amber-500/20">
                    {editingId ? "حفظ التعديلات ✓" : "إضافة القسم للقائمة +"}
                </button>
            </div>
          </div>
        </div>

        {/* === Right Panel: Layer List (Clean List View) === */}
        <div className="xl:col-span-7 h-full overflow-y-auto pb-32 custom-scrollbar pl-2">
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
                                {/* Order Number & Controls */}
                                <div className="flex flex-col items-center justify-center w-12 border-l border-white/5 ml-2 gap-2">
                                    <span className="text-[10px] font-mono text-neutral-600">{(i+1).toString().padStart(2, '0')}</span>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={() => { setNewSection(s); setEditingId(s.id); }} className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center">✎</button>
                                         <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-6 h-6 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">✕</button>
                                    </div>
                                </div>

                                {/* Content Preview */}
                                <div className="flex-1 py-2 pl-2">
                                     <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${s.type === 'products' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                {s.type === 'products' ? 'PROD' : 'CONTENT'}
                                            </span>
                                            <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-white/5">{s.layout}</span>
                                            {s.selectedCollections.length > 0 && <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">+ {s.selectedCollections.length} Coll</span>}
                                        </div>
                                     </div>
                                     
                                     {/* Mini Visual */}
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