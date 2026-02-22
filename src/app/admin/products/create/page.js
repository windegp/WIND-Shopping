"use client";
import { useState } from 'react';
import ImageUploader from "@/components/ImageUploader";

export default function CreateProductPage() {
  // ==========================================
  // 1. إدارة حالة البيانات (States)
  // ==========================================
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [chargeTax, setChargeTax] = useState(false); // الضريبة الافتراضية: لا (No)

  // دوال التعامل مع الصور
  const handleImageKitSuccess = (url) => setImages((prev) => [...prev, url]);
  
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() !== "") {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput(""); // تفريغ الحقل بعد الإضافة
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // ==========================================
  // 2. واجهة المستخدم (نسخة شوبيفاي)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-right" dir="rtl">
      
      {/* عنوان الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-gray-500">{"<"}</span> إضافة منتج
        </h1>
        <button className="bg-[#F5C518] text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================== */}
        {/* العمود الأيمن (الرئيسي - 66%) */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. الكارت الأول: العنوان والوصف */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">العنوان (Title)</label>
              <input type="text" placeholder="Short sleeve t-shirt" className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white focus:border-[#F5C518] outline-none transition" />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">الوصف (Description)</label>
              <div className="border border-[#333] rounded-lg overflow-hidden">
                {/* شريط أدوات الوصف (شكل فقط للمطابقة مع شوبيفاي) */}
                <div className="bg-[#222] border-b border-[#333] p-2 flex gap-3 text-gray-400 text-sm items-center">
                  <span className="cursor-pointer hover:text-white">✨</span>
                  <span className="cursor-pointer hover:text-white">Paragraph ▾</span>
                  <span className="cursor-pointer font-bold hover:text-white">B</span>
                  <span className="cursor-pointer italic hover:text-white">I</span>
                  <span className="cursor-pointer underline hover:text-white">U</span>
                  <span className="cursor-pointer hover:text-white">🔗</span>
                  <span className="cursor-pointer hover:text-white">📷</span>
                </div>
                <textarea rows="6" className="w-full bg-[#121212] p-3 text-white outline-none resize-none"></textarea>
              </div>
            </div>
          </div>

          {/* 2. الكارت الثاني: الوسائط (الرفع + الرابط المباشر) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 mb-3">الوسائط (Media)</h3>
            
            <div className="border-2 border-dashed border-[#444] rounded-lg p-6 text-center bg-[#121212]">
              {/* زر الرفع اللي عملناه */}
              <ImageUploader onUploadSuccess={handleImageKitSuccess} />
              
              <p className="text-xs text-gray-500 mt-3">Accepts images, videos, or 3D models</p>

              {/* إضافة رابط مباشر (التعديل المطلوب) */}
              <div className="mt-6 border-t border-[#333] pt-4 flex gap-2 max-w-sm mx-auto">
                <input 
                  type="url" 
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="أو أضف رابط صورة مباشر (URL)" 
                  className="flex-1 bg-[#1a1a1a] border border-[#333] p-2 rounded text-xs text-white outline-none focus:border-[#F5C518]"
                />
                <button 
                  onClick={handleAddImageUrl}
                  type="button"
                  className="bg-[#333] text-white px-3 py-2 rounded text-xs font-bold hover:bg-[#444] transition"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* عرض الصور المرفوعة */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#333] group">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. الكارت الثالث: التصنيف (Category) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">التصنيف (Category)</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none">
              <option>Choose a product category</option>
              <option>Apparel & Accessories</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-2">Determines tax rates and adds metafields to improve search, filters, and cross-channel sales</p>
          </div>

          {/* 4. الكارت الرابع: السعر (Price) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 mb-4">السعر (Price)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">E£</span>
                  <input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none focus:border-[#F5C518]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Compare at price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">E£</span>
                  <input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none focus:border-[#F5C518]" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#333] mt-5 pt-5 grid grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cost per item</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">E£</span>
                  <input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none focus:border-[#F5C518]" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 justify-center">
                <span className="text-sm text-gray-300">Charge tax</span>
                {/* زرار الضريبة - الافتراضي مغلق حسب طلبك */}
                <button 
                  onClick={() => setChargeTax(!chargeTax)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${chargeTax ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${chargeTax ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================== */}
        {/* العمود الأيسر (الجانبي - 33%) */}
        {/* ========================================== */}
        <div className="space-y-6">
          
          {/* الحالة (Status) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">الحالة (Status)</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none">
              <option>Active</option>
              <option>Draft</option>
            </select>
          </div>

          {/* النشر (Publishing) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-300">النشر (Publishing)</h3>
              <span className="text-gray-500 cursor-pointer">⋮</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1">Online Store 🟢</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Point of Sale</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Facebook & Instagram</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Google & YouTube</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">TikTok</span>
            </div>
          </div>

          {/* تنظيم المنتج (Product organization) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm space-y-4">
            <h3 className="text-sm text-gray-300">تنظيم المنتج (Product organization)</h3>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <input type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vendor</label>
              <input type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Collections</label>
              <div className="relative">
                <span className="absolute left-2 top-2.5 text-gray-500 text-xs">🔍</span>
                <input type="text" className="w-full bg-[#121212] border border-[#333] p-2 pl-7 rounded text-white outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Tags</label>
              <input type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>
          </div>

          {/* قالب الثيم (Theme template) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">Theme template</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none">
              <option>Default product</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}