"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // نفس مسار الربط السابق

export default function HomeManagerPage() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب البيانات الحالية عند فتح لوحة التحكم
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const docRef = doc(db, "homepage", "main-hero");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSlides(docSnap.data().slides || []);
          setCategories(docSnap.data().categories || []);
        } else {
          // في حال كانت القاعدة فارغة تماماً يتم وضع قالب أولي
          setSlides([{ image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "" }]);
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

  // --- دوال التحكم في شرائح الهيرو ---
  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index][field] = value;
    setSlides(updatedSlides);
  };

  const addNewSlide = () => {
    setSlides([...slides, { image: "", tag: "", title: "", desc: "", thumbnail: "", productLink: "" }]);
  };

  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
  };

  // --- دوال التحكم في الأقسام ---
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

  // --- دالة الحفظ المباشر لـ Firebase ---
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
    return <div className="max-w-5xl mx-auto p-10 text-center text-gray-600 font-sans text-xl">جاري تحميل بيانات لوحة التحكم...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">إدارة واجهة الموقع</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`font-semibold py-2.5 px-8 rounded shadow transition-all duration-300 ease-in-out ${saving ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-[#2C2C2C] hover:bg-black text-white'}`}
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التحديثات'}
        </button>
      </div>

      {/* --- قسم إدارة شرائح الهيرو --- */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">إدارة شرائح العرض (Hero Slides)</h2>
        <div className="space-y-8">
          {slides.map((slide, index) => (
            <div key={index} className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 relative shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-lg text-[#2C2C2C]">الشريحة رقم {index + 1}</h3>
                <button 
                  onClick={() => removeSlide(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  حذف الشريحة
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط الصورة الخلفية الرئيسية</label>
                  <input 
                    type="text" 
                    value={slide.image}
                    onChange={(e) => handleSlideChange(index, 'image', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الوسم المميّز</label>
                  <input 
                    type="text" 
                    value={slide.tag}
                    onChange={(e) => handleSlideChange(index, 'tag', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان الرئيسي</label>
                  <input 
                    type="text" 
                    value={slide.title}
                    onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">وصف التصميم</label>
                  <textarea 
                    value={slide.desc}
                    onChange={(e) => handleSlideChange(index, 'desc', e.target.value)}
                    rows="2"
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white resize-none"
                  />
                </div>

                {/* الحقول الجديدة للصورة المصغرة والرابط */}
                <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط الصورة المصغرة (البوستر)</label>
                    <input 
                      type="text" 
                      value={slide.thumbnail}
                      onChange={(e) => handleSlideChange(index, 'thumbnail', e.target.value)}
                      placeholder="مثال: /images/posters/1.webp"
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط المنتج المخصص</label>
                    <input 
                      type="text" 
                      value={slide.productLink}
                      onChange={(e) => handleSlideChange(index, 'productLink', e.target.value)}
                      placeholder="مثال: /product/winter-collection"
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={addNewSlide}
          className="mt-6 w-full py-3.5 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-xl hover:border-[#F5C518] hover:bg-[#F5C518]/5 hover:text-[#2C2C2C] transition-all duration-300"
        >
          + إضافة شريحة عرض جديدة
        </button>
      </div>

      {/* --- قسم إدارة الأقسام السفلية (Browse Categories) --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-t pt-8">إدارة شريط الأقسام (تصفح الأقسام)</h2>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-4 items-end p-4 border border-gray-100 rounded-lg bg-gray-50/50">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم القسم</label>
                <input 
                  type="text" 
                  value={category.title}
                  onChange={(e) => handleCategoryChange(index, 'title', e.target.value)}
                  placeholder="مثال: تشكيلة العيد"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط القسم</label>
                <input 
                  type="text" 
                  value={category.link}
                  onChange={(e) => handleCategoryChange(index, 'link', e.target.value)}
                  placeholder="مثال: /category/eid"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] outline-none bg-white"
                />
              </div>
              <button 
                onClick={() => removeCategory(index)}
                className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 px-4 py-2.5 rounded-md font-medium transition-colors w-full md:w-auto"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
        <button 
          onClick={addNewCategory}
          className="mt-4 w-full md:w-auto px-6 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:border-[#F5C518] hover:text-[#2C2C2C] transition-all duration-300"
        >
          + إضافة قسم جديد
        </button>
      </div>

    </div>
  );
}