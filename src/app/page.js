"use client";
import { useState, useEffect } from 'react';
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { products } from "../lib/products";
import Link from 'next/link';

// استيراد إعدادات Firebase
import { db, storage } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- تأثيرات الحركة (CSS في JS) ---
const styles = {
  kenBurns: {
    animation: 'kenburns 20s infinite alternate',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(5px)',
  }
};

// --- مكون الهيدر (كما هو) ---
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
      عرض الكل <span className="text-xl leading-none">›</span>
    </Link>
  </div>
);

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // حالة المودال
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });

  // تصنيف المنتجات
  const bestSellers = products.slice(0, 4);
  const newArrivals = products.slice(4, 9); // زدنا العدد لتصميم الـ Grid
  const topRated = products.filter(p => parseFloat(p.rating) >= 4.9);
  const isdalat = products.filter(p => p.category === 'isdal');
  const shawls = products.filter(p => p.category === 'shawl');
  const discounts = products.filter(p => p.oldPrice);

  useEffect(() => {
    // إضافة Keyframes للأنيميشن ديناميكياً
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes kenburns {
        0% { transform: scale(1); }
        100% { transform: scale(1.15); }
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(styleSheet);

    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });
    return () => {
      unsubscribe();
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال الاسم والتعليق");
    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        console.log("Uploading image...");
        const imageRef = ref(storage, `reviews/${Date.now()}_${newReview.image.name}`);
        const snapshot = await uploadBytes(imageRef, newReview.image);
        url = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded:", url);
      }
      
      await addDoc(collection(db, "reviews"), {
        userName: newReview.name,
        userComment: newReview.comment,
        userImage: url,
        rating: Number(newReview.rating),
        productHandle: "home_page",
        timestamp: serverTimestamp()
      });
      
      setNewReview({ name: '', comment: '', rating: 10, image: null });
      setIsReviewModalOpen(false); // إغلاق المودال بعد النجاح
      alert("شكراً لتقييمك! تم النشر بنجاح.");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert(`حدث خطأ: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
      
      {/* ===== REVIEW POPUP MODAL ===== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] shadow-[0_0_30px_rgba(245,197,24,0.1)] relative animate-[fadeIn_0.3s_ease-out]">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold text-xl"
            >✕</button>
            
            <div className="p-8">
              <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
              <p className="text-gray-400 text-xs text-center mb-6">شاركنا تجربتك مع منتجات WIND</p>
              
              <form onSubmit={handleSendReview} className="space-y-4">
                <input 
                  type="text" placeholder="الاسم" 
                  className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white focus:border-[#F5C518] outline-none rounded-sm"
                  value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} 
                />
                <select 
                  className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-[#F5C518] outline-none rounded-sm"
                  value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
                >
                  {[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}
                </select>
                <textarea 
                  placeholder="اكتب تجربتك..." 
                  className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white h-24 focus:border-[#F5C518] outline-none rounded-sm resize-none"
                  value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} 
                />
                <div className="border border-dashed border-[#444] p-4 text-center rounded-sm cursor-pointer hover:bg-[#222] transition relative">
                   <p className="text-gray-400 text-xs">{newReview.image ? newReview.image.name : "اضغط لرفع صورة (اختياري)"}</p>
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewReview({...newReview, image: e.target.files[0]})} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm uppercase tracking-wide hover:bg-[#ffdb4d] transition-colors rounded-sm">
                  {loading ? 'جاري النشر...' : 'نشر التقييم'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <HeroSection />

      {/* 1. أهم الاختيارات لك (Carousel Classis) */}
      <section>
        <SectionHeader title="أهم الاختيارات لك" subTitle="بناءً على ذوقك الرفيع" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start transform hover:scale-[1.02] transition-transform duration-300">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 2. الأكثر مبيعاً (تصميم Highlight - كارت كبير بجانبه قائمة) */}
      <section className="bg-[#181818] py-8 my-4 border-y border-[#222]">
        <div className="px-4 mb-4" dir="rtl">
           <h2 className="text-xl md:text-2xl font-black text-white tracking-tight border-r-4 border-[#F5C518] pr-3">الأكثر مبيعاً</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
          {/* الكارت المميز الكبير */}
          {bestSellers[0] && (
            <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative group">
              <div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">الأول مبيعاً #1</div>
              <ProductCard {...bestSellers[0]} />
            </div>
          )}
          {/* باقي القائمة Grid */}
          <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">
             {bestSellers.slice(1, 5).map(p => (
               <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>
             ))}
          </div>
        </div>
      </section>

      {/* 3. التقييمات العامة (شريط الثقة) */}
      <section className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
        <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
          <div className="group">
            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4>
            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">تقييم العملاء</p>
          </div>
          <div className="w-px h-10 bg-[#333]"></div>
          <div className="group">
            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">+10k</h4>
            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">قطعة بيعت</p>
          </div>
          <div className="w-px h-10 bg-[#333]"></div>
          <div className="group">
            <h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">100%</h4>
            <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">ضمان الجودة</p>
          </div>
        </div>
      </section>

      {/* 4. مجموعات مميزة (Grid Layout) */}
      <div className="my-10">
        <SectionHeader title="مجموعات مميزة" />
        <CollectionsSection />
      </div>

      {/* 5. آراء وتجارب العملاء (مع زر المودال) */}
      <section className="bg-[#1a1a1a] py-16 relative overflow-hidden">
        {/* خلفية جمالية خفيفة */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        <div className="max-w-[1280px] mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
             <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">آراء عائلة WIND</h2>
                <p className="text-[#F5C518] text-xs font-bold mt-2 uppercase tracking-wide">أصوات حقيقية .. تجارب دافئة</p>
             </div>
             <button 
               onClick={() => setIsReviewModalOpen(true)}
               className="bg-[#F5C518] text-black px-6 py-3 font-black text-sm hover:scale-105 transition-transform shadow-[0_4px_14px_0_rgba(245,197,24,0.39)]"
             >
               + أضف تجربتك
             </button>
          </div>

          {/* Masonry-style Grid للتقييمات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.slice(0, 6).map((rev, index) => (
              <div key={rev.id} className={`bg-[#222] border border-[#333] p-5 rounded-sm hover:border-[#F5C518] transition-colors duration-300 ${index === 0 ? 'md:col-span-2 md:row-span-1 bg-[#252525]' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2">
                     {rev.userImage ? <img src={rev.userImage} className="w-10 h-10 rounded-full object-cover border border-[#444]" /> : <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-[#F5C518] font-bold">{rev.userName.charAt(0)}</div>}
                     <div>
                       <h4 className="text-white font-bold text-xs">{rev.userName}</h4>
                       <span className="text-[#F5C518] font-black text-xs">★ {rev.rating}</span>
                     </div>
                   </div>
                   <span className="text-[10px] text-gray-500">{rev.timestamp?.toDate ? new Date(rev.timestamp.toDate()).toLocaleDateString('ar-EG') : ''}</span>
                </div>
                <p className={`text-gray-300 text-sm italic leading-relaxed ${index === 0 ? 'text-base' : 'line-clamp-4'}`}>"{rev.userComment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. وصل حديثاً (تصميم شريطي) */}
      <section className="my-12">
        <SectionHeader title="وصل حديثاً" subTitle="أحدث صيحات الشتاء" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {newArrivals.map((product) => (
            <div key={product.id} className="min-w-[170px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 7. آخر الأخبار (Magazine Style) */}
      <section className="px-4 max-w-[1280px] mx-auto my-16">
        <SectionHeader title="WIND Magazine" subTitle="مقالات في الأناقة" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {[{ id: 1, title: "فن اختيار الشال المناسب لبشرتك", tag: "نصائح", img: "/images/blog1.webp" }, { id: 2, title: "رحلة الخيط: من المصنع إليك", tag: "قصتنا", img: "/images/blog2.webp" }].map((art) => (
            <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
              {/* هنا المفروض صورة المقال، استبدلتها بلون للتوضيح */}
              <div className="absolute inset-0 bg-[#333] group-hover:scale-110 transition-transform duration-[2s]"></div> 
              <div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black via-black/60 to-transparent">
                <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span>
                <h3 className="text-white font-black text-xl group-hover:text-[#F5C518] transition-colors">{art.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. الأعلى تقييماً */}
      <section className="px-4 mb-12">
        <SectionHeader title="الأعلى تقييماً" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topRated.map((product) => <ProductCard key={product.id} {...product} />)}
        </div>
      </section>

      {/* 9. قصة WIND (مع تأثير Zoom Out المتحرك) */}
      <section className="relative h-[400px] overflow-hidden border-t border-[#333]">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        {/* الصورة مع تأثير الحركة */}
        <img 
          src="/images/story-bg.webp" 
          className="absolute inset-0 w-full h-full object-cover" 
          style={styles.kenBurns} 
          alt="Story Background"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter mix-blend-screen opacity-90">قصة WIND</h2>
          <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed drop-shadow-md">
            "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."
          </p>
          <button className="mt-8 border border-white text-white px-8 py-3 text-sm font-bold hover:bg-white hover:text-black transition-all">
            اكتشف المزيد
          </button>
        </div>
      </section>

      {/* 10 & 11. الأقسام المتخصصة (Tabs Style) */}
      <div className="bg-[#151515] py-12 border-t border-[#222]">
        <SectionHeader title="تسوق حسب الفئة" />
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* الإسدالات */}
           <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-4 z-10 relative">الإسدالات</h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10">
                 {isdalat.slice(0,3).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}
              </div>
           </div>
           {/* الشيلان */}
           <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-4 z-10 relative">الشيلان</h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10">
                 {shawls.slice(0,3).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}
              </div>
           </div>
        </div>
      </div>

      {/* 12. تخفيضات (Full Grid) */}
      <section className="py-12 px-4">
        <div className="bg-[#F5C518] text-black p-4 mb-6 text-center font-black text-xl uppercase tracking-widest">
          تخفيضات حصرية - لفترة محدودة
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {discounts.map((product) => <ProductCard key={product.id} {...product} />)}
        </div>
      </section>

    </main>
  );
}