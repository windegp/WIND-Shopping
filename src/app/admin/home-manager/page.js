"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // المخازن الحقيقية للبيانات
  const [dataLibrary, setDataLibrary] = useState({
    products: [],
    collections: [],
    pages: [
        { id: 'story', title: 'قصة WIND', type: 'page' },
        { id: 'blog', title: 'المجلة (Blog)', type: 'page' },
        { id: 'reviews', title: 'آراء العملاء', type: 'page' },
    ]
  });

  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null); // للتحكم في عملية التعديل

  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products', // products, collections, pages
    sourceId: '',     // ID المنتج أو الكولكشن المختار
    sourceName: '',   // اسم الشيء المختار للمعاينة
    layout: 'grid_default',
    mediaUrl: ''
  });

  // --- مكتبة تصميمات IMDb و WIND المتقدمة ---
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'الشبكة الكلاسيكية', icon: '▦' },
      { id: 'imdb_top_picks', name: 'IMDb: Top Picks (بوسترات طويلة)', icon: '🍿' },
      { id: 'imdb_fan_fav', name: 'IMDb: Fan Favorites (كروت عريضة)', icon: '⭐' },
      { id: 'slider_elegant', name: 'سلايدر WIND الأنيق', icon: '↔' },
      { id: 'marquee_bold', name: 'شريط متحرك (Trend)', icon: '🏃' }
    ],
    collections: [
        { id: 'imdb_born_today', name: 'IMDb: Born Today (دوائر فئات)', icon: '◯' },
        { id: 'grid_rect', name: 'شبكة مربعات عصرية', icon: '▤' }
    ],
    pages: [
        { id: 'full_banner', name: 'بانر عرض كامل', icon: '▭' },
        { id: 'magazine_split', name: 'تصميم المجلة المنقسم', icon: '◐' }
    ]
  };

  // --- جلب كل شيء من الموقع ---
  useEffect(() => {
    const fetchEverything = async () => {
      setFetching(true);
      try {
        // 1. جلب المنتجات
        const prodsSnap = await getDocs(collection(db, "products"));
        const prods = prodsSnap.docs.map(d => ({ id: d.id, title: d.data().title, type: 'product', img: d.data().images?.[0] }));

        // 2. استخراج الكولكشنات (من التصنيفات)
        const cats = new Set();
        prodsSnap.docs.forEach(d => { if(d.data().category) cats.add(d.data().category); });
        const colls = Array.from(cats).map(c => ({ id: c, title: c, type: 'collection' }));

        setDataLibrary(prev => ({ ...prev, products: prods, collections: colls }));

        // 3. جلب الهيكل الحالي
        const docSnap = await getDoc(doc(db, "settings", "homePage_v2"));
        if (docSnap.exists()) setSections(docSnap.data().sections || []);

      } catch (e) { console.error("Fetch Error:", e); }
      setFetching(false);
    };
    fetchEverything();
  }, []);

  // --- التعامل مع الاختيارات ---
  const handleSourceSelect = (id) => {
    const allData = [...dataLibrary.products, ...dataLibrary.collections, ...dataLibrary.pages];
    const selected = allData.find(item => item.id === id);
    if(selected) {
        setNewSection({ ...newSection, sourceId: selected.id, sourceName: selected.title });
    }
  };

  // --- إضافة أو تحديث سيكشن ---
  const handleAddOrUpdate = () => {
    if(!newSection.title || !newSection.sourceId) return alert("يرجى إكمال العناوين واختيار المحتوى");

    if (editingId) {
        // تحديث سيكشن موجود
        setSections(sections.map(s => s.id === editingId ? { ...newSection, id: editingId } : s));
        setEditingId(null);
    } else {
        // إضافة جديد
        setSections([...sections, { ...newSection, id: Date.now().toString() }]);
    }

    setNewSection({ title: '', subTitle: '', type: 'products', sourceId: '', sourceName: '', layout: 'grid_default', mediaUrl: '' });
  };

  // --- بدء التعديل ---
  const startEdit = (section) => {
    setNewSection(section);
    setEditingId(section.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAll = async () => {
    setLoading(true);
    await setDoc(doc(db, "settings", "homePage_v2"), { sections, lastUpdate: new Date().toISOString() });
    setLoading(false);
    alert("🚀 تم تحديث واجهة المتجر بنجاح!");
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-10 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* اللوحة اليمنى: المحرر */}
        <div className="lg:col-span-5 bg-[#161616] p-6 rounded-2xl border border-[#222] shadow-2xl h-fit sticky top-10">
          <h2 className="text-[#F5C518] text-2xl font-black mb-6 flex items-center gap-3">
            {editingId ? "✏️ تعديل القسم" : "✨ إضافة قسم جديد"}
          </h2>

          <div className="space-y-5">
            {/* العناوين */}
            <div className="space-y-3">
                <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="عنوان القسم (مثلاً: الأكثر مبيعاً)" className="w-full bg-black border border-[#333] p-3 rounded-lg focus:border-[#F5C518] outline-none transition-all" />
                <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي (وصف قصير يظهر أسفل العنوان)" className="w-full bg-black border border-[#333] p-3 rounded-lg text-sm text-gray-400 focus:border-[#F5C518] outline-none" />
            </div>

            {/* نوع الاختيار */}
            <div className="flex bg-black p-1 rounded-xl border border-[#222]">
                {['products', 'collections', 'pages'].map(t => (
                    <button key={t} onClick={() => setNewSection({...newSection, type: t, sourceId: '', sourceName: ''})} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newSection.type === t ? 'bg-[#F5C518] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                        {t === 'products' ? 'منتجات' : t === 'collections' ? 'كولكشنات' : 'صفحات'}
                    </button>
                ))}
            </div>

            {/* القائمة المنسدلة الذكية */}
            <div className="relative">
                <label className="text-[10px] text-gray-500 mb-1 block mr-2">اختر من الموقع المادة المطلوبة:</label>
                <select value={newSection.sourceId} onChange={e => handleSourceSelect(e.target.value)} className="w-full bg-black border border-[#333] p-3 rounded-lg text-sm outline-none focus:border-[#F5C518]">
                    <option value="">-- اضغط للاختيار من القائمة --</option>
                    {newSection.type === 'products' && dataLibrary.products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    {newSection.type === 'collections' && dataLibrary.collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    {newSection.type === 'pages' && dataLibrary.pages.map(pg => <option key={pg.id} value={pg.id}>{pg.title}</option>)}
                </select>
                {newSection.sourceName && (
                    <div className="mt-2 bg-[#F5C518]/10 border border-[#F5C518]/30 p-2 rounded text-[10px] text-[#F5C518] flex items-center justify-between">
                        <span>لقد اخترت: <b>{newSection.sourceName}</b></span>
                        <span className="bg-[#F5C518] text-black px-1 rounded">Checked ✓</span>
                    </div>
                )}
            </div>

            {/* اختيار التصميم */}
            <div>
                <label className="text-[10px] text-gray-500 mb-2 block mr-2">شكل العرض (Layouts):</label>
                <div className="grid grid-cols-2 gap-2">
                    {(layoutOptions[newSection.type] || []).map(layout => (
                        <button key={layout.id} onClick={() => setNewSection({...newSection, layout: layout.id})} 
                        className={`p-3 text-[10px] text-right border rounded-xl flex items-center gap-3 transition-all ${newSection.layout === layout.id ? 'border-[#F5C518] bg-[#F5C518]/5' : 'border-[#222] opacity-50'}`}>
                            <span className="text-xl">{layout.icon}</span>
                            <span>{layout.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddOrUpdate} className={`w-full font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 ${editingId ? 'bg-blue-600 text-white' : 'bg-[#F5C518] text-black'}`}>
                {editingId ? "تحديث التغييرات" : "إضافة القسم للقائمة"}
            </button>
            {editingId && <button onClick={() => {setEditingId(null); setNewSection({title: '', subTitle: '', type: 'products', sourceId: '', sourceName: '', layout: 'grid_default', mediaUrl: ''})}} className="w-full text-xs text-gray-500 mt-2 hover:underline">إلغاء التعديل</button>}
          </div>
        </div>

        {/* اللوحة اليسرى: الهيكل والترتيب */}
        <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center bg-[#161616] p-4 rounded-2xl border border-[#222]">
                <div>
                    <h2 className="text-xl font-black">هيكل الصفحة الرئيسية</h2>
                    <p className="text-[10px] text-gray-500 italic">يمكنك السحب والإفلات للترتيب (قريباً)</p>
                </div>
                <button onClick={handleSaveAll} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all">
                    {loading ? "جاري الحفظ..." : "حفظ الترتيب النهائي 💾"}
                </button>
            </div>

            {fetching ? (
                <div className="text-center py-20 text-[#F5C518] animate-pulse">جاري فحص محتويات الموقع...</div>
            ) : sections.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-[#222] rounded-3xl text-gray-600">
                    لا توجد أقسام مضافة.. ابدأ بالبناء من اليمين
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div key={section.id} className="bg-[#161616] p-5 rounded-2xl border border-[#222] flex justify-between items-center group hover:border-[#F5C518] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#F5C518] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-5">
                                <span className="text-2xl font-black text-gray-800">0{index + 1}</span>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-100">{section.title}</h3>
                                    <p className="text-[10px] text-[#F5C518] mb-1">{section.subTitle}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[9px] bg-black px-2 py-0.5 rounded border border-[#333] text-gray-400 uppercase">{section.type}</span>
                                        <span className="text-[9px] bg-black px-2 py-0.5 rounded border border-[#333] text-gray-400 uppercase">{section.layout}</span>
                                        <span className="text-[9px] text-blue-400">🔗 {section.sourceName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(section)} className="bg-[#222] hover:bg-blue-900/40 text-blue-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✎</button>
                                <button onClick={() => setSections(sections.filter(x => x.id !== section.id))} className="bg-[#222] hover:bg-red-900/40 text-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
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