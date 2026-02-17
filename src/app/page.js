"use client";
import { useState, useEffect } from 'react';
// 👇 هذا هو السطر الذي كان ناقصاً وتسبب في الخطأ
import HeroSection from "../components/sections/HeroSection"; 
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { products as staticProducts } from "../lib/products";
import Link from 'next/link';
import { db, storage } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ستايلات الحركة (كما هي تماماً)
const styles = {
  kenBurns: { animation: 'kenburns 20s infinite alternate' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }
};

// مكون الهيدر (كما هو تماماً)
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {link && <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">عرض الكل ›</Link>}
  </div>
);

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  const [allProducts, setAllProducts] = useState(staticProducts);
  const [dynamicSections, setDynamicSections] = useState([]);

  useEffect(() => {
    // 1. إضافة الـ CSS Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
      @keyframes marquee-infinite { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
      .animate-marquee-infinite { display: flex; width: max-content; animation: marquee-infinite 35s linear infinite; }
      .pause-on-hover:hover { animation-play-state: paused; }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleSheet);

    // جلب الأقسام من الفايربيز
    const fetchPageSettings = async () => {
       try {
         const docSnap = await getDoc(doc(db, "settings", "homePage"));
         if (docSnap.exists() && docSnap.data().sections) {
           setDynamicSections(docSnap.data().sections);
         }
       } catch (e) { console.error("Error fetching settings:", e); }
    };
    fetchPageSettings();

    // جلب التقييمات والمنتجات
    const qReviews = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubReviews = onSnapshot(qReviews, (snap) => setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      if (!snap.empty) setAllProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), image: doc.data().images ? doc.data().images[0] : doc.data().image })));
    });

    return () => { unsubReviews(); unsubProducts(); if(document.head.contains(styleSheet)) document.head.removeChild(styleSheet); };
  }, []);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال البيانات");
    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const snap = await uploadBytes(ref(storage, `reviews/${Date.now()}`), newReview.image);
        url = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "reviews"), { userName: newReview.name, userComment: newReview.comment, userImage: url, rating: Number(newReview.rating), productHandle: "home_page", timestamp: serverTimestamp() });
      setNewReview({ name: '', comment: '', rating: 10, image: null }); setIsReviewModalOpen(false); alert("شكراً لتقييمك!");
    } catch (error) { alert("حدث خطأ"); }
    setLoading(false);
  };

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
      {/* مودال التقييمات */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] relative animate-[fadeIn_0.3s_ease-out] p-8">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold text-xl">✕</button>
            <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
            <form onSubmit={handleSendReview} className="space-y-4 text-right mt-6">
                <input type="text" placeholder="الاسم" className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white focus:border-[#F5C518] outline-none" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
                <select className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-[#F5C518] outline-none" value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})}>{[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}</select>
                <textarea placeholder="اكتب تجربتك..." className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white h-24 focus:border-[#F5C518] outline-none resize-none" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
                <div className="border border-dashed border-[#444] p-4 text-center cursor-pointer hover:bg-[#222] relative"><p className="text-gray-400 text-xs">{newReview.image ? newReview.image.name : "اضغط لرفع صورة"}</p><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewReview({...newReview, image: e.target.files[0]})} /></div>
                <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm hover:bg-[#ffdb4d] transition-colors">{loading ? 'جاري النشر...' : 'نشر التقييم'}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- محرك العرض الديناميكي (Render Engine) --- */}
      {dynamicSections.length > 0 ? (
        dynamicSections.map((section, index) => {
          // فلترة المنتجات لكل قسم
          const displayProducts = allProducts.filter(p => (section.slug === 'all' || p.categories?.includes(section.slug)) && !section.excludedIds?.includes(p.id)).slice(0, 10);
          const { contentData } = section;

          // تبديل التصميم بناءً على الاختيار من لوحة التحكم
          switch (section.designType) {
            case 'hero_section':
                return (
                    <section key={section.id} className="relative h-screen max-h-[800px] flex items-center justify-center overflow-hidden">
                        {/* استخدام الصورة المرفوعة أو صورة افتراضية */}
                        {contentData?.imageUrl ? (
                           <>
                             <img src={contentData.imageUrl} className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} alt="Hero" />
                             <div className="absolute inset-0 bg-black/40 z-10"></div>
                           </>
                        ) : (
                           /* إذا لم تكن هناك صورة جديدة، اعرض الهيرو القديم كما هو */
                           <div className="absolute inset-0 w-full h-full"><HeroSection /></div>
                        )}
                        
                        {contentData?.imageUrl && (
                             <div className="relative z-20 text-center px-4 max-w-4xl">
                                <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-lg">{section.title}</h1>
                                <p className="text-xl text-gray-200 mb-8 font-light">{contentData.description}</p>
                                <Link href={contentData.link || "#"} className="bg-[#F5C518] text-black px-10 py-4 font-black uppercase hover:bg-white transition-all">{contentData.buttonText || "تسوق الآن"}</Link>
                             </div>
                        )}
                    </section>
                );

            case 'carousel':
                return (
                    <section key={section.id} className="my-10">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={`/collections/${section.slug}`} />
                        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
                            {displayProducts.map(p => <div key={p.id} className="min-w-[170px] md:min-w-[220px] snap-start hover:scale-[1.02] transition-transform"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                        </div>
                    </section>
                );

            case 'marquee':
                return (
                    <section key={section.id} className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="relative flex overflow-x-auto scrollbar-hide" dir="ltr">
                             <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                                {[...displayProducts, ...displayProducts].map((p, i) => <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100"><ProductCard {...p} /></div>)}
                             </div>
                        </div>
                    </section>
                );

            case 'featured': // تصميم الأكثر مبيعاً
                return (
                    <section key={section.id} className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                        <div className="px-4 mb-4" dir="rtl"><h2 className="text-xl md:text-2xl font-black text-white border-r-4 border-[#F5C518] pr-3">{section.title}</h2></div>
                        <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
                            {displayProducts[0] && <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative"><div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">الأول</div><ProductCard {...displayProducts[0]} /></div>}
                            <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">{displayProducts.slice(1, 5).map(p => <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>)}</div>
                        </div>
                    </section>
                );

            case 'trust_bar':
                return (
                    <section key={section.id} className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                        <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                           <div><h4 className="text-white text-3xl font-black">4.9/5</h4><p className="text-gray-400 text-[10px] font-bold">تقييم العملاء</p></div>
                           <div className="w-px h-10 bg-[#333]"></div>
                           <div><h4 className="text-white text-3xl font-black">+10k</h4><p className="text-gray-400 text-[10px] font-bold">قطعة بيعت</p></div>
                           <div className="w-px h-10 bg-[#333]"></div>
                           <div><h4 className="text-white text-3xl font-black">100%</h4><p className="text-gray-400 text-[10px] font-bold">ضمان الجودة</p></div>
                        </div>
                    </section>
                );

            case 'collections_slider':
                return <div key={section.id} className="my-10"><SectionHeader title={section.title} /><CollectionsSection /></div>;

            case 'reviews_parallax':
                return (
                    <section key={section.id} className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                            <div className="flex justify-between items-center mb-12"><h2 className="text-3xl font-black text-white">{section.title}</h2><button onClick={() => setIsReviewModalOpen(true)} className="border border-[#F5C518] text-[#F5C518] px-8 py-3">+ أضف تجربتك</button></div>
                            <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">{reviews.map((r, i) => <div key={i} className="min-w-[300px] bg-[#121212] border border-[#333] p-6 rounded-lg"><h4 className="text-white font-black text-sm">{r.userName}</h4><p className="text-gray-400 text-sm italic">"{r.userComment}"</p></div>)}</div>
                        </div>
                    </section>
                );

            case 'magazine_grid':
                return (
                    <section key={section.id} className="px-4 max-w-[1280px] mx-auto my-16">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {[{ id: 1, title: "كيفية تنسيق الفستان في الشتاء", tag: "نصائح" }, { id: 2, title: "رحلة WIND: من الفكرة إلى التصميم", tag: "قصتنا" }].map((art) => (
                                <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden bg-[#222]">
                                    <div className="absolute inset-0 bg-black/40"></div><div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black via-black/60 to-transparent text-right"><span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span><h3 className="text-white font-black text-xl">{art.title}</h3></div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            
            case 'grid': // الأعلى تقييماً
                return (
                    <section key={section.id} className="px-4 mb-12">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{displayProducts.map(p => <ProductCard key={p.id} {...p} />)}</div>
                    </section>
                );

            case 'story_section':
                return (
                    <section key={section.id} className="relative h-[400px] overflow-hidden border-t border-[#333]">
                        <img src={contentData?.imageUrl || "/images/story-bg.webp"} className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                            <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 mix-blend-screen opacity-90">{section.title}</h2>
                            <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed">{contentData?.description || "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء."}</p>
                            <button className="mt-8 border border-white text-white px-8 py-3 font-bold hover:bg-white hover:text-black">اكتشف المزيد</button>
                        </div>
                    </section>
                );
            
            case 'category_split':
                return (
                    <div key={section.id} className="bg-[#151515] py-12 border-t border-[#222]">
                        <SectionHeader title={section.title} />
                        <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                           <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden"><h3 className="text-2xl font-black text-white mb-4 z-10 relative">فساتين WIND</h3><div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">{allProducts.filter(p => p.categories?.includes('dress')).slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}</div></div>
                           <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden"><h3 className="text-2xl font-black text-white mb-4 z-10 relative">البلوزات العصرية</h3><div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">{allProducts.filter(p => p.categories?.includes('blouse')).slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}</div></div>
                        </div>
                    </div>
                );

            case 'winter_discounts':
                return (
                    <section key={section.id} className="py-12 px-4">
                        <div className="bg-[#F5C518] text-black p-4 mb-6 text-center font-black text-xl uppercase tracking-widest">{contentData?.description || section.title}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{displayProducts.filter(p => p.compareAtPrice > p.price).slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}</div>
                    </section>
                );

            case 'imdb': // تصميم جديد (إضافي)
            case 'masonry': // تصميم جديد
            case 'ranked': // تصميم جديد
                // كود افتراضي للتصميمات الجديدة حتى يتم تخصيصها لاحقاً
                return (
                    <section key={section.id} className="my-10 px-4">
                         <SectionHeader title={section.title} subTitle={section.subTitle} />
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {displayProducts.map(p => <ProductCard key={p.id} {...p} />)}
                         </div>
                    </section>
                );

            default: return null;
          }
        })
      ) : (
        <div className="flex h-screen items-center justify-center text-gray-500">جاري تحميل المتجر...</div>
      )}
    </main>
  );
}