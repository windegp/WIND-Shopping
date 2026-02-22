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

    const formData = new FormData();
    formData.append("file", file);

    try {
      // بنبعت الصورة للـ API اللي لسه عاملينه
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // لو كله تمام، بنبعت الرابط للصفحة الأساسية
        onUploadSuccess(data.url);
      } else {
        setError(data.error || "حدث خطأ أثناء الرفع.");
      }
    } catch (err) {
      console.error(err);
      setError("فشل الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-dashed border-gray-600 bg-[#1a1a1a] rounded-lg text-center w-full max-w-sm">
      <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
        <span className={`px-6 py-2 rounded-md font-bold transition w-full text-center ${loading ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-[#F5C518] text-black hover:bg-yellow-500'}`}>
          {loading ? "جاري الرفع لـ ImageKit..." : "اختر صورة لرفعها"}
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