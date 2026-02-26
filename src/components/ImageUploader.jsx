"use client";
import React, { useState } from 'react';

export default function ImageUploader({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // فحص حجم الملف اختيارياً (مثلاً منعه لو أكبر من 10 ميجا)
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة كبير جداً، الحد الأقصى 10 ميجا.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. الحصول على بيانات المصادقة (التوقيع) من السيرفر بتاعنا
      // التعديل هنا: بنستخدم GET لطلب التوقيع فقط
      const authRes = await fetch('/api/upload');
      if (!authRes.ok) throw new Error("فشل الحصول على تصريح الرفع");
      const authData = await authRes.json();

      // 2. تجهيز الـ FormData للرفع المباشر لـ ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name.replace(/\s+/g, '-'));
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire);
      formData.append("token", authData.token);
      formData.append("folder", "/WIND_Shopping"); // الفولدر اللي حددناه

      // 3. الرفع الفعلي مباشرة لـ ImageKit (الـ Client بيكلم ImageKit)
      // نستخدم رابط الرفع الرسمي لـ ImageKit
      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (uploadRes.ok && uploadData.url) {
        // لو كله تمام، بنبعت الرابط للصفحة الأساسية
        onUploadSuccess(uploadData.url);
      } else {
        setError(uploadData.message || "حدث خطأ أثناء الرفع لـ ImageKit.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setError("فشل الرفع المباشر، تأكد من إعدادات الـ Keys.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="cursor-pointer flex flex-col items-center justify-center">
        <div className={`px-10 py-5 rounded-2xl font-black transition-all duration-300 w-full text-center border-2 border-dashed ${
          loading 
          ? 'bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed' 
          : 'bg-[#1a1a1a] border-[#333] text-[#F5C518] hover:border-[#F5C518] hover:bg-[#222]'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center gap-3">
               <div className="w-4 h-4 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
               <span>جاري الرفع المباشر...</span>
            </div>
          ) : (
            "اسحب صورة هنا أو اضغط للرفع"
          )}
        </div>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={loading}
        />
      </label>
      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold animate-shake">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}