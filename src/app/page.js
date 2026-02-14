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

const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        {/* العناوين الآن ستظهر بخط Cairo العريض بوزن 900 بفضل إعدادات الـ Layout */}
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
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });

  const newArrivals = products.slice(0, 4);
  const topRated = products.filter(p => parseFloat(p.rating) >= 4.9);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال الاسم والتعليق");

    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const imageRef = ref(storage, `reviews/${Date.now()}_${newReview.image.name}`);
        await uploadBytes(imageRef, newReview.image);
        url = await getDownloadURL(imageRef);
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
      alert("شكراً لتقييمك! تم النشر بنجاح.");
    } catch (error) {
      alert("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  return (
    /* تم إزالة كلاس font-sans من هنا ليعود خط Cairo للعمل */
    <main className="pb-20 bg-[#121212] min-h-screen" dir="rtl">
      <HeroSection />

      {/* 2. أهم الاختيارات */}
      <section>
        <SectionHeader title="أهم الاختيارات لك" subTitle="بناءً على ذوقك الرفيع" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {newArrivals.map((product) => (
            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 3. قصة WIND */}
      <section className="my-12 relative h-[350px] flex items-center justify-center overflow-hidden border-y border-[#333]">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img src="/images/story-bg.webp" alt="WIND Journey" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-20 text-center px-6">
          <h2 className="text-[#F5C518] text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">قصة WIND</h2>
          <p className="text-gray-200 max-w-md mx-auto text-sm leading-relaxed mb-6 font-light italic">
            "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."
          </p>
          <button className="bg-[#F5C518] text-black px-8 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-transform active:scale-95">
            اكتشف رحلتنا
          </button>
        </div>
      </section>

      {/* 4. مجموعات مميزة */}
      <div className="my-8">
        <SectionHeader title="مجموعات مميزة" />
        <CollectionsSection />
      </div>

      {/* 5. قسم التقييمات */}
      <section className="bg-[#1a1a1a] py-12 border-y border-[#333]">
        <div className="max-w-[1280px] mx-auto px-4">
          <SectionHeader title="أراء وتجارب العملاء" subTitle="تقييمات موثقة من عائلة WIND" />

          <form onSubmit={handleSendReview} className="mb-12 max-w-2xl mx-auto bg-[#222] p-6 rounded-sm border border-[#333]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input 
                type="text" 
                placeholder="الاسم بالكامل" 
                className="bg-[#121212] border border-[#444] p-3 text-sm text-white focus:border-[#F5C518] outline-none transition-colors"
                value={newReview.name}
                onChange={(e) => setNewReview({...newReview, name: e.target.value})}
              />
              <select 
                className="bg-[#121212] border border-[#444] p-3 text-sm text-[#F5C518] outline-none cursor-pointer"
                value={newReview.rating}
                onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
              >
                {[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}
              </select>
            </div>
            <textarea 
              placeholder="اكتب تجربتك مع WIND..." 
              className="w-full bg-[#121212] border border-[#444] p-3 text-sm text-white h-24 focus:border-[#F5C518] outline-none mb-4"
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
            />
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="relative overflow-hidden inline-block cursor-pointer">
                <button type="button" className="border border-white/20 text-white px-4 py-2 text-xs hover:bg-white/5 transition-colors">إرفاق صورة للمنتج</button>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setNewReview({...newReview, image: e.target.files[0]})}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#F5C518] text-black px-10 py-2.5 font-black text-sm uppercase hover:bg-[#ffcc00] disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'نشر التقييم'}
              </button>
            </div>
          </form>

          <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x">
            {reviews.map((rev) => (
              <div key={rev.id} className="min-w-[300px] md:min-w-[420px] bg-[#252525] rounded-sm overflow-hidden border border-[#333] flex snap-start">
                {rev.userImage && (
                  <img src={rev.userImage} className="w-24 md:w-32 object-cover border-l border-[#333]" alt="Customer Photo" />
                )}
                <div className="p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#F5C518] font-black text-lg">★ {rev.rating}/10</span>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">موثق</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-2 uppercase">{rev.userName}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed italic line-clamp-3 leading-loose">"{rev.userComment}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. قسم المقالات */}
      <section className="px-4 max-w-[1280px] mx-auto my-12">
        <SectionHeader title="آخر الأخبار" subTitle="أسرار الأناقة والدفء من WIND" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[{ id: 1, title: "كيف تختار الشال المناسب؟", tag: "نصائح" }, { id: 2, title: "قصة الصناعة اليدوية", tag: "وراء الكواليس" }].map((art) => (
            <div key={art.id} className="group cursor-pointer">
              <div className="relative h-64 overflow-hidden rounded-sm mb-4 border border-[#333]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src={`/images/blog${art.id}.webp`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <span className="absolute top-4 right-4 z-20 bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 rounded-sm uppercase">{art.tag}</span>
              </div>
              <h3 className="text-white font-black text-xl group-hover:text-[#F5C518] transition-colors">{art.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 7. الأعلى تقييماً */}
      <section className="px-4 max-w-[1280px] mx-auto pb-10">
        <SectionHeader title="الأعلى تقييماً" subTitle="القطع الأكثر طلباً هذا الأسبوع" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topRated.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </main>
  );
}