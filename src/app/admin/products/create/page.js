"use client";
import { useState } from 'react';
import ImageUploader from "@/components/admin/ImageUploader"; // تأكد إن المسار ده صح لمكان الزرار

export default function CreateProductPage() {
  // ستيت بسيطة جداً لحفظ روابط الصور اللي بتترفع
  const [images, setImages] = useState([]);

  // الدالة دي بتستلم الرابط النظيف من زرار الرفع وتضيفه للمصفوفة
  const handleImageKitSuccess = (url) => {
    setImages((prev) => [...prev, url]);
  };

  // دالة لحذف الصورة من الواجهة (لو حبيت تشيلها)
  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-10 pb-20 px-4 text-right" dir="rtl">
      
      {/* الرأس */}
      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">اختبار نظام رفع الصور (ImageKit) 🚀</h2>
        <p className="text-gray-400 text-sm">ارفع صورة وتأكد من ظهورها بالأسفل برابط مباشر</p>
      </div>

      {/* منطقة الرفع */}
      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#333] flex justify-center">
        <ImageUploader onUploadSuccess={handleImageKitSuccess} />
      </div>

      {/* منطقة عرض الصور المرفوعة */}
      {images.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
          <h3 className="text-[#F5C518] font-bold mb-6 text-sm uppercase border-b border-[#333] pb-2">
            الصور المرفوعة بنجاح ({images.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#333] group">
                {/* عرض الصورة */}
                <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
                
                {/* زرار الحذف */}
                <button 
                  onClick={() => removeImage(i)} 
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                
                {/* رابط الصورة (عشان تتأكد إنه من ImageKit) */}
                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[8px] text-[#F5C518] text-left truncate px-2">
                  {src}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}