"use client";
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Star, X, CheckCircle, ImageIcon } from 'lucide-react';

export default function ProductReviews({ productHandle, onReviewStatsUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالات إضافة تقييم جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, text: '', imageUrl: '' });
  const [hoverRating, setHoverRating] = useState(0);

  // مراجع للتحكم في الشريط المتحرك (السحب والإفلات)
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const fetchProductReviews = async () => {
    if(!productHandle) return;
    try {
      const q = query(collection(db, "Reviews"), where("productHandle", "==", productHandle));
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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

  // 🔥 ضبط موضع البداية في المنتصف لضمان التمرير اللانهائي
  useEffect(() => {
    if (scrollRef.current && reviews.length > 0) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2;
    }
  }, [reviews]);

  // 🔥 محرك التمرير التلقائي (يتجه لليمين، ويقف عند اللمس)
  useEffect(() => {
    let animationId;
    const scroll = () => {
      if (scrollRef.current && !isPaused && !isDragging.current) {
        // تقليل الـ scrollLeft بيخلي العناصر تتحرك ناحية اليمين (نفس اتجاه طلبك)
        scrollRef.current.scrollLeft -= 1; 
        
        // حيلة التمرير اللانهائي (لما يوصل لأقصى اليسار يرجع للنص بذكاء)
        if (scrollRef.current.scrollLeft <= 0) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // دوال السحب بالماوس (للدسكتوب)
  const handleMouseDown = (e) => {
    isDragging.current = true;
    setIsPaused(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };
  const handleMouseLeave = () => { isDragging.current = false; setIsPaused(false); };
  const handleMouseUp = () => { isDragging.current = false; setIsPaused(false); };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // سرعة السحب
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

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
    } catch (error) {
      console.error("Error adding review:", error);
      alert("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // تكرار التقييمات لخلق حلقة لا نهائية للمتحرك
  const infiniteReviews = Array(6).fill(reviews).flat();

  return (
    <>
      <section className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222] mt-10" id="reviews-section" dir="rtl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right px-6">
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
            <div className="text-center text-[#F5C518] py-10 text-sm font-bold animate-pulse px-6">جاري سحب التقييمات...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center bg-[#121212] rounded-lg p-10 border border-[#333] mx-6">
              <Star className="mx-auto text-[#333] mb-4" size={40} />
              <p className="text-gray-400 font-bold mb-2">كن أول من يشاركنا رأيه في هذا المنتج!</p>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing">
              {/* شريط الكروت المتحرك */}
              <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto hide-scrollbar py-4 px-6"
                dir="ltr" // ضروري لتوحيد سلوك التمرير عبر كل المتصفحات
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                {infiniteReviews.map((rev, index) => (
                  <div key={`${rev.id || index}-${index}`} className="min-w-[300px] md:min-w-[380px] bg-[#121212] border border-[#333] p-6 rounded-2xl flex flex-col items-center shrink-0 hover:border-[#F5C518]/40 transition-colors" dir="rtl">
                    
                    {/* الاسم، التوثيق، النجوم */}
                    <div className="flex flex-col items-center mb-6 w-full">
                      <div className="flex items-center gap-1.5 justify-center mb-2">
                        <span className="text-white font-black text-base" style={{fontFamily:"Cairo,sans-serif"}}>{rev.reviewerName}</span>
                        <CheckCircle size={14} className="text-[#F5C518]" />
                        <span className="text-[#F5C518] text-[10px] font-bold">موثق</span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "#F5C518" : "none"} className={i < rev.rating ? "text-[#F5C518]" : "text-[#333]"} />
                        ))}
                      </div>
                    </div>

                    {/* إطار التقييم الشفاف بالنص الناعم */}
                    <div className="w-full bg-transparent border border-white/10 rounded-xl p-5 text-center mt-auto flex-1 flex items-center justify-center shadow-inner">
                      <p className="text-gray-300 text-[14px] leading-relaxed font-medium" style={{fontFamily:"Tajawal,sans-serif"}}>
                        {rev.text}
                      </p>
                    </div>

                    {/* صورة العميل (إن وجدت) */}
                    {rev.imageUrls?.length > 0 && (
                      <div className="mt-4 flex justify-center w-full">
                        <img src={rev.imageUrls[0]} alt="تصوير العميل" className="w-16 h-16 object-cover rounded-lg border border-[#333]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* نافذة إضافة تقييم */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" dir="rtl">
          <div className="bg-[#121212] rounded-lg p-6 max-w-md w-full border border-[#333] shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 p-2 bg-[#1a1a1a] hover:bg-[#333] rounded-full text-gray-400 transition-colors"><X size={16} /></button>
            
            <h2 className="text-xl font-black text-white mb-6 tracking-tighter" style={{fontFamily:"Cairo,sans-serif"}}>شاركنا تجربتك</h2>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
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