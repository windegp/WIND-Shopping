"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  FileText, Shield, RefreshCcw, Truck, 
  Save, CheckCircle2, AlertCircle 
} from "lucide-react";

// قائمة الصفحات الثابتة اللي هنبنيها
const pagesList = [
  { id: 'terms', title: 'الشروط والأحكام', icon: <FileText size={18} /> },
  { id: 'privacy', title: 'سياسة الخصوصية', icon: <Shield size={18} /> },
  { id: 'refund', title: 'الاستبدال والاسترجاع', icon: <RefreshCcw size={18} /> },
  { id: 'shipping', title: 'سياسة الشحن', icon: <Truck size={18} /> },
];

export default function StaticPagesAdmin() {
  const [activePage, setActivePage] = useState('terms');
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // سحب محتوى الصفحة من الفايربيس لما الأدمن يغير التاب
  useEffect(() => {
    fetchPageContent(activePage);
  }, [activePage]);

  const fetchPageContent = async (pageId) => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const docRef = doc(db, "Pages", pageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContent(docSnap.data().content || "");
      } else {
        setContent(""); // لو الصفحة لسه متكريتتش قبل كده
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    } finally {
      setLoading(false);
    }
  };

  // حفظ التعديلات في الفايربيس
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const docRef = doc(db, "Pages", activePage);
      await setDoc(docRef, {
        title: pagesList.find(p => p.id === activePage).title,
        content: content,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000); // إخفاء رسالة النجاح بعد 3 ثواني
    } catch (error) {
      console.error("Error saving page:", error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const activePageData = pagesList.find(p => p.id === activePage);

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <FileText className="text-[#008060]" size={28} /> 
            إدارة الصفحات الثابتة
          </h1>
          
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#008060] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#006e52] transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Save size={18} />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>

        {/* رسائل التنبيه */}
        {saveStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 animate-pulse">
            <CheckCircle2 size={20} />
            <p className="font-bold text-sm">تم حفظ التعديلات بنجاح! ستظهر فوراً في المتجر.</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} />
            <p className="font-bold text-sm">حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* القائمة الجانبية (Tabs) */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest">الصفحات</p>
            {pagesList.map((page) => (
              <button 
                key={page.id} 
                onClick={() => setActivePage(page.id)} 
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-bold text-sm ${
                  activePage === page.id 
                  ? 'bg-white shadow-sm border border-gray-200 text-[#008060]' 
                  : 'hover:bg-gray-200 text-gray-500 border border-transparent'
                }`}
              >
                {page.icon} 
                {page.title}
              </button>
            ))}
          </div>

          {/* مساحة التعديل (Editor) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-[#008060]">
                {activePageData.icon}
              </div>
              <div>
                <h2 className="font-black text-gray-800 text-lg">{activePageData.title}</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">يمكنك لصق النصوص مباشرة، سيتم الحفاظ على التنسيق والمسافات.</p>
              </div>
            </div>
            
            <div className="p-6 flex-1 relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <span className="animate-spin h-8 w-8 border-4 border-[#008060] border-t-transparent rounded-full"></span>
                </div>
              ) : null}
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`اكتب محتوى ${activePageData.title} هنا...`}
                className="w-full h-full min-h-[500px] p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/20 transition-all text-sm text-gray-800 leading-relaxed resize-y"
                dir="auto"
              ></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}