"use client";
import React, { useState } from 'react';

export default function ImageUploader({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // نجهز عمليات الرفع لكل صورة بشكل مستقل (كل صورة تجيب التوكن بتاعها)
      const uploadPromises = files.map(async (file) => {
        try {
          // 1. جلب توكن "جديد" ومستقل لكل صورة
          const authRes = await fetch('/api/upload');
          if (!authRes.ok) return null;
          const { signature, expire, token, publicKey } = await authRes.json();

          // 2. تجهيز بيانات الرفع للصورة دي
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", file.name.replace(/\s+/g, '-'));
          formData.append("publicKey", publicKey);
          formData.append("signature", signature);
          formData.append("expire", expire);
          formData.append("token", token);
          formData.append("folder", "/WIND_Shopping");

          // 3. رفع الصورة لـ ImageKit
          const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            body: formData,
          });

          const data = await uploadRes.json();
          
          if (uploadRes.ok && data.url) {
            return data.url;
          } else {
            console.error("Failed to upload:", file.name, data);
            return null; 
          }
        } catch (err) {
          console.error("Error with file:", file.name, err);
          return null;
        }
      });

      // 4. تنفيذ كل العمليات بالتوازي
      const results = await Promise.all(uploadPromises);
      
      // 5. فلترة الروابط الناجحة فقط
      const successfulUrls = results.filter(url => url !== null);

      if (successfulUrls.length > 0) {
        onUploadSuccess(successfulUrls);
      }

      // إظهار تنبيه لو في صورة وقعت في السكة
      if (successfulUrls.length < files.length) {
        setError(`تم رفع ${successfulUrls.length} من أصل ${files.length} صورة بنجاح.`);
      } else {
        setError(null);
      }

    } catch (err) {
      console.error(err);
      setError("فشل معالجة الصور.");
    } finally {
      setLoading(false);
      // تصفير الـ input عشان لو حبيت ترفع نفس الصور تاني
      e.target.value = null; 
    }
  };

return (
    <div className="p-4 border border-dashed border-gray-600 bg-[#1a1a1a] rounded-lg text-center w-full max-w-sm">
      <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
        <span className={`px-6 py-2 rounded-md font-bold transition w-full text-center shadow-sm ${loading ? 'bg-gray-500 text-white cursor-wait opacity-80' : 'bg-[#F5C518] text-black hover:bg-yellow-500'}`}>
          {loading ? "جاري رفع الصور..." : "اختر صورة أو أكثر"}
        </span>
        <p className="text-[10px] text-gray-400">يمكنك تحديد عدة صور معاً</p>
        <input 
          type="file" 
          accept="image/*" 
          multiple // السر كله في الكلمة دي
          className="hidden" 
          onChange={handleFileChange} 
          disabled={loading}
        />
      </label>
      {error && <p className="text-[#F5C518] text-xs mt-3 bg-black/20 p-2 rounded">{error}</p>}
    </div>
  );
}