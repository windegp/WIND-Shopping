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
    topBadge: 'وصل حديثاً', // البوكس الأصفر
    type: 'hero', 
    dataSource: '', 
    layout: 'full_screen',
    mediaUrl: '', 
    heroSlides: [],
    buttonText: 'تصفح المجموعة',
    buttonLink: '/collections/all',
    heroHeight: 'h-screen' // الأبعاد الأصلية
  });

  const [tempHeroSlide, setTempHeroSlide] = useState('');

  const layoutOptions = {
    hero: [
        { id: 'full_screen', name: 'الأبعاد الأصلية (WIND Style)', icon: 'pc' },
        { id: 'split_screen', name: 'تصميم منقسم', icon: 'D|' },
    ],
    products: [
      { id: 'grid_default', name: 'شبكة منتجات', icon: 'bb' },
      { id: 'imdb_cards', name: 'كروت IMDb عريضة', icon: '🎫' },
      { id: 'marquee_scroll', name: 'شريط متحرك', icon: '🏃' },
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const cats = new Set(['all', 'new-arrivals']);
        productsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.category) cats.add(data.category);
            if (data.categories) data.categories.forEach(c => cats.add(c));
        });
        setDbData(prev => ({ ...prev, categories: Array.from(cats) }));
        const docSnap = await getDoc(doc(db, "settings", "homePage_v2"));
        if (docSnap.exists()) setSections(docSnap.data().sections || []);
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  const handleAddSection = () => {
    const sectionToAdd = { id: Date.now().toString(), ...newSection };
    setSections([...sections, sectionToAdd]);
    setNewSection({ ...newSection, title: '', subTitle: '', heroSlides: [], mediaUrl: '' });
  };

  const handleSaveToDb = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "settings", "homePage_v2"), { sections, lastUpdate: new Date().toISOString() });
        alert("✅ تم الحفظ! الصفحة الرئيسية اتحدثت.");
    } catch (e) { alert("❌ خطأ: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* لوحة التحكم */}
        <div className="lg:col-span-5 bg-[#1a1a1a] p-6 rounded-xl border border-[#333] h-fit sticky top-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#f5c518] mb-6 flex items-center gap-2"><span>⚙️</span> إدارة أقسام WIND</h2>
            
            <div className="space-y-4">
                {/* النوع */}
                <div className="flex bg-[#222] p-1 rounded-lg border border-[#333]">
                    {['hero', 'products', 'collection'].map(type => (
                        <button key={type} onClick={() => setNewSection({...newSection, type})} className={`flex-1 py-2 text-xs rounded-md ${newSection.type === type ? 'bg-[#f5c518] text-black font-bold' : 'text-gray-400'}`}>
                            {type === 'hero' ? 'الهيرو' : type === 'products' ? 'منتجات' : 'كولكشن'}
                        </button>
                    ))}
                </div>

                {/* حقول مخصصة للهيرو */}
                {newSection.type === 'hero' && (
                    <div className="space-y-3 bg-[#252525] p-4 rounded border border-[#444]">
                        <input value={newSection.topBadge} onChange={e => setNewSection({...newSection, topBadge: e.target.value})} placeholder="نص البوكس الأصفر (وصل حديثاً)" className="w-full bg-[#151515] border border-[#333] p-2 text-xs rounded" />
                        <input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="العنوان الكبير (مجموعة الشتاء)" className="w-full bg-[#151515] border border-[#333] p-2 text-xs rounded" />
                        <input value={newSection.subTitle} onChange={e => setNewSection({...newSection, subTitle: e.target.value})} placeholder="الوصف (تصاميم كلاسيكية...)" className="w-full bg-[#151515] border border-[#333] p-2 text-xs rounded" />
                        <div className="grid grid-cols-2 gap-2">
                            <input value={newSection.buttonText} onChange={e => setNewSection({...newSection, buttonText: e.target.value})} placeholder="نص الزر" className="bg-[#151515] border border-[#333] p-2 text-xs rounded" />
                            <input value={newSection.buttonLink} onChange={e => setNewSection({...newSection, buttonLink: e.target.value})} placeholder="رابط الزر" className="bg-[#151515] border border-[#333] p-2 text-xs rounded" />
                        </div>
                        <select value={newSection.heroHeight} onChange={e => setNewSection({...newSection, heroHeight: e.target.value})} className="w-full bg-[#151515] border border-[#333] p-2 text-xs rounded">
                            <option value="h-screen">الأبعاد الأصلية (ملء الشاشة)</option>
                            <option value="h-[60vh]">أبعاد متوسطة (60%)</option>
                            <option value="h-[400px]">أبعاد ثابتة (مثل القصة)</option>
                        </select>
                    </div>
                )}

                {/* الصور والتصميم */}
                <input value={tempHeroSlide} onChange={e => setTempHeroSlide(e.target.value)} placeholder="ضع رابط الصورة (bbimage)" className="w-full bg-[#222] border border-[#333] p-2 text-xs rounded" dir="ltr" />
                <button onClick={() => { if(tempHeroSlide) setNewSection({...newSection, heroSlides: [...newSection.heroSlides, tempHeroSlide]}); setTempHeroSlide('') }} className="text-[10px] bg-[#333] px-2 py-1 rounded">إضافة للصور +</button>

                <button onClick={handleAddSection} className="w-full bg-[#f5c518] text-black font-black py-3 rounded-lg mt-4">إضافة السيكشن للمعاينة</button>
            </div>
        </div>

        {/* المعاينة والترتيب */}
        <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center border-b border-[#333] pb-4">
                <h2 className="text-2xl font-bold text-white">ترتيب الصفحة</h2>
                <button onClick={handleSaveToDb} className="bg-green-600 px-6 py-2 rounded-lg font-bold text-sm">حفظ التغييرات 💾</button>
            </div>
            {sections.map((s, i) => (
                <div key={s.id} className="bg-[#151515] p-4 rounded-lg border border-[#333] flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-[#f5c518]"></div>
                    <div className="pr-3">
                        <h3 className="font-bold text-gray-200 text-sm">#{i+1} {s.title || 'سيكشن بدون عنوان'}</h3>
                        <p className="text-[10px] text-gray-500 uppercase">{s.type} - {s.heroHeight || s.layout}</p>
                    </div>
                    <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} className="text-red-600 font-bold">✕</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}