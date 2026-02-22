"use client";
import React, { useState } from "react";
// لاحظ الاستيراد من المكتبة الرسمية @imagekit/next
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
  const [loading, setLoading] = useState(false);

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
               {loading ? "جاري الرفع لـ WIND..." : "اضغط لرفع صورة"}
             </p>
          </div>
        </div>
      </div>
    </ImageKitProvider>
  );
}