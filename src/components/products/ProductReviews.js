"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Star } from 'lucide-react';

export default function ProductReviews({ productHandle }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!productHandle) return;
    const fetchProductReviews = async () => {
      try {
        const q = query(collection(db, "Reviews"), where("productHandle", "==", productHandle));
        const snap = await getDocs(q);
        const fetchedReviews = snap.docs.map(doc => doc.data());
        
        // الترتيب من الأحدث للأقدم
        fetchedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductReviews();
  }, [productHandle]);

  if (loading) return null;
  if (reviews.length === 0) return null; 

  // حساب متوسط التقييمات
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="mt-16 border-t border-gray-100 pt-12" id="reviews-section">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            آراء عملاء WIND
          </h3>
          <p className="text-sm text-gray-500 mt-1">تجارب حقيقية لعملائنا مع هذا المنتج</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
          <div className="flex text-yellow-400">
             {[...Array(5)].map((_, i) => <Star key={i} size={18} fill={i < Math.round(avgRating) ? "currentColor" : "none"} className={i >= Math.round(avgRating) ? "text-gray-300" : ""} />)}
          </div>
          <span className="font-black text-xl text-gray-900">{avgRating}</span>
          <span className="text-sm font-bold text-gray-400">({reviews.length} تقييم)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className="flex gap-1 text-yellow-400">
                 {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />)}
               </div>
               <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">مشتري مؤكد</span>
            </div>
            <p className="text-gray-800 text-sm font-bold mb-5 leading-relaxed">"{review.text}"</p>
            
            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="mb-4">
                <img src={review.imageUrls[0]} alt="Review image" className="w-24 h-24 object-cover rounded-xl border border-gray-100" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-auto">
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                  {review.reviewerName.charAt(0)}
               </div>
               <div>
                 <p className="text-xs font-black text-gray-900">{review.reviewerName}</p>
                 <p className="text-[10px] text-gray-400">{new Date(review.date).toLocaleDateString('ar-EG')}</p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}