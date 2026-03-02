"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function DynamicPolicyPage() {
  const { slug } = useParams(); // بياخد اسم السياسة من الرابط (مثل shipping-policy)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const docRef = doc(db, "Policies", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
          // تحديث بيانات جوجل SEO
          document.title = `${docSnap.data().title} | WIND Shopping`;
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (slug) fetchPolicy();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-[#F5C518]" size={40} />
    </div>
  );

  return (
    <div className="policy-wrapper" dir="rtl">
      <style jsx>{`
        .policy-wrapper {
          background: #000;
          min-height: 100vh;
          color: #fff;
          padding: 80px 20px;
          font-family: 'Cairo', sans-serif;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header { text-align: center; margin-bottom: 60px; }
        .logo { width: 90px; border-radius: 15px; margin-bottom: 20px; }
        .title { font-size: 2rem; font-weight: 900; color: #F5C518; }
        
        /* 🔥 تنسيق الـ HTML اللي جاي من الأدمن */
        .html-content {
          line-height: 2;
          font-size: 1rem;
          color: #ccc;
        }
        .html-content :global(h2), .html-content :global(h3) { color: #fff; margin-top: 30px; font-weight: 800; }
        .html-content :global(strong) { color: #F5C518; }
        .html-content :global(ul) { list-style: disc; padding-right: 25px; margin: 20px 0; }
        .html-content :global(a) { color: #F5C518; text-decoration: underline; }
      `}</style>

      <div className="container">
        <header className="header">
          <img src="https://ik.imagekit.io/windeg/WIND_Shopping/logo_0WuyNIRzi.jpg?updatedAt=1772130133302" alt="WIND" className="logo" />
          <h1 className="title">{data?.title}</h1>
        </header>

        <main 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: data?.htmlContent || "<p className='text-center'>لا يوجد محتوى متاح حالياً.</p>" }} 
        />
      </div>
    </div>
  );
}