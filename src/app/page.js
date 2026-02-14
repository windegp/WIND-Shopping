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

  // تصنيف المنتجات بناءً على البيانات (تأكد من وجود category و tags في ملف products.js)
  const bestSellers = products.slice(0, 4); // مثال للأكثر مبيعاً
  const newArrivals = products.slice(4, 8); // مثال للوصل حديثاً
  const topRated = products.filter(p => parseFloat(p.rating) >= 4.9);
  const isdalat = products.filter(p => p.category === 'isdal'); // قسم الإسدالات
  const shawls = products.filter(p => p.category === 'shawl');   // قسم الشيلان
  const discounts = products.filter(p => p.oldPrice);           // قسم التخفيضات

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
    } catch (error) { alert("حدث خطأ في الاتصال"); }
    setLoading(false);
  };

  return (
    <main className="pb-20 bg-[#121212] min-h-screen" dir="rtl">
      <HeroSection />

      {/* 1. أهم الاختيارات لك */}
      <section>
        <SectionHeader title="أهم الاختيارات لك" subTitle="بناءً على ذوقك الرفيع" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 2. الأكثر مبيعاً */}
      <section>
        <SectionHeader title="الأكثر مبيعاً" subTitle="القطع الأكثر طلباً هذا الموسم" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {bestSellers.map((product) => (
            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 3. التقييمات العامة (أرقام سريعة لتعزيز الثقة) */}
      <section className="bg-white/5 py-10 border-y border-white/10 my-8">
        <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
          <div><h4 className="text-[#F5C518] text-3xl font-black">4.9/5</h4><p className="text-gray-400 text-xs mt-1 font-bold uppercase">تقييم العملاء</p></div>
          <div><h4 className="text-[#F5C518] text-3xl font-black">+10k</h4><p className="text-gray-400 text-xs mt-1 font-bold uppercase">قطعة بيعت</p></div>
          <div><h4 className="text-[#F5C518] text-3xl font-black">100%</h4><p className="text-gray-400 text-xs mt-1 font-bold uppercase">خامات أصلية</p></div>
        </div>
      </section>

      {/* 4. مجموعة مميزة */}
      <div className="my-10">
        <SectionHeader title="مجموعات مميزة" />
        <CollectionsSection />
      </div>

      {/* 5. أراء وتجارب العملاء */}
      <section className="bg-[#1a1a1a] py-12 border-y border-[#333]">
        <div className="max-w-[1280px] mx-auto px-4">
          <SectionHeader title="أراء وتجارب العملاء" subTitle="تقييمات موثقة من عائلة WIND" />
          <div className="flex overflow-x-auto gap-4 pb-10 scrollbar-hide snap-x">
            {reviews.map((rev) => (
              <div key={rev.id} className="min-w-[300px] md:min-w-[400px] bg-[#252525] rounded-sm overflow-hidden border border-[#333] flex snap-start">
                {rev.userImage && <img src={rev.userImage} className="w-24 object-cover" alt="User" />}
                <div className="p-4">
                  <span className="text-[#F5C518] font-black block mb-1">★ {rev.rating}/10</span>
                  <h4 className="text-white font-bold text-sm mb-1">{rev.userName}</h4>
                  <p className="text-gray-400 text-xs italic leading-relaxed">"{rev.userComment}"</p>
                </div>
              </div>
            ))}
          </div>
          {/* فورم إضافة تقييم */}
          <form onSubmit={handleSendReview} className="max-w-xl mx-auto bg-[#222] p-6 border border-[#333]">
             <input type="text" placeholder="الاسم" className="w-full bg-[#121212] border border-[#444] p-3 mb-3 text-sm text-white focus:border-[#F5C518] outline-none" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
             <textarea placeholder="اكتب تجربتك..." className="w-full bg-[#121212] border border-[#444] p-3 mb-3 text-sm text-white h-20 focus:border-[#F5C518] outline-none" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
             <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm uppercase">{loading ? 'جاري النشر...' : 'نشر تجربتي'}</button>
          </form>
        </div>
      </section>

      {/* 6. وصل حديثاً */}
      <section>
        <SectionHeader title="وصل حديثاً" subTitle="أحدث إضافات WIND الشتوية" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {newArrivals.map((product) => (
            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </section>

      {/* 7. آخر الأخبار */}
      <section className="px-4 max-w-[1280px] mx-auto my-12">
        <SectionHeader title="آخر الأخبار" subTitle="أسرار الأناقة والدفء من WIND" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[{ id: 1, title: "كيف تختار الشال المناسب؟", tag: "نصائح" }, { id: 2, title: "قصة الصناعة اليدوية", tag: "خلف الكواليس" }].map((art) => (
            <div key={art.id} className="group cursor-pointer">
              <div className="relative h-48 overflow-hidden rounded-sm mb-4 border border-[#333] bg-[#222]">
                <span className="absolute top-4 right-4 z-20 bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 rounded-sm">{art.tag}</span>
              </div>
              <h3 className="text-white font-black text-lg group-hover:text-[#F5C518] transition-colors">{art.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 8. الأعلى تقييماً */}
      <section className="px-4">
        <SectionHeader title="الأعلى تقييماً" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topRated.map((product) => <ProductCard key={product.id} {...product} />)}
        </div>
      </section>

      {/* 9. قصة WIND */}
      <section className="my-12 relative h-[300px] flex items-center justify-center overflow-hidden border-y border-[#333]">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img src="/images/story-bg.webp" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-20 text-center px-6">
          <h2 className="text-[#F5C518] text-4xl font-black mb-4 uppercase">قصة WIND</h2>
          <p className="text-gray-200 max-w-md mx-auto text-sm italic">"نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."</p>
        </div>
      </section>

      {/* 10. الإسدالات */}
      <section>
        <SectionHeader title="الإسدالات" subTitle="أناقة واحتشام بلمسة عصرية" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {isdalat.length > 0 ? isdalat.map((p) => <div key={p.id} className="min-w-[170px] snap-start"><ProductCard {...p} /></div>) : <p className="px-4 text-gray-500 text-xs italic">قريباً في المتجر...</p>}
        </div>
      </section>

      {/* 11. الشيلان */}
      <section>
        <SectionHeader title="الشيلان" subTitle="الدفء الذي يرافقك في كل مكان" />
        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
          {shawls.length > 0 ? shawls.map((p) => <div key={p.id} className="min-w-[170px] snap-start"><ProductCard {...p} /></div>) : <p className="px-4 text-gray-500 text-xs italic">استكشف مجموعتنا الفاخرة</p>}
        </div>
      </section>

      {/* 12. تخفيضات */}
      <section className="pb-10">
        <SectionHeader title="تخفيضات WIND" subTitle="فرصتك لاقتناء الأفضل بأفضل سعر" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {discounts.map((product) => <ProductCard key={product.id} {...product} />)}
        </div>
      </section>
    </main>
  );
}