"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, orderBy } from "firebase/firestore";
import { 
  Star, CheckCircle2, XCircle, Trash2, Plus, 
  MessageSquare, Search, Filter, AlertTriangle, X
} from "lucide-react";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  
  // متغيرات إضافة تقييم يدوي
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newReview, setNewReview] = useState({
    customerName: '',
    productName: '',
    rating: 5,
    comment: '',
    status: 'approved' // التقييم اللي هتضيفه بإيدك هيكون مقبول تلقائياً
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let result = reviews;
    if (activeFilter !== 'all') {
      result = result.filter(r => r.status === activeFilter);
    }
    if (searchQuery) {
      result = result.filter(r => 
        (r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredReviews(result);
  }, [activeFilter, searchQuery, reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "Reviews"));
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // ترتيب زمني: الأحدث أولاً
      fetchedReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "Reviews", id), { status: newStatus });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("حدث خطأ أثناء التحديث");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التقييم نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "Reviews", id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.customerName || !newReview.productName || !newReview.comment) {
      return alert("يرجى تعبئة جميع الحقول");
    }
    
    setIsAdding(true);
    try {
      const reviewData = {
        ...newReview,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "Reviews"), reviewData);
      
      setReviews([{ id: docRef.id, ...reviewData }, ...reviews]);
      setShowAddModal(false);
      setNewReview({ customerName: '', productName: '', rating: 5, comment: '', status: 'approved' });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإضافة");
    } finally {
      setIsAdding(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} size={14} className={i < rating ? "text-[#F5C518] fill-[#F5C518]" : "text-gray-300"} />
    ));
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <MessageSquare className="text-[#008060]" size={28} /> 
            إدارة التقييمات
          </h1>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#008060] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#006e52] transition-all"
          >
            <Plus size={18} />
            إضافة تقييم يدوي
          </button>
        </div>

        {/* فلاتر وبحث */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'pending', label: 'بانتظار الموافقة' },
              { id: 'approved', label: 'مقبول' },
              { id: 'rejected', label: 'مرفوض' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === f.id 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="ابحث في التقييمات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#008060] transition-all"
            />
          </div>
        </div>

        {/* قائمة التقييمات */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="animate-spin h-8 w-8 border-4 border-[#008060] border-t-transparent rounded-full mb-4"></span>
            <p className="text-gray-500 font-bold text-sm">جاري تحميل التقييمات...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center flex flex-col items-center shadow-sm">
            <MessageSquare size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-800 mb-1">لا توجد تقييمات</h3>
            <p className="text-sm text-gray-400">لم يتم العثور على أي تقييمات تطابق بحثك أو الفلتر المختار.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map(review => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">{review.customerName}</h3>
                    <p className="text-xs text-[#005bd3] font-bold mt-0.5 line-clamp-1 cursor-pointer hover:underline">{review.productName}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">"{review.comment}"</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex items-center gap-2">
                    {review.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-1 rounded font-black uppercase">قيد المراجعة</span>}
                    {review.status === 'approved' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded font-black uppercase">مقبول</span>}
                    {review.status === 'rejected' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded font-black uppercase">مرفوض</span>}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {review.status !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(review.id, 'approved')} title="قبول التقييم" className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(review.id, 'rejected')} title="رفض التقييم" className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                        <XCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(review.id)} title="حذف نهائي" className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal إضافة تقييم يدوي */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm slide-down">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowAddModal(false)} className="absolute top-5 left-5 p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={18} /></button>
              
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Star className="text-[#F5C518]" size={22} fill="#F5C518" />
                إضافة تقييم قديم
              </h3>
              
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم العميل</label>
                  <input type="text" required value={newReview.customerName} onChange={e => setNewReview({...newReview, customerName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#008060] transition-colors" placeholder="مثال: أحمد محمد" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم المنتج المرتبط بالتقييم</label>
                  <input type="text" required value={newReview.productName} onChange={e => setNewReview({...newReview, productName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#008060] transition-colors" placeholder="مثال: حذاء رياضي مريح" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">عدد النجوم (1 إلى 5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button type="button" key={num} onClick={() => setNewReview({...newReview, rating: num})} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black transition-all ${newReview.rating === num ? 'bg-[#F5C518] text-black shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">التعليق المكتوب</label>
                  <textarea required value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#008060] transition-colors resize-none h-28" placeholder="اكتب رأي العميل هنا..."></textarea>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isAdding} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                    {isAdding ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'حفظ التقييم ونشره'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .slide-down { animation: slideDown 0.2s ease-out forwards; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </div>
  );
}