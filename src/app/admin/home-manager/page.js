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
    
    return (
      <div className="w-full bg-[#151515] rounded-3xl p-6 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] space-y-5 overflow-hidden transition-all duration-300 group hover:border-[#F5C518]/30">
        <div className="flex items-center justify-between px-2" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm shadow-[0_0_10px_rgba(245,197,24,0.4)]"></div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">{title || "عنوان القسم"}</h2>
              {subTitle && <p className="text-gray-400 text-[10px] mt-1 font-normal">{subTitle}</p>}
            </div>
          </div>
          <div className="text-[#F5C518] text-xs font-bold flex items-center gap-1 opacity-80">
            عرض الكل <span className="text-lg leading-none">›</span>
          </div>
        </div>

        <div className="px-1 min-h-[140px] flex flex-col justify-center relative">
            {/* 1. ستايل الأكثر مبيعاً */}
            {layout === 'bestseller_split' && (
                <div className="flex gap-3 h-40 w-full">
                    <div className="w-1/3 bg-[#222] border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-2 right-2 bg-[#F5C518] px-2 py-0.5 text-[8px] text-black font-black rounded z-10">TOP</div>
                        <span className="text-white/10 text-4xl font-black">1</span>
                    </div>
                    <div className="w-2/3 grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-[#222] rounded-xl border border-white/5 relative"><div className="absolute bottom-2 right-2 w-8 h-1 bg-white/10 rounded-full"></div></div>)}
                    </div>
                </div>
            )}
            {/* 2. ستايل الماركي */}
            {layout === 'infinite_marquee' && (
                <div className="py-4 border-y border-white/5 flex gap-3 overflow-hidden opacity-80">
                    <div className="flex gap-3 w-full justify-center">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="min-w-[90px] aspect-[3/4] bg-[#222] rounded-xl border border-white/5 flex flex-col justify-end p-2">
                                <div className="w-full h-1 bg-white/20 rounded-full mb-1"></div>
                                <div className="w-1/2 h-1 bg-[#F5C518]/50 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* 3. شريط الثقة */}
            {layout === 'trust_bar' && (
                <div className="bg-[#1a1a1a] py-6 border-y border-white/10 flex justify-evenly items-center px-4 rounded-xl">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-[#F5C518] text-xs font-black">★</div>
                            <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )}
            {/* 4. المجلة */}
            {layout === 'magazine_grid' && (
                <div className="grid grid-cols-2 gap-3 h-36">
                    <div className="bg-[#222] rounded-2xl relative overflow-hidden border border-white/5 group"><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div><div className="absolute bottom-3 right-3 w-16 h-2 bg-[#F5C518] rounded-sm mb-2"></div><div className="absolute bottom-8 right-3 w-3/4 h-2 bg-white/50 rounded-sm"></div></div>
                    <div className="bg-[#222] rounded-2xl relative overflow-hidden border border-white/5 group"><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div><div className="absolute bottom-3 right-3 w-16 h-2 bg-[#F5C518] rounded-sm mb-2"></div><div className="absolute bottom-8 right-3 w-3/4 h-2 bg-white/50 rounded-sm"></div></div>
                </div>
            )}
            {/* 5. الآراء */}
            {layout === 'review_marquee' && (
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="min-w-[160px] bg-[#222] p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#F5C518] flex items-center justify-center text-black text-[8px] font-bold">U</div><div className="w-10 h-1.5 bg-white/30 rounded-full"></div></div>
                            <div className="w-full h-8 bg-black/40 rounded-lg border border-white/5"></div>
                        </div>
                    ))}
                </div>
            )}
            {/* 6. القصة */}
            {layout === 'story_banner' && (
                <div className="h-40 bg-[#111] rounded-[2rem] flex flex-col items-center justify-center p-6 text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-black to-black"></div>
                    <div className="text-[#F5C518] text-xl font-black mb-2 italic tracking-tighter relative z-10">OUR STORY</div>
                    <div className="w-3/4 h-1.5 bg-white/20 rounded-full mb-2 relative z-10"></div>
                </div>
            )}
            {/* 7. شبكة افتراضية */}
            {layout === 'grid_default' && (
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#222] rounded-xl border border-white/5 flex flex-col justify-end p-2"><div className="w-full h-1 bg-white/10 rounded-full"></div></div>)}
                </div>
            )}
            {/* 8. بوسترات */}
            {layout === 'imdb_posters' && (
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(5)].map((_, i) => <div key={i} className="min-w-[90px] aspect-[2/3] bg-[#222] rounded-2xl border border-white/5 relative shadow-lg"><div className="absolute bottom-2 right-2 w-8 h-1.5 bg-[#F5C518]/30 rounded-full"></div></div>)}
                </div>
            )}
            {/* 9. بنتو */}
             {layout === 'bento_modern' && (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-40">
                    <div className="col-span-2 row-span-2 bg-[#222] rounded-3xl border border-white/5 relative overflow-hidden flex items-end p-3"><div className="w-1/2 h-2 bg-white/50 rounded-full"></div></div>
                    <div className="col-span-2 row-span-1 bg-[#222] rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-[#222] rounded-3xl border border-white/5"></div>
                    <div className="col-span-1 row-span-1 bg-[#F5C518] rounded-3xl flex items-center justify-center text-black font-black text-[8px] border border-[#F5C518]">WIND</div>
                </div>
            )}
            {/* 10. تخفيضات */}
            {layout === 'sale_grid' && (
                <div className="space-y-3">
                    <div className="w-full h-8 bg-[#F5C518] rounded-lg flex items-center justify-center text-black font-black text-[10px] uppercase">Limited Time Offer</div>
                    <div className="grid grid-cols-4 gap-2">{[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-[#222] rounded-lg border border-white/5"></div>)}</div>
                </div>
            )}
            {/* 11. دوائر */}
            {layout === 'circle_avatars' && (
                <div className="flex justify-center gap-4 py-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-[#222] border-2 border-white/10"></div><div className="w-8 h-1 bg-white/20 rounded-full"></div></div>)}
                </div>
            )}
            {/* 12. بانرات مستطيلة */}
            {layout === 'rect_banners' && (
                <div className="grid grid-cols-2 gap-3 h-24">{[...Array(2)].map((_, i) => <div key={i} className="bg-[#222] rounded-xl border border-white/5"></div>)}</div>
            )}
        </div>
      </div>
    );
  };

  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'أحدث الصيحات (شبكة عادية)', icon: '▦' },
      { id: 'infinite_marquee', name: 'شريط متحرك لانهائي', icon: '🏃' },
      { id: 'bestseller_split', name: 'الأكثر مبيعاً (مميز)', icon: '🏆' },
      { id: 'sale_grid', name: 'تخفيضات (شريط أصفر)', icon: '🏷️' },
      { id: 'imdb_posters', name: 'بوسترات طولية (IMDb)', icon: '🎬' },
      { id: 'bento_modern', name: 'تصميم هندسي (Bento)', icon: '🍱' },
    ],
    collections_list: [
        { id: 'circle_avatars', name: 'أقسام دائرية', icon: '◯' },
        { id: 'rect_banners', name: 'بانرات عريضة', icon: '▭' },
        { id: 'trust_bar', name: 'شريط الثقة والضمان', icon: '🛡️' },
        { id: 'review_marquee', name: 'آراء العملاء', icon: '💬' },
        { id: 'magazine_grid', name: 'المجلة والمقالات', icon: '📖' },
        { id: 'story_banner', name: 'قصة البراند', icon: '📜' },
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
            // !!! هذا هو السطر السحري: إذا لم يجد بيانات، يستخدم القالب الافتراضي !!!
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
    <div className="min-h-screen bg-[#050505] text-white p-6 font-cairo" dir="rtl">
        
        {/* --- Header Bar --- */}
        <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-10 bg-[#111] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#F5C518] rounded-2xl flex items-center justify-center text-black text-2xl font-black">W</div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase">WIND Admin</h1>
                    <p className="text-[10px] text-gray-500 font-bold">Layout Architect v7.0</p>
                </div>
            </div>
            <button onClick={async () => { setLoading(true); await setDoc(doc(db, "settings", "homePage_v2"), { sections }); setLoading(false); alert("✅ تم حفظ الهيكل ونشره في الموقع!"); }} 
                className="bg-[#F5C518] text-black px-10 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl hover:shadow-[#F5C518]/20">
                {loading ? "جاري الحفظ..." : "نشر التعديلات 🚀"}
            </button>
        </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* === التحكم (Sticky Sidebar) === */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 sticky top-6">
            <h2 className="text-lg font-black text-[#F5C518] uppercase flex items-center gap-2">
                <span className="w-2 h-6 bg-[#F5C518] rounded-full"></span>
                إعدادات القسم
            </h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold">العنوان الرئيسي</label>
                    <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="مثلاً: الأكثر مبيعاً" className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-sm outline-none font-bold focus:border-[#F5C518] transition-colors" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold">العنوان الفرعي</label>
                    <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="وصف قصير..." className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-sm opacity-80 outline-none focus:border-[#F5C518] transition-colors" />
                </div>
            </div>

            <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-[#222]">
                <button onClick={() => setNewSection({...newSection, type: 'products'})} className={`flex-1 py-3 text-xs rounded-xl font-black transition-all ${newSection.type === 'products' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>منتجات</button>
                <button onClick={() => setNewSection({...newSection, type: 'collections_list'})} className={`flex-1 py-3 text-xs rounded-xl font-black transition-all ${newSection.type === 'collections_list' ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500'}`}>محتوى عام</button>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">اختر التصميم (Layout)</label>
                <div className="relative">
                    <select value={newSection.layout} onChange={e => setNewSection({...newSection, layout: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-sm font-bold text-white focus:border-[#F5C518] transition-all outline-none appearance-none cursor-pointer">
                        {(layoutOptions[newSection.type] || []).map(l => (
                            <option key={l.id} value={l.id} className="bg-[#111] py-2">{l.icon} ➖ {l.name}</option>
                        ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F5C518] pointer-events-none text-xs">▼</div>
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-[#F5C518] uppercase">معاينة فورية</label>
                <WINDVisualMockup section={newSection} />
            </div>

            <div className="bg-[#0a0a0a] p-5 rounded-[2rem] border border-[#222] space-y-4">
                {newSection.type === 'products' ? (
                    <div className="space-y-3">
                        <select value={newSection.selectedCategory} onChange={e => setNewSection({...newSection, selectedCategory: e.target.value, selectionMode: 'automated'})} className="w-full bg-[#111] border border-[#333] p-3 rounded-xl text-xs font-bold text-[#F5C518] outline-none">
                            <option value="">-- اختيار آلي (حسب القسم) --</option>
                            {dataLibrary.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                            {dataLibrary.products.map(p => (
                                <label key={p.id} className="flex items-center justify-between p-2.5 bg-[#151515] rounded-xl border border-[#333] cursor-pointer hover:border-[#F5C518]/50 transition-all">
                                    <span className="text-[10px] font-bold truncate w-4/5">{p.title}</span>
                                    <input type="checkbox" checked={newSection.selectedItems.includes(p.id)} onChange={() => { toggleItem(p.id, 'selectedItems'); setNewSection(prev => ({...prev, selectionMode: 'manual'})); }} className="w-3.5 h-3.5 accent-[#F5C518]" />
                                </label>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                        {dataLibrary.categories.map(cat => (
                            <label key={cat} className={`p-3 rounded-xl border text-[10px] font-bold text-center cursor-pointer transition-all ${newSection.selectedCollections.includes(cat) ? 'bg-[#F5C518]/20 border-[#F5C518] text-white' : 'bg-[#151515] border-[#333] text-gray-500'}`}>
                                {cat}
                                <input type="checkbox" checked={newSection.selectedCollections.includes(cat)} onChange={() => toggleItem(cat, 'selectedCollections')} className="sr-only" />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={handleAddOrUpdate} className="w-full bg-white text-black font-black py-5 rounded-2xl text-xs uppercase tracking-widest hover:bg-[#F5C518] transition-all active:scale-95 shadow-lg">
                {editingId ? "تحديث القسم ✓" : "إضافة القسم +"}
            </button>
          </div>
        </div>

        {/* === المعاينة الحية للهيكل (Live Stage) === */}
        <div className="xl:col-span-7 space-y-8">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] pr-2">الهيكل الحالي للصفحة</h2>
            {sections.length === 0 ? (
                <div className="py-32 text-center border-2 border-dashed border-[#222] rounded-[3rem] text-gray-700 font-bold italic">
                    جاري تحميل الهيكل الافتراضي...
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-20">
                    {sections.map((s, i) => (
                        <div key={s.id} className="relative group pl-12">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                                <button onClick={() => { setNewSection(s); setEditingId(s.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="w-10 h-10 bg-[#222] text-white border border-[#333] rounded-full flex items-center justify-center hover:bg-[#F5C518] hover:text-black transition-all hover:scale-110">✎</button>
                                <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="w-10 h-10 bg-[#222] text-red-500 border border-[#333] rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all hover:scale-110">✕</button>
                            </div>
                            <div className="bg-[#111] p-2 rounded-[2.5rem] border border-[#222] transition-all hover:border-[#F5C518]/30">
                                <div className="text-[9px] text-gray-600 font-bold px-6 py-2 uppercase flex justify-between">
                                    <span>ORDER #{i+1}</span>
                                    <span>{s.layout}</span>
                                </div>
                                <WINDVisualMockup section={s} />
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
      `}</style>
    </div>
  );
}