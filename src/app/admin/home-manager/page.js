"use client";
import React, { useState } from 'react';

export default function HomeManagerPage() {
  // حالة مبدئية لعرض المدخلات، وسيتم لاحقاً جلبها من قاعدة البيانات
  const [slides, setSlides] = useState([
    {
      image: "/images/banners/1.webp",
      tag: "وصل حديثاً",
      title: "مجموعة الشتاء",
      desc: "تصاميم كلاسيكية بلمسة عصرية"
    }
  ]);

  // دالة لتحديث أي حقل داخل الشريحة
  const handleInputChange = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index][field] = value;
    setSlides(updatedSlides);
  };

  // دالة لإضافة شريحة جديدة فارغة
  const addNewSlide = () => {
    setSlides([...slides, { image: "", tag: "", title: "", desc: "" }]);
  };

  // دالة لحذف شريحة
  const removeSlide = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
  };

  // دالة لحفظ البيانات 
  const handleSave = () => {
    console.log("البيانات الجاهزة للحفظ:", slides);
    alert("تم حفظ إعدادات القسم الرئيسي بنجاح وبكل أناقة!");
    // هنا سيتم وضع كود الإرسال إلى واجهة برمجة التطبيقات (API)
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">إدارة واجهة الموقع</h1>
        <button 
          onClick={handleSave}
          className="bg-[#2C2C2C] hover:bg-black text-white font-semibold py-2.5 px-8 rounded shadow transition-all duration-300 ease-in-out"
        >
          حفظ التحديثات
        </button>
      </div>

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
              {/* حقل الصورة */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط الصورة</label>
                <input 
                  type="text" 
                  value={slide.image}
                  onChange={(e) => handleInputChange(index, 'image', e.target.value)}
                  placeholder="مثال: /images/banners/1.webp"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none transition-all bg-white"
                />
              </div>

              {/* حقل التاج (الوسم) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الوسم المميّز</label>
                <input 
                  type="text" 
                  value={slide.tag}
                  onChange={(e) => handleInputChange(index, 'tag', e.target.value)}
                  placeholder="مثال: الأكثر مبيعاً"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none transition-all bg-white"
                />
              </div>

              {/* حقل العنوان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان الرئيسي</label>
                <input 
                  type="text" 
                  value={slide.title}
                  onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                  placeholder="مثال: تشكيلة العيد"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none transition-all bg-white"
                />
              </div>

              {/* حقل الوصف */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">وصف التصميم</label>
                <textarea 
                  value={slide.desc}
                  onChange={(e) => handleInputChange(index, 'desc', e.target.value)}
                  placeholder="أضف وصفاً جذاباً يعبر عن روح المجموعة..."
                  rows="2"
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#F5C518] focus:border-[#F5C518] outline-none transition-all bg-white resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addNewSlide}
        className="mt-8 w-full py-3.5 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-xl hover:border-[#F5C518] hover:bg-[#F5C518]/5 hover:text-[#2C2C2C] transition-all duration-300"
      >
        + إضافة شريحة عرض جديدة
      </button>
    </div>
  );
}