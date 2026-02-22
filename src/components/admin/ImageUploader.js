"use client";
import React, { useState } from "react";
// 1. استيراد المكتبة بالكامل ككائن واحد لتجنب أخطاء الـ Named Export
import * as ImageKitNext from "@imagekit/next";

// 2. استخراج المكونات يدوياً من الكائن
const { ImageKitProvider, IKUpload } = ImageKitNext;

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit-auth");
    if (!response.ok) throw new Error("Authentication failed");
    return await response.json();
  } catch (err) {
    throw new Error(`Authentication error: ${err.message}`);
  }
};

// 3. التصدير الافتراضي (Default Export) اللي كان عامل مشكلة
export default function ImageUploader({ onUploadSuccess, label }) {
  const [loading, setLoading] = useState(false);

  // تأكد من أن المكونات موجودة فعلاً قبل الرندرة
  if (!IKUpload || !ImageKitProvider) {
    return <div className="text-red-500 text-xs text-right">خطأ: مكتبة ImageKit لم يتم تحميلها بشكل صحيح.</div>;
  }

  return (
    <ImageKitProvider 
      publicKey={publicKey} 
      urlEndpoint={urlEndpoint} 
      authenticator={authenticator}
    >
      <div className="flex flex-col gap-2">
        {label && <label className="text-[11px] text-[#F5C518] font-bold uppercase">{label}</label>}
        
        <div className="relative border-2 border-dashed border-[#333] rounded-xl p-4 bg-[#121212] hover:border-[#F5C518] transition-all group flex flex-col items-center justify-center min-h-[100px]">
          <IKUpload
            fileName="wind_product.jpg"
            useUniqueFileName={true}
            onUploadStart={() => setLoading(true)}
            onSuccess={(res) => {
              setLoading(false);
              onUploadSuccess(res.url);
            }}
            onError={(err) => {
              console.error("Upload Error:", err);
              setLoading(false);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />
          <div className="text-center pointer-events-none">
             <span className="text-2xl block mb-1">{loading ? "⏳" : "📸"}</span>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
               {loading ? "جاري الرفع..." : "اضغط لرفع صورة لـ WIND"}
             </p>
          </div>
        </div>
      </div>
    </ImageKitProvider>
  );
}