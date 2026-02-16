"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; 
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export default function AdminHomeManager() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    // بيانات السيكشن الأول
    section1Title: "",
    section1SubTitle: "",
    section1Category: "",
    // بيانات السيكشن الثاني
    section2Title: "",
    section2SubTitle: "",
    section2Category: "",
  });

  // 1. أول ما تفتح الصفحة، يجيب البيانات الحالية من فيربيز عشان تعدل عليها
  useEffect(() => {
    const fetchCurrentConfig = async () => {
      const docRef = doc(db, "settings", "homePage");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    };
    fetchCurrentConfig();
  }, []);

  // 2. وظيفة الحفظ (ترفع البيانات لفيربيز وتسمع في الصفحة الرئيسية)
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homePage");
      // نستخدم setDoc مع merge عشان لو الوثيقة مش موجودة ينشأها
      await setDoc(docRef, config, { merge: true });
      alert("✅ تم التحديث بنجاح! العناوين الجديدة ظهرت الآن في الصفحة الرئيسية.");
    } catch (error) {
      console.error(error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-10 bg-[#121212] min-h-screen text-white" dir="rtl">
      <h1 className="text-2xl font-black mb-8 border-r-4 border-[#F5C518] pr-4">إدارة محتوى الصفحة الرئيسية - WIND</h1>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        
        {/* إعدادات السيكشن الأول */}
        <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333]">
          <h2 className="text-[#F5C518] font-bold mb-6 flex items-center gap-2">
            <span className="bg-[#F5C518] text-black w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
            السيكشن الأول (مثلاً: وصل حديثاً)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section1Title}
                onChange={(e) => setConfig({...config, section1Title: e.target.value})}
                placeholder="مثلاً: أحدث صيحات WIND"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">الوصف (SubTitle)</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section1SubTitle}
                onChange={(e) => setConfig({...config, section1SubTitle: e.target.value})}
                placeholder="مثلاً: تصاميم شتوية تلامس الروح"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-2">تصنيف المنتجات (Category Slug)</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section1Category}
                onChange={(e) => setConfig({...config, section1Category: e.target.value})}
                placeholder="مثلاً: new-arrivals"
              />
            </div>
          </div>
        </div>

        {/* إعدادات السيكشن الثاني */}
        <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333]">
          <h2 className="text-[#F5C518] font-bold mb-6 flex items-center gap-2">
            <span className="bg-[#F5C518] text-black w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
            السيكشن الثاني (مثلاً: الفساتين)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2">العنوان الرئيسي</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section2Title}
                onChange={(e) => setConfig({...config, section2Title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">الوصف (SubTitle)</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section2SubTitle}
                onChange={(e) => setConfig({...config, section2SubTitle: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-2">تصنيف المنتجات (Category Slug)</label>
              <input 
                type="text"
                className="w-full bg-[#121212] border border-[#444] p-3 rounded focus:border-[#F5C518] outline-none"
                value={config.section2Category}
                onChange={(e) => setConfig({...config, section2Category: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-[#F5C518] text-black font-black py-4 rounded-sm hover:bg-yellow-500 transition-all shadow-[0_0_20px_rgba(245,197,24,0.2)]"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات ونشرها فوراً"}
        </button>
      </form>
    </div>
  );
}