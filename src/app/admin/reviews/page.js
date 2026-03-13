"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, getDocs, addDoc, deleteDoc, doc, writeBatch, orderBy } from "firebase/firestore";
import Papa from 'papaparse';
import { Star, Upload, Plus, Trash2, MessageSquare, Image as ImageIcon, X, CheckCircle } from "lucide-react";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // متغيرات إضافة تقييم يدوي
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newReview, setNewReview] = useState({
    productHandle: '',
    reviewerName: '',
    rating: 5,
    text: '',
    imageUrl: '' // رابط الصورة من ImageKit
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "Reviews"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(docs);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 دالة رفع وقراءة شيت الإكسيل (CSV) الذي أرفقته
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batch = writeBatch(db);
          let count = 0;
          
          results.data.forEach((row) => {
            // التحقق من وجود الأعمدة الأساسية (صيغة Judge.me)
            if (row.body && row.rating && row.product_handle) {
              const reviewRef = doc(collection(db, "Reviews"));
              batch.set(reviewRef, {
                productHandle: row.product_handle.trim(),
                reviewerName: row.reviewer_name || "عميل WIND",
                rating: Number(row.rating),
                text: row.body,
                date: row.review_date || new Date().toISOString(),
                status: "published",
                imageUrls: row.picture_urls ? row.picture_urls.split(',') : [],
                source: "csv_import"
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            alert(`تم رفع ${count} تقييم بنجاح إلى قاعدة البيانات!`);
            fetchReviews();
          } else {
            alert("لم يتم العثور على بيانات مطابقة، تأكد من صيغة الملف.");
          }
        } catch (error) {
          console.error("Error uploading batch:", error);
          alert("حدث خطأ أثناء الرفع.");
        } finally {
          setIsUploading(false);
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    });
  };

  // 🔥 دالة الإضافة اليدوية
  const handleAddManualReview = async (e) => {
    e.preventDefault();
    if (!newReview.productHandle || !newReview.text) return alert("يرجى إدخال رابط المنتج ونص التقييم");
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, "Reviews"), {
        productHandle: newReview.productHandle.trim(),
        reviewerName: newReview.reviewerName || "عميل WIND",
        rating: Number(newReview.rating),
        text: newReview.text,
        date: new Date().toISOString(),
        status: "published",
        imageUrls: newReview.imageUrl ? [newReview.imageUrl] : [],
        source: "manual"
      });
      setShowAddModal(false);
      fetchReviews();
      setNewReview({ productHandle: '', reviewerName: '', rating: 5, text: '', imageUrl: '' });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإضافة.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
    try {
      await deleteDoc(doc(db, "Reviews", id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <MessageSquare className="text-[#008060]" /> إدارة التقييمات
          </h1>
          
          <div className="flex items-center gap-3">
            {/* زر رفع الشيت */}
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-white border border-[#008060] text-[#008060] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-50 transition-all">
              {isUploading ? <span className="animate-spin h-4 w-4 border-2 border-[#008060] border-t-transparent rounded-full"></span> : <Upload size={16} />}
              رفع شيت التقييمات (CSV)
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            {/* زر الإضافة اليدوية */}
            <button onClick={() => setShowAddModal(true)} className="bg-[#008060] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#006e52] transition-all">
              <Plus size={16} /> إضافة تقييم يدوي
            </button>
          </div>
        </div>

        {/* جدول التقييمات */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-6 py-4">المنتج (الرابط)</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4 text-center">النجوم</th>
                  <th className="px-6 py-4">التقييم</th>
                  <th className="px-6 py-4 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? <tr><td colSpan="5" className="text-center py-10">جاري التحميل...</td></tr> : 
                  reviews.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-gray-400 font-bold">لا توجد تقييمات حالياً</td></tr> :
                  reviews.map(review => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-600">{review.productHandle}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{review.reviewerName}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center text-yellow-400">
                          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <p className="line-clamp-2">{review.text}</p>
                        {review.imageUrls?.length > 0 && <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold"><ImageIcon size={12}/> يحتوي على صورة</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* المودال: إضافة تقييم يدوي */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative slide-down">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
              <h2 className="text-xl font-black text-gray-900 mb-6">إضافة تقييم جديد</h2>
              
              <form onSubmit={handleAddManualReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">رابط المنتج (Handle) *</label>
                  <input type="text" required value={newReview.productHandle} onChange={(e) => setNewReview({...newReview, productHandle: e.target.value})} placeholder="مثال: long-knit-cardigan" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060]" dir="ltr" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">اسم العميل</label>
                    <input type="text" value={newReview.reviewerName} onChange={(e) => setNewReview({...newReview, reviewerName: e.target.value})} placeholder="مثال: سارة أحمد" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">النجوم (1 إلى 5)</label>
                    <input type="number" min="1" max="5" value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">نص التقييم *</label>
                  <textarea required value={newReview.text} onChange={(e) => setNewReview({...newReview, text: e.target.value})} placeholder="مثال: خامة ممتازة وتدفئة رائعة..." rows="3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060]"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">رابط صورة التقييم (من ImageKit)</label>
                  <input type="url" value={newReview.imageUrl} onChange={(e) => setNewReview({...newReview, imageUrl: e.target.value})} placeholder="https://ik.imagekit.io/..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#008060]" dir="ltr" />
                </div>

                <button type="submit" disabled={isAdding} className="w-full py-3.5 mt-4 bg-[#008060] text-white font-black rounded-xl hover:bg-[#006e52] transition-colors flex justify-center items-center gap-2">
                  {isAdding ? "جاري الإضافة..." : <><CheckCircle size={18} /> حفظ التقييم</>}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}