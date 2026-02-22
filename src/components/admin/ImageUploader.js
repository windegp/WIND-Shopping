"use client";
import React, { useState, useEffect } from "react";
// الاستيراد الرسمي والمباشر
import { ImageKitProvider, IKUpload } from "@imagekit/next";

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

export default function ImageUploader({ onUploadSuccess, label }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // لمنع تعارض الـ SSR مع الـ Client في React 19
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-24 bg-[#121212] rounded-xl animate-pulse"></div>;

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <div className="flex flex-col gap-2">
        {label && <label className="text-[11px] text-[#F5C518] font-bold uppercase tracking-widest">{label}</label>}
        
        <div className="relative border-2 border-dashed border-[#333] rounded-2xl p-6 bg-[#121212] hover:border-[#F5C518] transition-all group flex flex-col items-center justify-center min-h-[120px]">
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
             <span className="text-3xl block mb-2">{loading ? "⏳" : "📸"}</span>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
               {loading ? "جاري الرفع لـ WIND..." : "اضغط لرفع صورة"}
             </p>
          </div>
        </div>
      </div>
    </ImageKitProvider>
  );
}