"use client";
import React, { useState } from 'react';

export default function ImageUploader({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // 1. هات التوقيع والمفاتيح من الـ API بتاعنا
      const authRes = await fetch('/api/upload');
      if (!authRes.ok) throw new Error("فشل الاتصال بالـ API");
      
      // هنا بناخد المفاتيح من الرد بتاع الـ API مش من الـ Env
      const { signature, expire, token, publicKey, urlEndpoint } = await authRes.json();

      // 2. جهز الفورم
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name.replace(/\s+/g, '-'));
      formData.append("publicKey", publicKey); // استخدام المفتاح اللي راجع من الـ API
      formData.append("signature", signature);
      formData.append("expire", expire);
      formData.append("token", token);
      formData.append("folder", "/WIND_Shopping");

      // 3. ارفع لـ ImageKit
      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();

      if (uploadRes.ok && data.url) {
        // لو كله تمام، بنبعت الرابط للصفحة الأساسية
        onUploadSuccess(data.url);
      } else {
        setError(data.message || "حدث خطأ أثناء الرفع.");
      }
    } catch (err) {
      console.error(err);
      setError("فشل الاتصال بسيرفر الرفع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-dashed border-gray-600 bg-[#1a1a1a] rounded-lg text-center w-full max-w-sm">
      <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
        <span className={`px-6 py-2 rounded-md font-bold transition w-full text-center ${loading ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-[#F5C518] text-black hover:bg-yellow-500'}`}>
          {loading ? "جاري الرفع المباشر..." : "اختر صورة لرفعها"}
        </span>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={loading}
        />
      </label>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}