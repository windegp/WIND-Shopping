"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  
  // هذه الحالة ستحمل البيانات الحقيقية من قاعدة البيانات
  const [dbData, setDbData] = useState({ 
    categories: [], // للأقسام المستخرجة من المنتجات
    staticPages: [ // صفحات ثابتة في موقعك
        { name: 'قصة WIND (Story)', value: 'story' },
        { name: 'المقالات (Blog)', value: 'blog' },
        { name: 'التقييمات (Reviews)', value: 'reviews' },
        { name: 'اتصل بنا (Contact)', value: 'contact' }
    ] 
  }); 

  const [sections, setSections] = useState([]); // الأقسام المضافة في الصفحة

  // إعدادات القسم الجديد
  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products', // products, collection, pages, hero
    dataSource: '', // هنا سنخزن اسم القسم أو الكولكشن المختار
    layout: 'grid_default',
    mediaUrl: '', 
    heroSlides: [] 
  });

  const [tempHeroSlide, setTempHeroSlide] = useState('');

  // --- 1. خيارات التصميم (Layouts) ---
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'شبكة منتجات (Grid)', icon: 'bb' },
      { id: 'slider_row', name: 'شريط سحب (Slider)', icon: '↔️' },
      { id: 'marquee_scroll', name: 'شريط متحرك (Marquee)', icon: '🏃' },
      { id: 'imdb_cards', name: 'كروت عريضة (IMDb)', icon: '🎫' },
      { id: 'masonry_wall', name: 'شبكة (Pinterest)', icon: '🧱' },
    ],
    collection: [
        { id: 'circle_row', name: 'دوائر (Stories)', icon: 'DQ' },
        { id: 'rect_cards', name: 'كروت بوسترات', icon: 'cj' },
    ],
    pages: [
        { id: 'full_width', name: 'عرض كامل', icon: 'PC' },
        { id: 'card_view', name: 'كارت تعريفي', icon: '[]' },
    ],
    hero: [
        { id: 'full_screen', name: 'شاشة كاملة', icon: 'pc' },
        { id: 'split_screen', name: 'منقسم', icon: 'D|' },
    ]
  };

  // --- 2. جلب البيانات الحقيقية من Firebase ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // أ) جلب المنتجات لاستخراج الأقسام منها
        const productsSnapshot = await getDocs(collection(db, "products"));
        const extractedCategories = new Set(['all', 'new-arrivals']); // إضافة أقسام افتراضية
        
        productsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // لو المنتج له حقل category
            if (data.category) extractedCategories.add(data.category);
            // لو المنتج له مصفوفة categories
            if (data.categories && Array.isArray(data.categories)) {
                data.categories.forEach(c => extractedCategories.add(c));
            }
        });

        // تحديث القوائم بالبيانات الحقيقية
        setDbData(prev => ({
            ...prev,
            categories: Array.from(extractedCategories)
        }));

        // ب) جلب هيكل الصفحة المحفوظ
        const docRef = doc(db, "settings", "homePage_v2");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSections(docSnap.data().sections || []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        alert("تنبيه: تأكد من اتصال الإنترنت وقواعد Firebase");
      }
    };
    fetchData();
  }, []);

  // --- 3. دوال التحكم ---

  const handleAddHeroSlide = () => {
    if(!tempHeroSlide) return;
    setNewSection({...newSection, heroSlides: [...newSection.heroSlides, tempHeroSlide]});
    setTempHeroSlide('');
  };

  const handleAddSection = () => {
    // التحقق من صحة البيانات
    if (newSection.type !== 'hero' && !newSection.title) return alert("الرجاء كتابة عنوان للقسم");
    if (newSection.type === 'products' && !newSection.dataSource) return alert("الرجاء اختيار مصدر المنتجات (Data Source)");

    const sectionToAdd = {
        id: Date.now().toString(),
        ...newSection
    };

    setSections([...sections, sectionToAdd]);
    // إعادة تعيين النموذج
    setNewSection({ ...newSection, title: '', subTitle: '', dataSource: '', mediaUrl: '', heroSlides: [] });
  };

  const handleSaveToDb = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "settings", "homePage_v2"), { 
            sections: sections,
            lastUpdate: new Date().toISOString()
        });
        alert("✅ تم الحفظ! البيانات الآن متاحة للصفحة الرئيسية.");
    } catch (e) {
        alert("❌ خطأ: " + e.message);
    }
    setLoading(false);
  };

  const handleDelete = (id) => {
    if(confirm("حذف هذا القسم؟")) setSections(sections.filter(s => s.id !== id));
  };

  // دالة مساعدة لتحديد القائمة المناسبة حسب النوع
  const getDataSourceOptions = () => {
      if (newSection.type === 'products') return dbData.categories;
      if (newSection.type === 'collection') return dbData.categories; // الكولكشن عادة هو نفسه القسم
      if (newSection.type === 'pages') return dbData.staticPages;
      return [];
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === اللوحة اليمنى: التحكم (4 أعمدة) === */}
        <div className="lg:col-span-5 bg-[#1a1a1a] p-6 rounded-xl border border-[#333] h-fit sticky top-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#f5c518] mb-6 flex items-center gap-2">
                <span>⚙️</span> إنشاء قسم جديد
            </h2>
            
            <div className="space-y-5">
                {/* 1. نوع المحتوى */}
                <div>
                    <label className="text-[11px] text-gray-400 mb-2 block font-bold">نوع المحتوى</label>
                    <div className="flex bg-[#222] p-1 rounded-lg border border-[#333]">
                        {['products', 'collection', 'pages', 'hero'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setNewSection({...newSection, type, dataSource: ''})} // تصفير المصدر عند تغيير النوع
                                className={`flex-1 py-2 text-xs rounded-md transition-all ${newSection.type === type ? 'bg-[#f5c518] text-black font-bold shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                {type === 'products' ? 'منتجات' : type === 'collection' ? 'كولكشن' : type === 'pages' ? 'صفحات' : 'Hero'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. بيانات القسم (تتغير حسب النوع) */}
                {newSection.type === 'hero' ? (
                    <div className="bg-[#252525] p-4 rounded border border-[#444] animate-fade-in">
                        <label className="text-[10px] text-[#f5c518] mb-1 block">صور السلايدر (RULs)</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                value={tempHeroSlide}
                                onChange={(e) => setTempHeroSlide(e.target.value)}
                                placeholder="https://image-link.com/photo.jpg"
                                className="flex-1 bg-[#151515] border border-[#333] p-2 text-xs text-white rounded outline-none focus:border-[#f5c518]"
                                dir="ltr"
                            />
                            <button onClick={handleAddHeroSlide} className="bg-[#333] hover:bg-[#555] text-white px-3 rounded font-bold">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newSection.heroSlides.map((slide, i) => (
                                <div key={i} className="relative w-12 h-8 bg-black rounded overflow-hidden border border-gray-600 group">
                                    <img src={slide} className="w-full h-full object-cover opacity-70" />
                                    <button onClick={() => setNewSection({...newSection, heroSlides: newSection.heroSlides.filter((_, idx) => idx !== i)})} className="absolute inset-0 flex items-center justify-center bg-black/50 text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">العنوان</label>
                                <input 
                                    value={newSection.title} 
                                    onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                                    className="w-full bg-[#222] border border-[#333] p-2.5 text-sm rounded focus:border-[#f5c518] outline-none placeholder-gray-600" 
                                    placeholder="مثلاً: الأكثر مبيعاً"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">وصف (اختياري)</label>
                                <input 
                                    value={newSection.subTitle} 
                                    onChange={(e) => setNewSection({...newSection, subTitle: e.target.value})}
                                    className="w-full bg-[#222] border border-[#333] p-2.5 text-sm rounded focus:border-[#f5c518] outline-none placeholder-gray-600" 
                                    placeholder="شعار بسيط..."
                                />
                            </div>
                        </div>

                        {/* القائمة المنسدلة الذكية */}
                        <div>
                            <label className="text-[10px] text-[#f5c518] mb-1 block font-bold">
                                {newSection.type === 'products' ? 'اختر القسم لعرض منتجاته' : 
                                 newSection.type === 'collection' ? 'اختر الكولكشن' : 'اختر الصفحة'}
                            </label>
                            <select 
                                value={newSection.dataSource}
                                onChange={(e) => setNewSection({...newSection, dataSource: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] p-2.5 text-sm rounded focus:border-[#f5c518] outline-none text-white"
                            >
                                <option value="">-- اختر --</option>
                                {getDataSourceOptions().map((item) => (
                                    <option key={item.value || item} value={item.value || item}>
                                        {item.name || item}
                                    </option>
                                ))}
                            </select>
                            {dbData.categories.length === 0 && (
                                <p className="text-[9px] text-red-400 mt-1">* جاري تحميل الأقسام من المنتجات...</p>
                            )}
                        </div>

                        {/* صورة مخصصة */}
                        <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">صورة بانر مخصصة (رابط مباشر)</label>
                            <input 
                                value={newSection.mediaUrl}
                                onChange={(e) => setNewSection({...newSection, mediaUrl: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] p-2 text-xs rounded focus:border-[#f5c518] outline-none text-left font-mono text-gray-400" 
                                placeholder="https://i.ibb.co/..."
                                dir="ltr"
                            />
                        </div>
                    </div>
                )}

                {/* 3. اختيار التصميم */}
                <div className="pt-2 border-t border-[#333]">
                    <label className="text-[10px] text-gray-400 mb-2 block">اختر شكل العرض (Layout)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(layoutOptions[newSection.type] || []).map(layout => (
                            <button 
                                key={layout.id}
                                onClick={() => setNewSection({...newSection, layout: layout.id})}
                                className={`p-2 rounded border text-center transition-all ${newSection.layout === layout.id ? 'bg-[#f5c518]/10 border-[#f5c518] text-[#f5c518]' : 'bg-[#222] border-[#333] text-gray-500 hover:bg-[#2a2a2a]'}`}
                            >
                                <div className="text-xl mb-1 filter grayscale opacity-80">{layout.icon}</div>
                                <div className="text-[9px] font-bold">{layout.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleAddSection}
                    className="w-full bg-gradient-to-r from-[#f5c518] to-[#ffdb4d] text-black font-black py-3 rounded-lg mt-2 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
                >
                    + إضافة إلى الصفحة
                </button>
            </div>
        </div>

        {/* === اللوحة اليسرى: المعاينة (Live Preview) === */}
        <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-end border-b border-[#333] pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">ترتيب الصفحة الرئيسية</h2>
                    <p className="text-xs text-gray-500 mt-1">الأقسام الظاهرة في التطبيق حالياً: <span className="text-[#f5c518]">{sections.length}</span></p>
                </div>
                <button 
                    onClick={handleSaveToDb}
                    disabled={loading}
                    className="bg-[#222] hover:bg-green-600 text-green-500 hover:text-white border border-green-600 px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                >
                    {loading ? <span className="animate-spin">⌛</span> : '💾'} حفظ التغييرات
                </button>
            </div>

            {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[#222] rounded-xl text-gray-600 bg-[#151515]">
                    <span className="text-4xl mb-4 grayscale">🏗️</span>
                    <p>الصفحة فارغة. ابدأ بإضافة أقسام من اليمين.</p>
                </div>
            ) : (
                <div className="space-y-3 pb-20">
                    {sections.map((section, index) => (
                        <div key={section.id} className="bg-[#151515] p-4 rounded-lg border border-[#333] flex justify-between items-center group hover:border-[#555] transition-all relative overflow-hidden">
                            {/* زخرفة خلفية */}
                            <div className="absolute top-0 right-0 w-1 h-full bg-[#f5c518]"></div>
                            
                            <div className="flex items-center gap-4 pr-3">
                                <span className="text-gray-600 font-mono text-sm">#{index + 1}</span>
                                <div>
                                    <h3 className="font-bold text-gray-200 text-base">
                                        {section.type === 'hero' ? 'بانر رئيسي (Hero Section)' : section.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
                                        <span className="bg-[#222] text-gray-400 px-2 py-0.5 rounded border border-[#333] uppercase">{section.type}</span>
                                        <span className="bg-[#222] text-[#f5c518] px-2 py-0.5 rounded border border-[#333]">{section.layout}</span>
                                        {section.dataSource && <span className="bg-[#222] text-blue-400 px-2 py-0.5 rounded border border-[#333]">🔗 {section.dataSource}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pl-2">
                                {section.mediaUrl && <img src={section.mediaUrl} className="w-16 h-10 object-cover rounded border border-[#333]" alt="banner" />}
                                {section.heroSlides && section.heroSlides.length > 0 && (
                                    <div className="flex -space-x-2 space-x-reverse">
                                        {section.heroSlides.slice(0,3).map((s,i) => <img key={i} src={s} className="w-8 h-8 rounded-full border border-[#222] object-cover" />)}
                                        {section.heroSlides.length > 3 && <div className="w-8 h-8 rounded-full bg-[#333] text-[9px] flex items-center justify-center text-white border border-[#222]">+{section.heroSlides.length-3}</div>}
                                    </div>
                                )}
                                <button onClick={() => handleDelete(section.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-900/30 text-red-600 hover:text-red-500 transition-colors">✕</button>
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