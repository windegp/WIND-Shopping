"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Star, MessageSquarePlus, X, CheckCircle, ImageIcon } from 'lucide-react';

export default function ProductReviews({ productHandle, onReviewStatsUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالات إضافة تقييم جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, text: '', imageUrl: '' });
  const [hoverRating, setHoverRating] = useState(0);

  const fetchProductReviews = async () => {
    if(!productHandle) return;
    try {
      const q = query(collection(db, "Reviews"), where("productHandle", "==", productHandle));
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // الترتيب من الأحدث للأقدم
      fetchedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      setReviews(fetchedReviews);
      
      if(fetchedReviews.length > 0 && onReviewStatsUpdate) {
        const avg = (fetchedReviews.reduce((acc, r) => acc + r.rating, 0) / fetchedReviews.length);
        onReviewStatsUpdate(avg, fetchedReviews.length);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductReviews();
  }, [productHandle]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.text.trim()) return alert("يرجى كتابة رأيك أولاً");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "Reviews"), {
        productHandle: productHandle,
        reviewerName: newReview.name || "عميل مميز",
        rating: newReview.rating,
        text: newReview.text,
        date: new Date().toISOString(),
        status: "published",
        imageUrls: newReview.imageUrl ? [newReview.imageUrl] : [],
        source: "website"
      });
      
      setShowAddModal(false);
      setNewReview({ name: '', rating: 5, text: '', imageUrl: '' });
      fetchProductReviews(); // إعادة سحب التقييمات لتحديث الصفحة
    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="border-t border-[#333]/50 pt-10 pb-4" id="reviews-section" dir="rtl">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3" style={{fontFamily:"Cairo,sans-serif"}}>
            <div className="w-1.5 h-6 bg-[#F5C518] rounded-full shadow-[0_0_8px_rgba(245,197,24,0.4)]"></div>
            آراء عملائنا
          </h3>
          <p className="text-sm text-gray-400 mt-2 font-medium">تجارب حقيقية لعملاء WIND مع هذا المنتج</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-transparent border border-[#F5C518] text-[#F5C518] hover:bg-[#F5C518] hover:text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <MessageSquarePlus size={18} /> أضف تقييمك
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10 text-sm">جاري تحميل التقييمات...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center bg-[#1a1a1a] rounded-2xl p-8 border border-[#333]">
          <Star className="mx-auto text-gray-600 mb-3" size={32} />
          <p className="text-gray-400 font-bold">لا توجد تقييمات لهذا المنتج حتى الآن.</p>
          <p className="text-sm text-gray-500 mt-1">كن أول من يشاركنا رأيه!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#333] hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-1 text-[#F5C518]">
                   {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-600" : ""} />)}
                 </div>
                 <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">مشتري مؤكد</span>
              </div>
              
              <p className="text-gray-300 text-sm mb-5 leading-relaxed font-medium">"{review.text}"</p>
              
              {review.imageUrls && review.imageUrls.length > 0 && (
                <div className="mb-5">
                  <img src={review.imageUrls[0]} alt="Review image" className="w-20 h-24 object-cover rounded-lg border border-[#333]" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[#333]/50">
                 <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs font-black text-white">
                    {review.reviewerName.charAt(0)}
                 </div>
                 <div>
                   <p className="text-xs font-black text-gray-200">{review.reviewerName}</p>
                   <p className="text-[10px] text-gray-500">{new Date(review.date).toLocaleDateString('ar-EG')}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 Modal: أضف تقييمك */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#1a1a1a] rounded-3xl p-6 max-w-md w-full border border-[#333] shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 p-2 bg-[#2a2a2a] hover:bg-[#333] rounded-full text-gray-400 transition-colors"><X size={16} /></button>
            
            <h2 className="text-xl font-black text-white mb-6 font-cairo">أضف تقييمك للمنتج</h2>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* اختيار النجوم */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={ratingValue}
                      className={`transition-transform hover:scale-110 ${ratingValue <= (hoverRating || newReview.rating) ? "text-[#F5C518]" : "text-gray-600"}`}
                      onClick={() => setNewReview({ ...newReview, rating: ratingValue })}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star size={32} fill={ratingValue <= (hoverRating || newReview.rating) ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">اسمك (اختياري)</label>
                <input type="text" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} placeholder="الاسم الذي سيظهر في التقييم" className="w-full p-3 bg-[#121212] border border-[#333] rounded-xl text-white outline-none focus:border-[#F5C518]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">رأيك في المنتج *</label>
                <textarea required value={newReview.text} onChange={(e) => setNewReview({...newReview, text: e.target.value})} placeholder="شاركنا تجربتك مع الخامات، المقاس، والسرعة..." rows="4" className="w-full p-3 bg-[#121212] border border-[#333] rounded-xl text-white outline-none focus:border-[#F5C518] resize-none"></textarea>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-2">
                  <ImageIcon size={14} /> إضافة صورة (اختياري)
                </label>
                <input type="url" value={newReview.imageUrl} onChange={(e) => setNewReview({...newReview, imageUrl: e.target.value})} placeholder="ضع رابط الصورة هنا" className="w-full p-3 bg-[#121212] border border-[#333] rounded-xl text-white outline-none focus:border-[#F5C518] text-left" dir="ltr" />
                <p className="text-[10px] text-gray-500 mt-1">تلميح: يمكنك رفع الصورة على أي موقع ووضع الرابط هنا.</p>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-[#F5C518] text-black font-black text-base rounded-xl hover:bg-[#e6b800] transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(245,197,24,0.15)]">
                {isSubmitting ? "جاري الإرسال..." : <><CheckCircle size={18} /> نشر التقييم</>}
              </button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}