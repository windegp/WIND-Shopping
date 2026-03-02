"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  ShieldCheck, Truck, RefreshCw, Scale, 
  Save, CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";

// تعريف السياسات بـ IDs واضحة لجوجل وللسيستم
const policiesList = [
  { id: 'shipping-policy', title: 'سياسة الشحن', icon: <Truck size={18} /> },
  { id: 'refund-policy', title: 'سياسة الاستبدال والاسترجاع', icon: <RefreshCw size={18} /> },
  { id: 'terms-of-service', title: 'الشروط والأحكام', icon: <Scale size={18} /> },
  { id: 'privacy-policy', title: 'سياسة الخصوصية', icon: <ShieldCheck size={18} /> },
];

export default function PoliciesAdmin() {
  const [activePolicy, setActivePolicy] = useState('shipping-policy');
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // success | error

  // جلب البيانات عند تغيير السياسة المختارة
  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const docRef = doc(db, "Policies", activePolicy);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content || "");
        } else {
          setContent("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [activePolicy]);

  // حفظ البيانات
  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const docRef = doc(db, "Policies", activePolicy);
      await setDoc(docRef, {
        id: activePolicy,
        title: policiesList.find(p => p.id === activePolicy).title,
        content: content,
        lastUpdate: new Date().toISOString()
      }, { merge: true });
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const activeData = policiesList.find(p => p.id === activePolicy);

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">السياسات القانونية</h1>
            <p className="text-xs text-gray-500 font-bold mt-1">تعديل سياسات المتجر التي تظهر للعملاء في أسفل الموقع</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#008060] text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm hover:bg-[#006e52] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 slide-down">
            <CheckCircle2 size={18} />
            <p className="text-sm font-bold">تم التحديث بنجاح! التعديلات الآن مباشرة على الموقع.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* الجانب الأيمن: القائمة */}
          <div className="lg:col-span-1 space-y-2">
            {policiesList.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePolicy(p.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                  activePolicy === p.id 
                  ? 'bg-white shadow-md border border-gray-100 text-[#008060]' 
                  : 'hover:bg-gray-200 text-gray-500 border border-transparent'
                }`}
              >
                <span className={activePolicy === p.id ? 'text-[#008060]' : 'text-gray-400'}>{p.icon}</span>
                {p.title}
              </button>
            ))}
          </div>

          {/* الجانب الأيسر: المحرر */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
              <h2 className="font-black text-gray-800 flex items-center gap-2">
                تعديل: {activeData.title}
              </h2>
            </div>
            
            <div className="flex-1 p-6 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-[#008060]" />
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="انسخ محتوى السياسة من شوبيفاي والزقه هنا..."
                className="w-full h-full min-h-[500px] p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#008060] transition-all text-sm leading-relaxed text-gray-700"
              />
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}