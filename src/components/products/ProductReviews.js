"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Star, X, CheckCircle, ImageIcon, ChevronRight, ChevronLeft } from 'lucide-react';

export default function ProductReviews({ productHandle, onReviewStatsUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالات التنقل بين التقييمات (Pagination)
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2; // عرض كارتين فقط في كل مرة
  const totalPages = Math.ceil(reviews.length / itemsPerPage);

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
      fetchProductReviews(); 
      setCurrentPage(0); // العودة للصفحة الأولى لرؤية التقييم الجديد
    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // دوال التنقل بين التقييمات
  const nextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(p => p - 1); };

  // تحديد الكروت التي ستظهر حالياً
  const currentReviews = reviews.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <>
      <section className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222] mt-10" id="reviews-section" dir="rtl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          
          {/* الهيدر وزر الإضافة */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter" style={{fontFamily:"Cairo,sans-serif"}}>آراء عائلة WIND</h2>
              <p className="text-[#F5C518] text-sm font-bold mt-2 uppercase tracking-[0.2em]" style={{fontFamily:"Cairo,sans-serif"}}>أصوات حقيقية - تجارب صادقة</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-transparent border-2 border-[#F5C518] text-[#F5C518] px-8 py-3 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 rounded-sm"
              style={{fontFamily:"Cairo,sans-serif"}}
            >
              + أضف تجربتك
            </button>
          </div>

          {loading ? (
            <div className="text-center text-[#F5C518] py-10 text-sm font-bold animate-pulse">جاري سحب التقييمات...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center bg-[#121212] rounded-lg p-10 border border-[#333]">
              <Star className="mx-auto text-[#333] mb-4" size={40} />
              <p className="text-gray-400 font-bold mb-2">كن أول من يشاركنا رأيه في هذا المنتج!</p>
            </div>
          ) : (
            <>
              {/* عرض الكروت المحددة (2 كارت كحد أقصى) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
                {currentReviews.map((rev, index) => (
                  <div key={`${rev.id}-${index}`} className="bg-[#121212] border border-[#333] p-6 rounded-lg hover:border-[#F5C518]/50 transition-all duration-500 flex flex-col justify-between animate-[fadeIn_0.5s_ease-out]">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black text-lg border border-[#333] shrink-0">
                          {rev.reviewerName?.charAt(0) || 'W'}
                        </div>
                        <div className="text-right">
                          <h4 className="text-white font-black text-sm" style={{fontFamily:"Cairo,sans-serif"}}>{rev.reviewerName}</h4>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-[12px] ${i < rev.rating ? 'text-[#F5C518]' : 'text-[#333]'}`}>★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed italic text-right mb-4">"{rev.text}"</p>
                    </div>
                    
                    {/* عرض صورة التقييم لو العميل رفع صورة */}
                    {rev.imageUrls && rev.imageUrls.length > 0 && (
                      <div className="mt-2">
                        <img src={rev.imageUrls[0]} alt="تصوير العميل" className="w-20 h-24 object-cover rounded-md border border-[#333]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* أزرار التنقل (Arrows & Dots) تظهر فقط لو في أكتر من صفحة */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-10">
                  {/* السهم اليمين (السابق) */}
                  <button 
                    onClick={prevPage} 
                    disabled={currentPage === 0}
                    className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:border-[#F5C518] hover:text-[#F5C518] disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* النقاط (Dots) */}
                  <div className="flex items-center gap-2" dir="ltr">
                    {Array.from({length: totalPages}).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPage(i)}
                        className={`transition-all duration-300 rounded-full ${i === currentPage ? 'w-6 h-1.5 bg-[#F5C518]' : 'w-1.5 h-1.5 bg-[#333] hover:bg-[#555]'}`}
                      />
                    ))}
                  </div>

                  {/* السهم اليسار (التالي) */}
                  <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages - 1}
                    className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:border-[#F5C518] hover:text-[#F5C518] disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-white transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 🔥 Modal: أضف تجربتك (تصميم داكن متناسق) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" dir="rtl">
          <div className="bg-[#121212] rounded-lg p-6 max-w-md w-full border border-[#333] shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 p-2 bg-[#1a1a1a] hover:bg-[#333] rounded-full text-gray-400 transition-colors"><X size={16} /></button>
            
            <h2 className="text-xl font-black text-white mb-6 tracking-tighter" style={{fontFamily:"Cairo,sans-serif"}}>شاركنا تجربتك</h2>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* اختيار النجوم */}
              <div className="flex items-center justify-center gap-2 mb-6" dir="ltr">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={ratingValue}
                      className={`transition-transform hover:scale-110 ${ratingValue <= (hoverRating || newReview.rating) ? "text-[#F5C518]" : "text-[#333]"}`}
                      onClick={() => setNewReview({ ...newReview, rating: ratingValue })}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star size={36} fill={ratingValue <= (hoverRating || newReview.rating) ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">الاسم (اختياري)</label>
                <input type="text" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} placeholder="الاسم الذي سيظهر للعملاء" className="w-full p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white outline-none focus:border-[#F5C518] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">رأيك *</label>
                <textarea required value={newReview.text} onChange={(e) => setNewReview({...newReview, text: e.target.value})} placeholder="صف لنا تجربتك مع جودة المنتج وسرعة التوصيل..." rows="4" className="w-full p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white outline-none focus:border-[#F5C518] resize-none transition-colors"></textarea>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-2">
                  <ImageIcon size={14} /> إضافة صورة (اختياري)
                </label>
                <input type="url" value={newReview.imageUrl} onChange={(e) => setNewReview({...newReview, imageUrl: e.target.value})} placeholder="رابط الصورة (URL)" className="w-full p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white outline-none focus:border-[#F5C518] text-left transition-colors" dir="ltr" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-transparent border-2 border-[#F5C518] text-[#F5C518] font-black text-sm rounded-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 flex justify-center items-center gap-2" style={{fontFamily:"Cairo,sans-serif"}}>
                {isSubmitting ? "جاري الإرسال..." : "تأكيد وإرسال"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}