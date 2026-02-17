"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState({ categories: [], pages: [
    { name: 'قصة WIND', value: 'story' },
    { name: 'المقالات', value: 'blog' },
    { name: 'التقييمات', value: 'reviews' }
  ]});
  const [sections, setSections] = useState([]);

  // الحالة للقسم الجديد
  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products', 
    dataSource: '', 
    layout: 'grid_default',
    mediaUrl: '', // رابط الصورة من bbimage
    heroSlides: [],
    heroHeight: 'screen', // screen (الأبعاد الأصلية), 400px, 600px
    buttonText: 'اكتشف المزيد',
    buttonLink: '#'
  });

  const [tempHeroSlide, setTempHeroSlide] = useState('');

  // مكتبة التصميمات (Layouts) - تشمل تصاميم IMDb
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'شبكة تقليدية', icon: '▦' },
      { id: 'imdb_style_1', name: 'IMDb: كارت عريض', icon: '▬' },
      { id: 'imdb_style_2', name: 'IMDb: قائمة عمودية', icon: '≡' },
      { id: 'marquee_bold', name: 'شريط متحرك عريض', icon: '↔' }
    ],
    hero: [
      { id: 'original_hero', name: 'التصميم الأصلي (نصوص بالمنتصف)', icon: '◈' },
      { id: 'side_hero', name: 'تصميم جانبي', icon: '◧' }
    ],
    collection: [
        { id: 'rect_cards', name: 'كروت IMDb للفئات', icon: '▮' }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      // جلب التصنيفات الحقيقية من المنتجات
      const querySnapshot = await getDocs(collection(db, "products"));
      const cats = new Set();
      querySnapshot.docs.forEach(doc => {
        if(doc.data().category) cats.add(doc.data().category);
        if(doc.data().categories) doc.data().categories.forEach(c => cats.add(c));
      });
      setDbData(prev => ({ ...prev, categories: Array.from(cats) }));

      // جلب البيانات المخزنة للوحة الجديدة (V3 لتكون مستقلة تماماً)
      const docSnap = await getDoc(doc(db, "settings", "home_v3_standalone"));
      if (docSnap.exists()) setSections(docSnap.data().sections || []);
    };
    fetchData();
  }, []);

  const handleAddHeroSlide = () => {
    if(tempHeroSlide) {
        setNewSection({...newSection, heroSlides: [...newSection.heroSlides, tempHeroSlide]});
        setTempHeroSlide('');
    }
  };

  const handleAddSection = () => {
    setSections([...sections, { ...newSection, id: Date.now().toString() }]);
    setNewSection({ ...newSection, title: '', subTitle: '', heroSlides: [], mediaUrl: '' });
  };

  const saveLayout = async () => {
    setLoading(true);
    await setDoc(doc(db, "settings", "home_v3_standalone"), { sections });
    setLoading(false);
    alert("تم حفظ التصميم الجديد في اللوحة!");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* اللوحة اليمنى: المدخلات */}
        <div className="w-full md:w-1/2 bg-[#141414] p-6 rounded-xl border border-[#222]">
          <h2 className="text-[#F5C518] text-xl font-black mb-6">إضافة سيكشن جديد</h2>
          
          <div className="space-y-4">
            {/* النوع */}
            <div className="flex gap-2 bg-black p-1 rounded-lg">
                {['hero', 'products', 'collection', 'pages'].map(t => (
                    <button key={t} onClick={() => setNewSection({...newSection, type: t})} 
                    className={`flex-1 py-2 text-xs rounded ${newSection.type === t ? 'bg-[#F5C518] text-black font-bold' : 'text-gray-400'}`}>
                        {t === 'hero' ? 'هيرو' : t === 'products' ? 'منتجات' : t === 'collection' ? 'كولكشن' : 'صفحة'}
                    </button>
                ))}
            </div>

            {/* مدخلات الهيرو */}
            {newSection.type === 'hero' ? (
                <div className="space-y-3 bg-[#1a1a1a] p-4 rounded-lg">
                    <label className="text-xs text-gray-500">أبعاد الهيرو</label>
                    <select value={newSection.heroHeight} onChange={e => setNewSection({...newSection, heroHeight: e.target.value})} className="w-full bg-black border border-[#333] p-2 rounded text-sm">
                        <option value="screen">ملء الشاشة (Original)</option>
                        <option value="400px">400px (مثل القصة)</option>
                        <option value="600px">600px (متوسط)</option>
                    </select>
                    <input value={tempHeroSlide} onChange={e => setTempHeroSlide(e.target.value)} placeholder="رابط صورة (bbimage)" className="w-full bg-black border border-[#333] p-2 rounded text-sm" />
                    <button onClick={handleAddHeroSlide} className="text-xs bg-[#333] px-4 py-1 rounded">إضافة صورة للسلايدر</button>
                    <div className="flex gap-2">
                        {newSection.heroSlides.map((s,i) => <img key={i} src={s} className="w-10 h-10 object-cover rounded border border-[#F5C518]" />)}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="العنوان الرئيسي" className="w-full bg-black border border-[#333] p-2 rounded text-sm" />
                    <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="العنوان الفرعي" className="w-full bg-black border border-[#333] p-2 rounded text-sm" />
                    <select value={newSection.dataSource} onChange={e => setNewSection({...newSection, dataSource: e.target.value})} className="w-full bg-black border border-[#333] p-2 rounded text-sm">
                        <option value="">اختر مصدر البيانات</option>
                        {newSection.type === 'products' && dbData.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        {newSection.type === 'pages' && dbData.pages.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                    </select>
                </div>
            )}

            {/* التصميم Layout */}
            <div>
                <label className="text-xs text-gray-500 mb-2 block">اختر التصميم (Layout Style)</label>
                <div className="grid grid-cols-2 gap-2">
                    {(layoutOptions[newSection.type === 'hero' ? 'hero' : (newSection.type === 'collection' ? 'collection' : 'products')] || []).map(l => (
                        <button key={l.id} onClick={() => setNewSection({...newSection, layout: l.id})} 
                        className={`p-3 text-[10px] border rounded ${newSection.layout === l.id ? 'border-[#F5C518] bg-[#F5C518]/10' : 'border-[#333]'}`}>
                            {l.name}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleAddSection} className="w-full bg-[#F5C518] text-black font-black py-3 rounded-lg shadow-lg hover:scale-95 transition-transform">
                إضافة السيكشن للمعاينة
            </button>
          </div>
        </div>

        {/* اللوحة اليسرى: المعاينة والترتيب */}
        <div className="w-full md:w-1/2 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black">هيكل الواجهة الجديد</h2>
                <button onClick={saveLayout} className="bg-green-600 px-6 py-2 rounded-full text-sm font-bold">{loading ? 'جاري الحفظ...' : 'حفظ الهيكل 💾'}</button>
            </div>
            
            {sections.length === 0 && <p className="text-gray-500 text-center py-20 border border-dashed border-[#333] rounded-xl">لا توجد أقسام مضافة بعد</p>}
            
            <div className="space-y-2">
                {sections.map((s, i) => (
                    <div key={s.id} className="bg-[#1a1a1a] p-4 rounded-lg flex justify-between items-center border-r-4 border-[#F5C518]">
                        <div>
                            <p className="font-bold text-sm">{s.title || (s.type === 'hero' ? 'WIND Hero Slider' : 'بدون عنوان')}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{s.type} - {s.layout}</p>
                        </div>
                        <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="text-red-500">✕</button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}