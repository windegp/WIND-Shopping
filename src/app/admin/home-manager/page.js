"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // للبحث عن المنتجات
  
  const [dataLibrary, setDataLibrary] = useState({ products: [], categories: [] });
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products',           // products, collections_list
    selectionMode: 'automated', // automated, manual
    selectedCategory: '',       
    selectedItems: [],          // مصفوفة الـ IDs للمنتجات المختارة يدوياً
    selectedCollections: [],    // مصفوفة الـ IDs للكولكشنات المختارة (في حال أقسام مميزة)
    layout: 'grid_default',
  });

  // --- مكتبة التصميمات الاحترافية ---
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'WIND Classic Grid', icon: '▦' },
      { id: 'imdb_posters', name: 'IMDb: Vertical Posters', icon: '🎬' },
      { id: 'imdb_fan_picks', name: 'IMDb: Landscape Cards', icon: '⭐' },
      { id: 'bento_modern', name: 'Modern Bento Layout', icon: '🍱' },
      { id: 'sliding_carousel', name: 'Elegant Carousel', icon: '↔' },
      { id: 'marquee_promo', name: 'Scrolling Promo Bar', icon: '🏃' }
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'IMDb Style: Born Today (Circles)', icon: '◯' },
        { id: 'rect_banners', name: 'Rectangular Category Banners', icon: '▭' },
        { id: 'grid_categories', name: 'Category Icons Grid', icon: '▤' }
    ]
  };

  useEffect(() => {
    const fetchContent = async () => {
      setFetching(true);
      try {
        const prodsSnap = await getDocs(collection(db, "products"));
        const prods = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // استخراج الكولكشنات (Categories) بشكل صحيح
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

  // دالة اختيار/إلغاء منتج (Checkbox)
  const toggleItem = (id, listType) => {
    const currentList = [...newSection[listType]];
    if (currentList.includes(id)) {
        setNewSection({ ...newSection, [listType]: currentList.filter(item => item !== id) });
    } else {
        setNewSection({ ...newSection, [listType]: [...currentList, id] });
    }
  };

  const handleAddOrUpdate = () => {
    if (!newSection.title) return alert("يرجى كتابة عنوان للقسم");
    
    const sectionData = { ...newSection, id: editingId || Date.now().toString() };
    
    if (editingId) {
        setSections(sections.map(s => s.id === editingId ? sectionData : s));
        setEditingId(null);
    } else {
        setSections([...sections, sectionData]);
    }
    // تصفير النموذج
    setNewSection({ title: '', subTitle: '', type: 'products', selectionMode: 'automated', selectedCategory: '', selectedItems: [], selectedCollections: [], layout: 'grid_default' });
  };

  // فلترة المنتجات للبحث
  const filteredProducts = dataLibrary.products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans" dir="rtl">
        {/* هيدر اللوحة */}
        <div className="max-w-[1400px] mx-auto flex justify-between items-center mb-10 bg-[#121212] p-6 rounded-2xl border border-[#222]">
            <div>
                <h1 className="text-3xl font-black text-[#F5C518] tracking-tighter">WIND ARCHITECT <span className="text-white text-sm block font-normal opacity-50">نظام بناء الواجهة الذكي v3</span></h1>
            </div>
            <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم حفظ الهيكل الجديد بنجاح!"); }} 
                className="bg-[#F5C518] text-black px-10 py-3 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,197,24,0.3)]">
                {loading ? "جاري الرفع..." : "حفظ الهيكل النهائي 💾"}
            </button>
        </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === المحرر (العمود الأيمن) === */}
        <div className="lg:col-span-5 bg-[#121212] p-6 rounded-3xl border border-[#222] h-fit sticky top-6 shadow-2xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#F5C518] rounded-full"></span> {editingId ? "تعديل قسم موجود" : "إنشاء قسم جديد"}
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="العنوان الرئيسي" className="bg-black border border-[#222] p-3 rounded-xl text-sm focus:border-[#F5C518] outline-none" />
                <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي" className="bg-black border border-[#222] p-3 rounded-xl text-sm focus:border-[#F5C518] outline-none" />
            </div>

            {/* نوع المحتوى */}
            <div>
                <label className="text-[10px] text-gray-500 mb-2 block mr-1 uppercase tracking-widest">نوع المادة المعروضة</label>
                <div className="flex bg-black p-1 rounded-xl border border-[#222]">
                    <button onClick={() => setNewSection({...newSection, type: 'products', layout: 'grid_default'})} className={`flex-1 py-2 text-[11px] rounded-lg transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black font-bold' : 'text-gray-400'}`}>منتجات</button>
                    <button onClick={() => setNewSection({...newSection, type: 'collections_list', layout: 'circle_avatars'})} className={`flex-1 py-2 text-[11px] rounded-lg transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black font-bold' : 'text-gray-400'}`}>أقسام مميزة</button>
                </div>
            </div>

            {/* منطق الاختيار الذكي */}
            <div className="bg-black/50 p-4 rounded-2xl border border-[#222] space-y-4">
                <label className="text-[10px] text-[#F5C518] font-bold uppercase tracking-widest">مصدر البيانات (Source)</label>
                
                {newSection.type === 'products' ? (
                    <>
                        <div className="flex gap-4">
                            <button onClick={() => setNewSection({...newSection, selectionMode: 'automated'})} className={`text-[10px] px-3 py-1 rounded-full border ${newSection.selectionMode === 'automated' ? 'border-[#F5C518] text-[#F5C518]' : 'border-[#333]'}`}>كولكشن آلي</button>
                            <button onClick={() => setNewSection({...newSection, selectionMode: 'manual'})} className={`text-[10px] px-3 py-1 rounded-full border ${newSection.selectionMode === 'manual' ? 'border-[#F5C518] text-[#F5C518]' : 'border-[#333]'}`}>اختيار يدوي (Checkbox)</button>
                        </div>

                        {newSection.selectionMode === 'automated' ? (
                            <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value})} className="w-full bg-black border border-[#333] p-3 rounded-xl text-sm">
                                <option value="">-- اختر الكولكشن --</option>
                                {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                <input type="text" placeholder="ابحث عن منتج..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-[#222] p-2 rounded-lg text-xs" />
                                <div className="max-h-48 overflow-y-auto bg-black p-2 rounded-xl border border-[#222] scrollbar-hide">
                                    {filteredProducts.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-[#111] rounded-lg mb-1">
                                            <div className="flex items-center gap-2">
                                                <img src={p.images?.[0] || p.image} className="w-8 h-8 rounded object-cover" />
                                                <span className="text-[10px]">{p.title}</span>
                                            </div>
                                            <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => toggleItem(p.id, 'selectedItems')} className="accent-[#F5C518] w-4 h-4" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-gray-500">تم اختيار: {newSection.selectedItems.length} قطعة</p>
                            </div>
                        )}
                    </>
                ) : (
                    /* اختيار كولكشنات لعرضها كأقسام */
                    <div className="max-h-48 overflow-y-auto bg-black p-2 rounded-xl border border-[#222] scrollbar-hide">
                        {dataLibrary.categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between p-2 hover:bg-[#111] rounded-lg mb-1">
                                <span className="text-[11px] font-bold">{cat}</span>
                                <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="accent-[#F5C518] w-4 h-4" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* خيارات التصميم Layout */}
            <div>
                <label className="text-[10px] text-gray-500 mb-2 block mr-1 uppercase tracking-widest">ستايل العرض (IMDb Style)</label>
                <div className="grid grid-cols-2 gap-2">
                    {(layoutOptions[newSection.type] || []).map(l => (
                        <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} className={`p-4 text-[10px] border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${newSection.layout === l.id ? 'border-[#F5C518] bg-[#F5C518]/5 text-[#F5C518]' : 'border-[#222] grayscale opacity-50'}`}>
                            <span className="text-3xl">{l.icon}</span> 
                            <span className="font-bold">{l.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:bg-[#F5C518] transition-all active:scale-95">
                {editingId ? "تحديث القسم الآن ✓" : "إضافة القسم للهيكل +"}
            </button>
          </div>
        </div>

        {/* === الهيكل الحالي (العمود الأيسر) === */}
        <div className="lg:col-span-7 space-y-4">
            <h2 className="text-sm font-bold opacity-40 uppercase tracking-[0.3em] mb-4 pr-2">Preview Structure</h2>
            
            {sections.length === 0 ? (
                <div className="py-40 text-center border-2 border-dashed border-[#222] rounded-[3rem] text-gray-600 bg-[#121212]">
                    <p className="text-5xl mb-4">🏗️</p>
                    <p className="font-bold">الموقع فارغ.. ابدأ في البناء</p>
                </div>
            ) : (
                sections.map((s, i) => (
                    <div key={s.id} className="bg-[#121212] p-6 rounded-[2rem] border border-[#222] flex justify-between items-center group hover:border-[#F5C518] transition-all">
                        <div className="flex items-center gap-6">
                            <span className="text-4xl font-black text-[#222] group-hover:text-[#F5C518] transition-colors">{i+1}</span>
                            <div>
                                <h3 className="font-black text-lg">{s.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">{s.subTitle}</p>
                                <div className="flex gap-2">
                                    <span className="text-[9px] bg-black px-2 py-1 rounded border border-[#333] text-[#F5C518] font-bold uppercase">{s.layout}</span>
                                    <span className="text-[9px] bg-white/5 px-2 py-1 rounded border border-[#333] text-gray-400">
                                        {s.type === 'products' ? 
                                            (s.selectionMode === 'manual' ? `${s.selectedItems.length} منتجات يدوية` : `كولكشن: ${s.selectedCategory}`) : 
                                            `${s.selectedCollections.length} أقسام مختارة`}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setNewSection(s); setEditingId(s.id); }} className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-blue-500 border border-[#222] hover:border-blue-500 transition-all shadow-lg">✎</button>
                            <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-red-500 border border-[#222] hover:border-red-500 transition-all shadow-lg">✕</button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}