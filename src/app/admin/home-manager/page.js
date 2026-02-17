"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState({ categories: [], staticPages: [
    { name: 'قصة WIND', value: 'story' },
    { name: 'المقالات', value: 'blog' },
    { name: 'التقييمات', value: 'reviews' }
  ]});
  const [sections, setSections] = useState([]);

  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products', // حذفنا الهيرو من هنا
    dataSource: '', 
    layout: 'grid_default',
    mediaUrl: ''
  });

  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'شبكة منتجات', icon: '▦' },
      { id: 'slider_row', name: 'شريط سحب', icon: '↔' },
      { id: 'imdb_cards', name: 'IMDb (كروت عريضة)', icon: '🎫' },
      { id: 'marquee_scroll', name: 'شريط متحرك', icon: '🏃' },
    ],
    collection: [
        { id: 'grid_default', name: 'شبكة كولكشن', icon: '▦' },
        { id: 'slider_row', name: 'سلايدر كولكشن', icon: '↔' }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
        const querySnapshot = await getDocs(collection(db, "products"));
        const cats = new Set(['all', 'new-arrivals']);
        querySnapshot.docs.forEach(doc => {
            if(doc.data().category) cats.add(doc.data().category);
        });
        setDbData(prev => ({ ...prev, categories: Array.from(cats) }));
        const docSnap = await getDoc(doc(db, "settings", "homePage_v2"));
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
    };
    fetchData();
  }, []);

  const handleAddSection = () => {
    if(!newSection.title || !newSection.dataSource) return alert("اكمل البيانات أولاً");
    setSections([...sections, { ...newSection, id: Date.now().toString() }]);
    setNewSection({ ...newSection, title: '', subTitle: '', mediaUrl: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    await setDoc(doc(db, "settings", "homePage_v2"), { sections, lastUpdate: new Date().toISOString() });
    setLoading(false);
    alert("✅ تم التحديث بنجاح!");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* التحكم */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h2 className="text-[#f5c518] font-black mb-6">إضافة قسم أسفل الهيرو</h2>
          <div className="space-y-4">
            <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="عنوان القسم" className="w-full bg-black border border-[#333] p-2 rounded" />
            <select value={newSection.dataSource} onChange={e => setNewSection({...newSection, dataSource: e.target.value})} className="w-full bg-black border border-[#333] p-2 rounded">
                <option value="">اختر مصدر المنتجات</option>
                {dbData.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
                {layoutOptions.products.map(l => (
                    <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} className={`p-2 border rounded text-xs ${newSection.layout === l.id ? 'border-[#f5c518] text-[#f5c518]' : 'border-[#333]'}`}>
                        {l.name}
                    </button>
                ))}
            </div>
            <button onClick={handleAddSection} className="w-full bg-[#f5c518] text-black font-black py-3 rounded mt-4">إضافة السيكشن للقائمة</button>
          </div>
        </div>

        {/* الترتيب */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-bold">الأقسام الحالية</h2>
                <button onClick={handleSave} className="bg-green-600 px-6 py-2 rounded font-bold text-sm">{loading ? 'جاري الحفظ...' : 'حفظ الهيكل 💾'}</button>
            </div>
            {sections.map((s, i) => (
                <div key={s.id} className="bg-[#151515] p-4 rounded border border-[#333] flex justify-between">
                    <span>{i+1}. {s.title} ({s.layout})</span>
                    <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="text-red-500">✕</button>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}