"use client";
import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// --- القالب الافتراضي (مع إضافة خاصية isVisible) ---
const DEFAULT_SECTIONS_TEMPLATE = [
    { id: "sec_new_arrivals", title: "أحدث صيحات WIND", subTitle: "تصاميم شتوية تلامس الروح", type: "products", layout: "grid_default", selectionMode: "automated", selectedCategory: "new-arrivals", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_shop_new", title: "تسوق التشكيلة الجديدة", subTitle: "أناقة WIND في كل خطوة", type: "products", layout: "infinite_marquee", selectionMode: "automated", selectedCategory: "new-collection", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_bestsellers", title: "الأكثر مبيعاً", subTitle: "", type: "products", layout: "bestseller_split", selectionMode: "automated", selectedCategory: "bestsellers", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_trust_bar", title: "تقييم العملاء", subTitle: "", type: "collections_list", layout: "trust_bar", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_collections", title: "مجموعات مميزة", subTitle: "", type: "collections_list", layout: "circle_avatars", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: ["فساتين", "بلوزات", "تنانير", "أطقم"], isVisible: true },
    { id: "sec_reviews", title: "آراء عائلة WIND", subTitle: "", type: "collections_list", layout: "review_marquee", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_magazine", title: "WIND Magazine", subTitle: "مقالات في الأناقة", type: "collections_list", layout: "magazine_grid", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_top_rated", title: "الأعلى تقييماً", subTitle: "القطع التي نالت إعجاب الجميع", type: "products", layout: "grid_default", selectionMode: "automated", selectedCategory: "top-rated", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_story", title: "قصة WIND", subTitle: "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء...", type: "collections_list", layout: "story_banner", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_footer_cats", title: "تسوق حسب الفئة", subTitle: "", type: "collections_list", layout: "rect_banners", selectionMode: "manual", selectedCategory: "", selectedItems: [], selectedCollections: [], isVisible: true },
    { id: "sec_sale", title: "تخفيضات WIND الحصرية", subTitle: "لفترة محدودة", type: "products", layout: "sale_grid", selectionMode: "automated", selectedCategory: "sale", selectedItems: [], selectedCollections: [], isVisible: true }
];

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [dataLibrary, setDataLibrary] = useState({ products: [], categories: [] });
  
  // --- States للإضافات الجديدة ---
  const [activeTab, setActiveTab] = useState('content'); // للتبويبات (content, layout, data)
  const [productSearch, setProductSearch] = useState(''); // للبحث عن المنتجات

  const [newSection, setNewSection] = useState({
    title: '', subTitle: '', type: 'products', selectionMode: 'automated',
    selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default',
    isVisible: true 
  });

  // --- 1. محرك المعاينة الذكي (محدث ليدعم الإخفاء) ---
  const WINDVisualMockup = ({ section }) => {
    const { layout, title, isVisible } = section;
    const containerClass = isVisible 
        ? "w-full bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-2xl space-y-4 overflow-hidden group hover:border-[#F5C518]/30 transition-all"
        : "w-full bg-[#0a0a0a] rounded-2xl p-4 border border-dashed border-white/10 space-y-4 overflow-hidden opacity-50 grayscale";

    return (
      <div className={containerClass}>
        <div className="flex items-center justify-between px-1" dir="rtl">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-5 rounded-sm ${isVisible ? 'bg-[#F5C518]' : 'bg-gray-600'}`}></div>
            <h2 className="text-sm font-bold text-white">{title || "عنوان القسم"}</h2>
          </div>
          {!isVisible && <span className="text-[9px] bg-red-900/50 text-red-200 px-2 py-0.5 rounded border border-red-500/20">مخفي</span>}
        </div>
        {/* تمثيل بسيط للتخطيط */}
        <div className="h-24 w-full bg-black/20 rounded-lg flex items-center justify-center border border-white/5 relative">
            <span className="text-[10px] text-gray-500 font-mono z-10">{layout}</span>
            {/* زخرفة بسيطة للخلفية */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>
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

  // --- جلب البيانات ---
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

  // --- المنطق ---
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
    
    // إعادة تعيين النموذج
    setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default', isVisible: true });
    setEditingId(null);
    setActiveTab('content'); // العودة للتبويب الأول
  };

  // --- البحث الذكي (Memoized Filter) ---
  const filteredProducts = useMemo(() => {
    if (!productSearch) return dataLibrary.products;
    return dataLibrary.products.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()));
  }, [productSearch, dataLibrary.products]);

  // --- دوال إعادة الترتيب ---
  const moveSection = (index, direction) => {
    const newArr = [...sections];
    if (direction === 'up' && index > 0) {
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 'down' && index < sections.length - 1) {
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    setSections(newArr);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white p-6 font-cairo" dir="rtl">
        
        {/* --- Top Bar (Glassmorphism) --- */}
        <div className="max-w-[1800px] mx-auto flex justify-between items-center mb-8 bg-[#151515]/80 backdrop-blur-md p-4 rounded-3xl border border-white/5 sticky top-4 z-50 shadow-xl">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F5C518] to-[#d4a000] rounded-xl flex items-center justify-center text-black text-xl font-black shadow-lg shadow-[#F5C518]/20">W</div>
                <div>
                    <h1 className="text-lg font-black text-white tracking-tight uppercase">WIND <span className="text-[#F5C518]">Architect</span></h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] text-gray-400 font-bold">Live Editor System</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => { if(confirm('هل أنت متأكد؟ سيعيد هذا جميع الأقسام للوضع الافتراضي.')) setSections(DEFAULT_SECTIONS_TEMPLATE); }} className="bg-[#222] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#333] transition-all border border-white/5">
                    استعادة الافتراضي ↺
                </button>
                <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم النشر بنجاح!"); }} 
                    className="bg-[#F5C518] text-black px-8 py-3 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg hover:shadow-[#F5C518]/30 flex items-center gap-2">
                    {loading ? "جاري الحفظ..." : "نشر التغييرات 🚀"}
                </button>
            </div>
        </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* === Left Panel: Editor (Sticky) === */}
        <div className="xl:col-span-4 xl:sticky xl:top-28 space-y-6">
          <div className="bg-[#151515] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
             {/* Glass Overlay Effect */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F5C518] to-transparent"></div>
             
             {/* Header of Editor */}
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span className="text-[#F5C518]">⚡</span> {editingId ? 'تعديل القسم' : 'قسم جديد'}
                </h2>
                
                {/* Visibility Toggle Switch */}
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5">
                    <span className="text-[9px] font-bold text-gray-400 px-2">{newSection.isVisible ? 'ظاهر' : 'مخفي'}</span>
                    <button 
                        onClick={() => setNewSection({...newSection, isVisible: !newSection.isVisible})}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${newSection.isVisible ? 'bg-[#F5C518]' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${newSection.isVisible ? 'left-1' : 'left-6'}`}></div>
                    </button>
                </div>
             </div>

             {/* === TAB SYSTEM NAVIGATION === */}
             <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
                {['content', 'layout', 'data'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} 
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-[#222] text-[#F5C518] shadow-sm border border-white/10' : 'text-gray-500 hover:text-white'}`}>
                        {tab === 'content' ? '1. المحتوى' : tab === 'layout' ? '2. التصميم' : '3. البيانات'}
                    </button>
                ))}
             </div>

             {/* === TAB 1: CONTENT (المحتوى) === */}
             {activeTab === 'content' && (
                 <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold px-1">العنوان الرئيسي</label>
                        <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-xl text-sm font-bold focus:border-[#F5C518] outline-none text-white transition-all focus:bg-black" placeholder="عنوان يظهر للمستخدم..." />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold px-1">العنوان الفرعي</label>
                        <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-xl text-xs text-gray-300 focus:border-[#F5C518] outline-none transition-all focus:bg-black" placeholder="وصف قصير تحت العنوان..." />
                    </div>
                    <div className="pt-2">
                        <label className="text-[9px] text-gray-500 font-bold px-1 mb-2 block">نوع المحتوى</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${newSection.type === 'products' ? 'bg-[#F5C518]/10 border-[#F5C518] text-[#F5C518]' : 'bg-[#0a0a0a] border-[#222] text-gray-500'}`}>
                                <span className="text-xl">👕</span>
                                <span className="text-[10px] font-black">منتجات</span>
                            </button>
                            <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518]/10 border-[#F5C518] text-[#F5C518]' : 'bg-[#0a0a0a] border-[#222] text-gray-500'}`}>
                                <span className="text-xl">📚</span>
                                <span className="text-[10px] font-black">محتوى عام</span>
                            </button>
                        </div>
                    </div>
                 </div>
             )}

             {/* === TAB 2: LAYOUT (التصميم) === */}
             {activeTab === 'layout' && (
                 <div className="space-y-4 animate-fade-in">
                    <label className="text-[9px] text-gray-500 font-bold px-1">اختر القالب (Layout Style)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
                        {(layoutOptions[newSection.type] || []).map(l => (
                            <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all text-right ${newSection.layout === l.id ? 'bg-[#F5C518] border-[#F5C518] text-black shadow-lg shadow-[#F5C518]/20' : 'bg-[#0a0a0a] border-[#222] text-gray-400 hover:border-gray-600'}`}>
                                <span className="text-2xl bg-black/10 w-10 h-10 flex items-center justify-center rounded-lg">{l.icon}</span>
                                <div>
                                    <div className="text-xs font-black">{l.name}</div>
                                    <div className="text-[9px] opacity-70">تصميم احترافي جاهز</div>
                                </div>
                            </button>
                        ))}
                    </div>
                 </div>
             )}

             {/* === TAB 3: DATA (البيانات والمنتجات) === */}
             {activeTab === 'data' && (
                 <div className="space-y-4 animate-fade-in">
                    
                    {/* (أ) إذا كان النوع منتجات */}
                    {newSection.type === 'products' ? (
                        <div className="space-y-4">
                            {/* الخيار 1: اختيار آلي بالتصنيف */}
                            <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#222]">
                                <label className="text-[9px] text-gray-500 font-bold mb-2 block">فلترة حسب القسم (اختياري)</label>
                                <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value, selectionMode: 'automated'})} className="w-full bg-[#151515] border border-[#333] p-2 rounded-lg text-xs font-bold text-[#F5C518] outline-none">
                                    <option value="">-- عرض كل المنتجات --</option>
                                    {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* الخيار 2: اختيار يدوي مع بحث ذكي */}
                            <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[9px] text-gray-500 font-bold">تحديد منتجات يدوياً ({newSection.selectedItems.length})</label>
                                    {/* Smart Search Bar */}
                                    <input type="text" placeholder="🔍 ابحث عن منتج..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="bg-[#0a0a0a] border border-[#222] rounded-full px-3 py-1 text-[10px] text-white w-1/2 outline-none focus:border-[#F5C518]" />
                                </div>
                                <div className="max-h-56 overflow-y-auto pr-1 space-y-1 scrollbar-hide bg-[#0a0a0a] p-2 rounded-xl border border-[#222]">
                                    {filteredProducts.map(p => (
                                        <label key={p.id} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${newSection.selectedItems.includes(p.id) ? 'bg-[#F5C518]/20 border-[#F5C518]/50' : 'bg-transparent border-transparent hover:bg-[#151515]'}`}>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-8 h-8 bg-[#222] rounded-md bg-cover bg-center shrink-0" style={{backgroundImage: `url(${p.images?.[0] || p.image || '/placeholder.jpg'})`}}></div>
                                                <span className="text-[10px] font-bold truncate text-gray-300">{p.title}</span>
                                            </div>
                                            <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => { toggleItem(p.id, 'selectedItems'); setNewSection(prev => ({...prev, selectionMode: 'manual'})); }} className="w-3.5 h-3.5 accent-[#F5C518]" />
                                        </label>
                                    ))}
                                    {filteredProducts.length === 0 && <div className="text-center text-[10px] text-gray-600 py-4">لا توجد منتجات مطابقة للبحث</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // (ب) إذا كان النوع محتوى عام (Collections List)
                        <div className="space-y-2">
                            <label className="text-[9px] text-gray-500 font-bold block mb-2">اختر الأقسام/الكولكشنات المعروضة</label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-hide bg-[#0a0a0a] p-2 rounded-xl border border-[#222]">
                                {dataLibrary.categories.map(cat => (
                                    <label key={cat} className={`p-3 rounded-xl border text-[10px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'bg-[#151515] border-[#333] text-gray-500 hover:border-gray-500'}`}>
                                        {cat}
                                        <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                                    </label>
                                ))}
                            </div>
                            <p className="text-[9px] text-gray-600 mt-2">* هذا الخيار مثالي عند اختيار تصميم "أقسام دائرية" أو "بانرات عريضة".</p>
                        </div>
                    )}
                 </div>
             )}

             <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-[#F5C518] transition-all active:scale-95 shadow-lg mt-4">
                {editingId ? "حفظ التعديلات ✓" : "إضافة القسم للهيكل +"}
             </button>
          </div>
        </div>

        {/* === Right Panel: Layer List (Reordering & Management) === */}
        <div className="xl:col-span-8 space-y-6">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-xl font-black text-white">ترتيب الصفحة</h2>
                    <p className="text-[10px] text-gray-500">استخدم الأسهم لإعادة الترتيب، وزر العين للإخفاء</p>
                </div>
                <div className="text-[10px] font-mono text-[#F5C518] bg-[#F5C518]/10 px-3 py-1 rounded-full">
                    {sections.length} Active Sections
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#222] rounded-[3rem] gap-4">
                    <div className="text-4xl opacity-20">🏗️</div>
                    <div className="text-gray-600 font-bold text-sm">القائمة فارغة، جاري تحميل البيانات...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 pb-20">
                    {sections.map((s, i) => (
                        <div key={s.id} className={`group relative bg-[#111] hover:bg-[#161616] rounded-2xl border ${s.id === editingId ? 'border-[#F5C518]' : 'border-[#222]'} p-4 transition-all flex gap-6 items-center`}>
                            
                            {/* Reordering Controls */}
                            <div className="flex flex-col items-center gap-1">
                                <button onClick={() => moveSection(i, 'up')} disabled={i === 0} className="w-6 h-6 flex items-center justify-center rounded bg-[#222] text-gray-500 hover:text-[#F5C518] disabled:opacity-20 transition-colors">▲</button>
                                <span className="text-[8px] font-mono text-gray-600">#{i + 1}</span>
                                <button onClick={() => moveSection(i, 'down')} disabled={i === sections.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-[#222] text-gray-500 hover:text-[#F5C518] disabled:opacity-20 transition-colors">▼</button>
                            </div>

                            {/* Section Info */}
                            <div className={`flex-1 transition-opacity ${s.isVisible ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                            {s.title}
                                            {!s.isVisible && <span className="text-[8px] bg-red-900 text-red-300 px-1.5 rounded border border-red-500/20">HIDDEN</span>}
                                        </h3>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[9px] bg-[#222] px-2 py-1 rounded text-gray-400 border border-white/5 flex items-center gap-1">
                                                🎨 {layoutOptions[s.type]?.find(l => l.id === s.layout)?.name || s.layout}
                                            </span>
                                            <span className="text-[9px] bg-[#222] px-2 py-1 rounded text-gray-400 border border-white/5 flex items-center gap-1">
                                                📦 {s.type === 'products' ? `Products (${s.selectedItems.length || 'Auto'})` : `Collections (${s.selectedCollections.length})`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                        <button title={s.isVisible ? "إخفاء" : "إظهار"} onClick={() => { 
                                            const updated = sections.map(x => x.id === s.id ? {...x, isVisible: !x.isVisible} : x);
                                            setSections(updated);
                                        }} className={`p-2 rounded-lg border transition-colors ${s.isVisible ? 'text-gray-400 border-gray-800 hover:text-white hover:border-white' : 'text-red-400 border-red-900 bg-red-900/10'}`}>
                                            {s.isVisible ? '👁️' : '🚫'}
                                        </button>
                                        <button title="تعديل" onClick={() => { setNewSection(s); setEditingId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); setActiveTab('content'); }} className="p-2 rounded-lg border border-gray-800 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 transition-colors">
                                            ✏️
                                        </button>
                                        <button title="حذف" onClick={() => { if(confirm('حذف هذا القسم؟')) setSections(sections.filter(x => x.id !== s.id)); }} className="p-2 rounded-lg border border-gray-800 text-red-500 hover:bg-red-900/20 hover:border-red-500 transition-colors">
                                            🗑️
                                        </button>
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
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: Cairo, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}