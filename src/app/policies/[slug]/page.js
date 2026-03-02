"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function DynamicPolicyPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const docRef = doc(db, "Policies", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
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
        /* شلنا الفراغات اللي كانت بتخنق التصميم من برة */
        .policy-wrapper {
          background: #000;
          min-height: 100vh;
          color: #fff;
          padding: 0; /* تم إزالة الـ padding الكبير */
          font-family: 'Cairo', sans-serif;
          overflow-x: hidden;
        }
        .html-content {
          width: 100%;
        }
      `}</style>

      {/* المحتوى الجاي من الأدمن هيتعرض هنا مباشرة بملء الشاشة */}
      <main 
        className="html-content"
        dangerouslySetInnerHTML={{ __html: data?.htmlContent || "<p className='text-center mt-10'>لا يوجد محتوى متاح حالياً.</p>" }} 
      />
    </div>
  );
}