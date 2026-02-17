"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState({ categories: [], collections: [] }); // لحفظ البيانات المتاحة للاختيار
  const [sections, setSections] = useState([]); // الأقسام الحالية
  
  // الحالة الخاصة بالقسم الجديد اللي بنضيفه
  const [newSection, setNewSection] = useState({
    title: '',
    subTitle: '',
    type: 'products', // products, collection, page, hero
    dataSource: '', // ID of the category/collection
    layout: 'grid_default', // standard, imdb_card, masonry, etc.
    mediaUrl: '', // صورة مخصصة للقسم
    heroSlides: [] // للهيرو فقط: قائمة روابط
  });

  // حالة مؤقتة لإضافة رابط سلايد في الهيرو
  const [tempHeroSlide, setTempHeroSlide] = useState('');

  // --- 1. مكتبة التصميمات (Layouts Library) ---
  const layoutOptions = {
    products: [
      { id: 'grid_default', name: 'شبكة منتجات تقليدية (Grid)', icon: 'bb' },
      { id: 'slider_row', name: 'شريط سحب أفقي (Slider)', icon: '↔️' },
      { id: 'marquee_scroll', name: 'شريط متحرك تلقائي (Marquee)', icon: '🏃' },
      { id: 'imdb_cards', name: 'كروت عريضة (IMDb Style)', icon: '🎫' },
      { id: 'masonry_wall', name: 'شبكة غير منتظمة (Pinterest)', icon: '🧱' },
    ],
    collection: [
        { id: 'circle_row', name: 'دوائر (Stories Style)', icon: 'DQ' },
        { id: 'rect_cards', name: 'كروت بوسترات', icon: 'cj' },
    ],
    hero: [
        { id: 'full_screen', name: 'شاشة كاملة (Full Screen)', icon: 'pc' },
        { id: 'split_screen', name: 'منقسم (Split)', icon: 'D|' },
    ]
  };

  // --- 2. جلب البيانات (عشان القوائم المنسدلة) ---
  useEffect(() => {
    const fetchData = async () => {
      // هنا مفروض نجيب الأقسام الحقيقية، هحط داتا وهمية للتجربة لحد ما نربط صح
      // في النسخة النهائية ده هيجي من Firebase Products
      const cats = ['فساتين', 'بلوزات', 'جواكيت', 'وصل حديثاً']; 
      const cols = ['كولكشن الشتاء', 'كولكشن الصيف', 'تخفيضات'];
      setDbData({ categories: cats, collections: cols });

      // جلب الأقسام المحفوظة سابقاً
      const docRef = doc(db, "settings", "homePage_v2"); // اصدار جديد v2
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSections(docSnap.data().sections || []);
      }
    };
    fetchData();
  }, []);

  // --- 3. المنطق (Logic) ---

  const handleAddHeroSlide = () => {
    if(!tempHeroSlide) return;
    setNewSection({...newSection, heroSlides: [...newSection.heroSlides, tempHeroSlide]});
    setTempHeroSlide('');
  };

  const handleAddSection = () => {
    if (!newSection.title && newSection.type !== 'hero') return alert("اكتب عنوان للقسم!");
    
    const sectionToAdd = {
        id: Date.now().toString(),
        ...newSection
    };

    setSections([...sections, sectionToAdd]);
    // تصفير الفورم
    setNewSection({ ...newSection, title: '', subTitle: '', dataSource: '', mediaUrl: '', heroSlides: [] });
  };

  const handleSaveToDb = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "settings", "homePage_v2"), { 
            sections: sections,
            lastUpdate: new Date().toISOString()
        });
        alert("تم حفظ هيكل الصفحة بنجاح! 🚀");
    } catch (e) {
        alert("حدث خطأ: " + e.message);
    }
    setLoading(false);
  };

  const handleDelete = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // --- 4. الواجهة (UI) ---
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* === الجزء الأيمن: نموذج الإضافة (Control Panel) === */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] shadow-2xl h-fit sticky top-10">
            <h2 className="text-2xl font-bold text-[#f5c518] mb-6 border-b border-[#333] pb-4">🛠️ مصنع الأقسام</h2>
            
            <div className="space-y-4">
                {/* 1. نوع القسم */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">نوع القسم</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['products', 'collection', 'pages', 'hero'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setNewSection({...newSection, type})}
                                className={`p-2 text-sm rounded border transition-all ${newSection.type === type ? 'bg-[#f5c518] text-black border-[#f5c518] font-bold' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                            >
                                {type === 'products' && 'منتجات'}
                                {type === 'collection' && 'كولكشن'}
                                {type === 'pages' && 'صفحة'}
                                {type === 'hero' && 'Hero'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. بيانات الهيرو الخاصة (تظهر فقط لو اخترت Hero) */}
                {newSection.type === 'hero' ? (
                    <div className="bg-[#222] p-4 rounded border border-dashed border-[#444]">
                        <label className="text-xs text-[#f5c518] mb-2 block">روابط الصور/الفيديو (BBImage or MP4)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={tempHeroSlide}
                                onChange={(e) => setTempHeroSlide(e.target.value)}
                                placeholder="ضع رابط الصورة هنا..."
                                className="flex-1 bg-[#111] border border-[#333] p-2 text-sm text-white rounded outline-none focus:border-[#f5c518]"
                            />
                            <button onClick={handleAddHeroSlide} className="bg-[#333] hover:bg-[#444] text-white px-3 rounded">+</button>
                        </div>
                        <div className="mt-2 space-y-1">
                            {newSection.heroSlides.map((slide, i) => (
                                <div key={i} className="text-[10px] bg-[#111] p-1 px-2 rounded flex justify-between">
                                    <span className="truncate w-3/4">{slide}</span>
                                    <span className="text-red-500 cursor-pointer" onClick={() => setNewSection({...newSection, heroSlides: newSection.heroSlides.filter((_, idx) => idx !== i)})}>x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 2. العنوان والعنوان الفرعي (للأقسام العادية) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">العنوان الرئيسي</label>
                                <input 
                                    value={newSection.title} 
                                    onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                                    className="w-full bg-[#222] border border-[#333] p-2 text-sm rounded focus:border-[#f5c518] outline-none" 
                                    placeholder="مثلاً: أحدث الفساتين"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">العنوان الفرعي</label>
                                <input 
                                    value={newSection.subTitle} 
                                    onChange={(e) => setNewSection({...newSection, subTitle: e.target.value})}
                                    className="w-full bg-[#222] border border-[#333] p-2 text-sm rounded focus:border-[#f5c518] outline-none" 
                                    placeholder="وصف بسيط..."
                                />
                            </div>
                        </div>

                        {/* 3. مصدر البيانات */}
                        <div>
                            <label className="text-xs text-gray-500">اختر المحتوى (Data Source)</label>
                            <select 
                                value={newSection.dataSource}
                                onChange={(e) => setNewSection({...newSection, dataSource: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] p-2 text-sm rounded focus:border-[#f5c518] outline-none"
                            >
                                <option value="">-- اختر --</option>
                                {newSection.type === 'products' && dbData.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                {newSection.type === 'collection' && dbData.collections.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* 4. صورة مخصصة */}
                        <div>
                            <label className="text-xs text-gray-500">صورة مخصصة (اختياري - رابط مباشر)</label>
                            <input 
                                value={newSection.mediaUrl}
                                onChange={(e) => setNewSection({...newSection, mediaUrl: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] p-2 text-sm rounded focus:border-[#f5c518] outline-none text-left" 
                                placeholder="https://..."
                                dir="ltr"
                            />
                        </div>
                    </>
                )}

                {/* 5. اختيار التصميم (Layout) */}
                <div>
                    <label className="text-xs text-gray-500 mb-2 block">شكل التصميم (Layout)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(layoutOptions[newSection.type === 'hero' ? 'hero' : (newSection.type === 'collection' ? 'collection' : 'products')] || []).map(layout => (
                            <div 
                                key={layout.id}
                                onClick={() => setNewSection({...newSection, layout: layout.id})}
                                className={`cursor-pointer p-2 rounded border text-center transition-all ${newSection.layout === layout.id ? 'bg-[#f5c518]/20 border-[#f5c518] text-[#f5c518]' : 'bg-[#222] border-[#333] hover:bg-[#333]'}`}
                            >
                                <div className="text-xl mb-1">{layout.icon}</div>
                                <div className="text-[10px] font-bold">{layout.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleAddSection}
                    className="w-full bg-[#f5c518] text-black font-black py-3 rounded mt-4 hover:bg-yellow-400 transition-colors shadow-lg"
                >
                    + إضافة القسم للمعاينة
                </button>
            </div>
        </div>

        {/* === الجزء الأيسر: المعاينة والترتيب (Live Preview List) === */}
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">هيكل الصفحة الحالي ({sections.length})</h2>
                <button 
                    onClick={handleSaveToDb}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm shadow-lg disabled:opacity-50"
                >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات 💾'}
                </button>
            </div>

            {sections.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-xl text-gray-600">
                    الصفحة فارغة تماماً.. ابدأ بإضافة أول قسم من اليمين
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, index) => (
                        <div key={section.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] flex justify-between items-center group hover:border-[#f5c518] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="bg-[#222] text-gray-500 w-8 h-8 flex items-center justify-center rounded-full font-mono text-xs border border-[#333]">{index + 1}</span>
                                <div>
                                    <h3 className="font-bold text-gray-200 text-sm">
                                        {section.type === 'hero' ? 'Hero Section' : section.title}
                                    </h3>
                                    <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                                        <span className="bg-[#222] px-1 rounded border border-[#333]">{section.type}</span>
                                        <span className="bg-[#222] px-1 rounded border border-[#333]">{section.layout}</span>
                                        {section.dataSource && <span className="text-[#f5c518]">({section.dataSource})</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {section.mediaUrl && <img src={section.mediaUrl} className="w-10 h-6 object-cover rounded border border-[#444]" alt="preview" />}
                                <button onClick={() => handleDelete(section.id)} className="text-red-500 hover:text-red-400 p-2">✕</button>
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