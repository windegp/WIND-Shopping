"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

export default function HomeManagerPage() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const docRef = doc(db, "homepage", "main-hero");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSlides(docSnap.data().slides || []);
          setCategories(docSnap.data().categories || []);
        } else {
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
          setCategories([{ title: "", link: "" }]);
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentData();
  }, []);

  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index][field] = value;
    setSlides(updatedSlides);
  };

  const addNewSlide = () => {
    setSlides([...slides, { image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "", buttonText: "" }]);
  };

  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };

  const addNewCategory = () => {
    setCategories([...categories, { title: "", link: "" }]);
  };

  const removeCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        slides: slides,
        categories: categories
      };
      
      const docRef = doc(db, "homepage", "main-hero");
      await setDoc(docRef, dataToSave);
      
      alert("تم حفظ التحديثات بنجاح! الواجهة الآن تعرض أحدث بياناتك.");
    } catch (error) {
      console.error("حدث خطأ أثناء الحفظ: ", error);
      alert("عذراً، حدث خطأ أثناء الحفظ. تأكد من إعدادات قاعدة البيانات.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-10 text-center text-gray-400 font-sans text-xl bg-[#121212] min-h-screen">جاري تحميل بيانات لوحة التحكم...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8">
      <div className="max-w-5xl mx-auto p-6 bg-[#1a1a1a] rounded-lg shadow-xl font-sans text-white border border-[#333]" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#333] pb-4">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">إدارة واجهة الموقع</h1>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`font-bold py-2.5 px-8 rounded shadow-lg transition-all duration-300 ease-in-out ${saving ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-[#F5C518] hover:bg-yellow-500 text-black'}`}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التحديثات'}
          </button>
        </div>

        {/* --- قسم إدارة شرائح الهيرو --- */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-200 mb-6">إدارة شرائح العرض (Hero Slides)</h2>
          <div className="space-y-8">
            {slides.map((slide, index) => (
              <div key={index} className="p-6 border border-[#333] rounded-xl bg-[#242424] relative shadow-md">
                <div className="flex justify-between items-center mb-5 border-b border-[#333] pb-2">
                  <h3 className="font-semibold text-lg text-[#F5C518]">الشريحة رقم {index + 1}</h3>
                  <button 
                    onClick={() => removeSlide(index)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    حذف الشريحة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">رابط الصورة الخلفية الرئيسية</label>
                    <input 
                      type="text" 
                      value={slide.image}
                      onChange={(e) => handleSlideChange(index, 'image', e.target.value)}
                      className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">الوسم المميّز</label>
                    <input 
                      type="text" 
                      value={slide.tag}
                      onChange={(e) => handleSlideChange(index, 'tag', e.target.value)}
                      className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">العنوان الرئيسي</label>
                    <input 
                      type="text" 
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                      className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">وصف التصميم</label>
                    <textarea 
                      value={slide.desc}
                      onChange={(e) => handleSlideChange(index, 'desc', e.target.value)}
                      rows="2"
                      className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500 resize-none"
                    />
                  </div>

                  {/* الحقول الجديدة للصورة المصغرة، الرابط، ونص الزر */}
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">رابط البوستر المصغر</label>
                      <input 
                        type="text" 
                        value={slide.thumbnail}
                        onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)}
                        placeholder="مثال: /images/1.webp"
                        className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">رابط المنتج المخصص</label>
                      <input 
                        type="text" 
                        value={slide.productLink}
                        onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)}
                        placeholder="مثال: /product/123"
                        className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                      />
                    </div>
                    {/* الحقل الجديد لنص الزر */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">نص الزر (مثال: تسوق الآن)</label>
                      <input 
                        type="text" 
                        value={slide.buttonText || ""}
                        onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)}
                        placeholder="تصفح المنتج"
                        className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={addNewSlide}
            className="mt-6 w-full py-3.5 border-2 border-dashed border-[#444] text-gray-400 font-semibold rounded-xl hover:border-[#F5C518] hover:text-[#F5C518] transition-all duration-300"
          >
            + إضافة شريحة عرض جديدة
          </button>
        </div>

        {/* --- قسم إدارة الأقسام السفلية --- */}
        <div>
          <h2 className="text-2xl font-bold text-gray-200 mb-6 border-t border-[#333] pt-8">إدارة شريط الأقسام (تصفح الأقسام)</h2>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-end p-4 border border-[#333] rounded-lg bg-[#242424]">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">اسم القسم</label>
                  <input 
                    type="text" 
                    value={category.title}
                    onChange={(e) => handleCategoryChange(index, 'title', e.target.value)}
                    placeholder="مثال: تشكيلة العيد"
                    className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">رابط القسم</label>
                  <input 
                    type="text" 
                    value={category.link}
                    onChange={(e) => handleCategoryChange(index, 'link', e.target.value)}
                    placeholder="مثال: /category/eid"
                    className="w-full p-2.5 border border-[#444] rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-[#121212] text-white placeholder-gray-500"
                  />
                </div>
                <button 
                  onClick={() => removeCategory(index)}
                  className="bg-red-900/30 text-red-400 hover:bg-red-900/60 hover:text-red-300 px-4 py-2.5 rounded-md font-medium transition-colors w-full md:w-auto border border-red-900/50"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={addNewCategory}
            className="mt-4 w-full md:w-auto px-6 py-2.5 border border-[#444] text-gray-300 font-semibold rounded-lg hover:border-[#F5C518] hover:text-[#F5C518] transition-all duration-300"
          >
            + إضافة قسم جديد
          </button>
        </div>

      </div>
    </div>
  );
}