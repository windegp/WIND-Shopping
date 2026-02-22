"use client";
import React, { useState } from "react";
// استخدام المكتبة الرسمية الجديدة لضمان استقرار الـ Build
import { ImageKitProvider, IKUpload } from "@imagekit/next";

// جلب الإعدادات من ملف الـ .env
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

// دالة التصريح للرفع بأمان
const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit-auth");
    if (!response.ok) throw new Error("فشل طلب المصادقة");
    return await response.json();
  } catch (err) {
    throw new Error(`Authentication error: ${err.message}`);
  }
};

/**
 * مكون رفع الصور الخاص بلوحة تحكم ويند
 * تم استخدام export default لحل مشكلة تعارض الـ Build في Next.js
 */
export default function ImageUploader({ onUploadSuccess, label }) {
  const [loading, setLoading] = useState(false);

  // حماية إضافية للتأكد من وجود الإعدادات
  if (!publicKey || !urlEndpoint) {
    return <div className="text-red-500 text-[10px] font-bold">إعدادات ImageKit غير مكتملة في Vercel</div>;
  }

  return (
    <ImageKitProvider 
      publicKey={publicKey} 
      urlEndpoint={urlEndpoint} 
      authenticator={authenticator}
    >
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-[11px] text-[#F5C518] font-bold uppercase tracking-widest">
            {label}
          </label>
        )}
        
        <div className="relative border-2 border-dashed border-[#333] rounded-2xl p-6 bg-[#121212] hover:border-[#F5C518] transition-all group flex flex-col items-center justify-center min-h-[120px] shadow-inner">
          
          <IKUpload
            fileName="wind_product_upload.jpg"
            useUniqueFileName={true}
            onUploadStart={() => setLoading(true)}
            onSuccess={(res) => {
              setLoading(false);
              onUploadSuccess(res.url); // إرسال رابط الصورة لصفحة المنتج
            }}
            onError={(err) => {
              console.error("خطأ أثناء الرفع:", err);
              setLoading(false);
            }}
            // جعل منطقة الرفع تغطي المساحة بالكامل
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />

          <div className="text-center pointer-events-none transition-transform group-hover:scale-110">
             <span className="text-3xl block mb-2">{loading ? "⏳" : "📤"}</span>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">
               {loading ? "جاري الرفع لـ ويند..." : "اضغط هنا لإضافة صورة للمنتج"}
             </p>
          </div>
        </div>
      </div>
    </ImageKitProvider>
  );
}