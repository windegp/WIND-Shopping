"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // كل المنتجات
  const [categories, setCategories] = useState([]); // قائمة الأقسام المستخرجة
  
  // الصفحات الثابتة في موقعك (يمكنك زيادتها)
  const staticPages = [
    { name: "قصة WIND", slug: "story", path: "/story" },
    { name: "المقالات (Blog)", slug: "blog", path: "/blog" },
    { name: "التقييمات", slug: "reviews", path: "/reviews" },
    { name: "كل المنتجات", slug: "all", path: "/collections/all" }
  ];

  // حالة الأقسام (مصفوفة قابلة للزيادة)
  const [sections, setSections] = useState([]);

  // 1. جلب البيانات (المنتجات + الإعدادات الحالية)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // أ. جلب المنتجات لاستخراج الأقسام وعرض خيارات الاستثناء
        const prodsSnap = await getDocs(collection(db, "products"));
        const prodsData = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(prodsData);

        // استخراج الأقسام الفريدة (Unique Categories)
        const uniqueCats = [...new Set(prodsData.flatMap(p => p.categories || []))].filter(Boolean);
        setCategories(uniqueCats);

        // ب. جلب إعدادات الصفحة الرئيسية المحفوظة
        const settingsRef = doc(db, "settings", "homePage");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && settingsSnap.data().sections) {
          setSections(settingsSnap.data().sections);
        } else {
          // إعدادات افتراضية لو مفيش داتا قديمة
          setSections([
            { id: 1, title: "", subTitle: "", type: "collection", slug: "", excludedIds: [] }
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, []);

  // 2. دوال التعامل مع الأقسام
  const addSection = () => {
    setSections([...sections, { 
      id: Date.now(), 
      title: "", 
      subTitle: "", 
      type: "collection", // collection or page
      slug: "", 
      excludedIds: [] 
    }]);
  };

  const removeSection = (index) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      const newSections = [...sections];
      newSections.splice(index, 1);
      setSections(newSections);
    }
  };

  const updateSection = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    
    // لو غيرنا الـ Slug، نحدث رابط "عرض الكل" تلقائياً
    if (field === 'slug' || field === 'type') {
       // سيتم التعامل مع الرابط في الواجهة، هنا نحفظ الـ Slug فقط
       // تصفير الاستثناءات عند تغيير القسم
       if (field === 'slug') newSections[index].excludedIds = [];
    }
    
    setSections(newSections);
  };

  // التعامل مع استثناء المنتجات
  const toggleProductExclusion = (sectionIndex, productId) => {
    const newSections = [...sections];
    const currentExcluded = newSections[sectionIndex].excludedIds || [];
    
    if (currentExcluded.includes(productId)) {
      newSections[sectionIndex].excludedIds = currentExcluded.filter(id => id !== productId);
    } else {
      newSections[sectionIndex].excludedIds = [...currentExcluded, productId];
    }
    setSections(newSections);
  };

  // 3. الحفظ في فيربيز
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homePage");
      // نحفظ المصفوفة كاملة باسم sections
      await setDoc(docRef, { sections }, { merge: true });
      alert("✅ تم تحديث هيكل الصفحة الرئيسية بنجاح!");
    } catch (error) {
      console.error(error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8 border-b border-[#333] pb-4">
        <h1 className="text-2xl font-black text-[#F5C518]">إدارة واجهة WIND</h1>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#F5C518] text-black font-bold px-6 py-2 rounded-sm hover:bg-yellow-500 shadow-[0_0_15px_rgba(245,197,24,0.3)]"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {sections.map((section, index) => (
          <div key={section.id} className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333] relative group transition-all hover:border-[#F5C518]/30">
            {/* زر الحذف */}
            <button 
              onClick={() => removeSection(index)}
              className="absolute top-4 left-4 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] p-2 rounded"
            >
              حذف القسم 🗑️
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="bg-[#222] text-[#F5C518] w-8 h-8 flex items-center justify-center rounded font-bold border border-[#333]">{index + 1}</span>
              <h3 className="font-bold text-lg">إعدادات القسم</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* العناوين */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
                <input 
                  type="text"
                  className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="مثلاً: فساتين السهرة"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">الوصف الفرعي (SubTitle)</label>
                <input 
                  type="text"
                  className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                  value={section.subTitle}
                  onChange={(e) => updateSection(index, 'subTitle', e.target.value)}
                  placeholder="وصف جذاب..."
                />
              </div>

              {/* نوع المحتوى والرابط */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">نوع المحتوى</label>
                <select 
                  className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-gray-300"
                  value={section.type}
                  onChange={(e) => updateSection(index, 'type', e.target.value)}
                >
                  <option value="collection">منتجات (Collection)</option>
                  <option value="page">صفحة ثابتة (Page)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">اختر {section.type === 'collection' ? 'القسم' : 'الصفحة'}</label>
                <select 
                  className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none text-gray-300"
                  value={section.slug}
                  onChange={(e) => updateSection(index, 'slug', e.target.value)}
                >
                  <option value="">-- اختر --</option>
                  {section.type === 'collection' ? (
                    categories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  ) : (
                    staticPages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)
                  )}
                </select>
                <p className="text-[10px] text-[#F5C518] mt-1">
                   الرابط سيكون: {section.type === 'collection' ? `/collections/${section.slug}` : (staticPages.find(p => p.slug === section.slug)?.path || 'غير محدد')}
                </p>
              </div>
            </div>

            {/* منطقة استثناء المنتجات (تظهر فقط لو اخترنا قسم منتجات) */}
            {section.type === 'collection' && section.slug && (
              <div className="bg-[#121212] p-4 rounded border border-[#333]">
                <h4 className="text-xs font-bold text-gray-400 mb-3 flex justify-between">
                  <span>منتجات هذا القسم (حدد المنتجات التي تريد إخفاءها 👁️‍🗨️)</span>
                </h4>
                <div className="max-h-40 overflow-y-auto scrollbar-hide grid grid-cols-1 md:grid-cols-2 gap-2">
                  {products
                    .filter(p => p.categories?.includes(section.slug))
                    .map(product => (
                      <label key={product.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${section.excludedIds?.includes(product.id) ? 'border-red-500 bg-red-900/10' : 'border-[#333] hover:border-[#555]'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-red-500"
                          checked={section.excludedIds?.includes(product.id) || false}
                          onChange={() => toggleProductExclusion(index, product.id)}
                        />
                         <div className="flex items-center gap-2">
                           {product.images?.[0] && <img src={product.images[0]} className="w-8 h-8 object-cover rounded-sm" />}
                           <span className={`text-xs ${section.excludedIds?.includes(product.id) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                             {product.title}
                           </span>
                         </div>
                      </label>
                    ))
                  }
                  {products.filter(p => p.categories?.includes(section.slug)).length === 0 && (
                    <p className="text-xs text-gray-500 p-2">لا توجد منتجات في هذا القسم حالياً</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* زر إضافة قسم جديد */}
        <button 
          onClick={addSection}
          className="w-full border-2 border-dashed border-[#444] text-gray-400 py-6 rounded hover:border-[#F5C518] hover:text-[#F5C518] transition-all font-bold flex flex-col items-center gap-2"
        >
          <span className="text-2xl">+</span>
          <span>إضافة قسم جديد للصفحة الرئيسية</span>
        </button>

      </div>
    </div>
  );
}