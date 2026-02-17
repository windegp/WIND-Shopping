"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// استيراد المكونات كما كانت
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { products as staticProducts } from "../lib/products";

// ستايلات الحركة (كما هي تماماً)
const styles = {
  kenBurns: { animation: 'kenburns 20s infinite alternate' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }
};

// مكون الهيدر (كما هو تماماً)
const SectionHeader = ({ title, subTitle, link }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {link && <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">عرض الكل <span className="text-xl leading-none">›</span></Link>}
  </div>
);

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [allProducts, setAllProducts] = useState(staticProducts);
  const [dynamicSections, setDynamicSections] = useState([]); // الأقسام من اللوحة
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. حقن الـ CSS
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
      @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
      @keyframes marquee-infinite { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
      .animate-marquee-infinite { display: flex; width: max-content; animation: marquee-infinite 35s linear infinite; }
      .pause-on-hover:hover { animation-play-state: paused; }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleSheet);

    // 2. جلب الأقسام من القاعدة (لدمج اللوحة)
    const unsubSettings = onSnapshot(doc(db, "settings", "homePage"), (doc) => {
        if (doc.exists() && doc.data().sections) setDynamicSections(doc.data().sections);
    });

    // 3. جلب المنتجات
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        if (!snap.empty) setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data(), image: d.data().images?.[0] || d.data().image })));
    });

    // 4. جلب التقييمات
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubProducts(); unsubReviews(); document.head.removeChild(styleSheet); };
  }, []);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("البيانات مطلوبة");
    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const snap = await uploadBytes(ref(storage, `reviews/${Date.now()}`), newReview.image);
        url = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "reviews"), { userName: newReview.name, userComment: newReview.comment, userImage: url, rating: Number(newReview.rating), timestamp: serverTimestamp() });
      setNewReview({ name: '', comment: '', rating: 10, image: null }); setIsReviewModalOpen(false); alert("شكراً لك!");
    } catch (e) { alert("حدث خطأ"); }
    setLoading(false);
  };

  // فلترة المنتجات حسب اختيار اللوحة
  const getProducts = (slug) => {
      if (!slug || slug === 'all') return allProducts;
      if (slug === 'new-arrivals') return allProducts.filter(p => p.categories?.includes('new-arrivals')).slice(0, 10);
      return allProducts.filter(p => p.categories?.includes(slug));
  };

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
      
      {/* مودال التقييم (نفس التصميم بالضبط) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] relative animate-[fadeIn_0.3s_ease-out] p-8">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 left-4 text-white font-bold text-xl">✕</button>
            <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
            <form onSubmit={handleSendReview} className="space-y-4 text-right mt-6">
                <input type="text" placeholder="الاسم" className="w-full bg-[#121212] border border-[#333] p-3 text-white focus:border-[#F5C518] outline-none" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
                <textarea placeholder="تجربتك..." className="w-full bg-[#121212] border border-[#333] p-3 text-white h-24 focus:border-[#F5C518] outline-none resize-none" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black">{loading ? 'جاري النشر...' : 'نشر التقييم'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 العرض الديناميكي (بناءً على ترتيب اللوحة) */}
      {dynamicSections.length > 0 ? (
        dynamicSections.map((section, index) => {
            const products = getProducts(section.collectionSlug);
            const { data } = section;

            // هنا يتم "استنساخ" تصميماتك القديمة بناءً على نوع القسم في اللوحة
            switch (section.template) {
                
                case 'hero_section':
                    return (
                        <div key={section.id}>
                           {/* إذا في صورة جديدة من اللوحة اعرضها، وإلا اعرض الكمبوننت القديم */}
                           {data?.imageUrl ? (
                               <section className="relative h-screen max-h-[800px] flex items-center justify-center overflow-hidden">
                                   <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} />
                                   <div className="absolute inset-0 bg-black/40 z-10"></div>
                                   <div className="relative z-20 text-center px-4">
                                       <h1 className="text-5xl md:text-7xl font-black mb-6 text-white">{section.title || data.title}</h1>
                                       <p className="text-xl text-gray-200 mb-8">{data.description}</p>
                                       <Link href={data.link || "/collections/all"} className="bg-[#F5C518] text-black px-10 py-4 font-black uppercase hover:bg-white">{data.buttonText || "تسوق الآن"}</Link>
                                   </div>
                               </section>
                           ) : <HeroSection />}
                        </div>
                    );

                case 'carousel': // تصميم "أحدث صيحات WIND"
                    return (
                        <section key={section.id} className="my-10">
                             {/* تم استخدام sectionLink للتوجيه الصحيح */}
                            <SectionHeader title={section.title} subTitle={section.subTitle} link={`/collections/${section.collectionSlug}`} />
                            <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
                                {products.slice(0, 10).map(p => <div key={p.id} className="min-w-[170px] md:min-w-[220px] snap-start hover:scale-[1.02] transition-transform"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                            </div>
                        </section>
                    );

                case 'marquee': // تصميم "تسوق التشكيلة الجديدة"
                    return (
                        <section key={section.id} className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
                            <SectionHeader title={section.title} subTitle={section.subTitle} />
                            <div className="relative flex overflow-x-auto scrollbar-hide" dir="ltr">
                                <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                                    {[...products.slice(0,10), ...products.slice(0,10)].map((p, i) => <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                                </div>
                            </div>
                        </section>
                    );

                case 'featured': // تصميم "الأكثر مبيعاً"
                    return (
                        <section key={section.id} className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                            <div className="px-4 mb-4" dir="rtl"><h2 className="text-xl md:text-2xl font-black text-white border-r-4 border-[#F5C518] pr-3">{section.title}</h2></div>
                            <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
                                {products[0] && <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative"><div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">#1</div><ProductCard {...products[0]} image={products[0].images?.[0] || products[0].image} /></div>}
                                <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">{products.slice(1, 5).map(p => <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}</div>
                            </div>
                        </section>
                    );

                case 'trust_bar':
                    return (
                        <section key={section.id} className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                            <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                               {[{v:"4.9/5",t:"تقييم العملاء"},{v:"+10k",t:"قطعة بيعت"},{v:"100%",t:"ضمان الجودة"}].map((x,i)=>(<div key={i}><h4 className="text-white text-3xl font-black">{x.v}</h4><p className="text-gray-400 text-[10px] font-bold uppercase">{x.t}</p></div>))}
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
                                <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">{reviews.length > 0 ? reviews.map((r, i) => (<div key={i} className="min-w-[300px] bg-[#121212] border border-[#333] p-6 rounded-lg"><h4 className="text-white font-black text-sm">{r.userName}</h4><p className="text-gray-400 text-sm italic">"{r.userComment}"</p></div>)) : <p className="text-gray-500 px-4">لا توجد تقييمات</p>}</div>
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

                case 'grid': // تصميم "الأعلى تقييماً"
                    return (
                        <section key={section.id} className="px-4 mb-12">
                            <SectionHeader title={section.title} subTitle={section.subTitle} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.slice(0, 8).map(p => <ProductCard key={p.id} {...p} image={p.images?.[0] || p.image} />)}</div>
                        </section>
                    );

                case 'story_section':
                    return (
                        <section key={section.id} className="relative h-[400px] overflow-hidden border-t border-[#333]">
                            <img src={data?.imageUrl || "/images/story-bg.webp"} className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} />
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                                <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 mix-blend-screen opacity-90">{section.title}</h2>
                                <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed">{data?.description || "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء."}</p>
                                <button className="mt-8 border border-white text-white px-8 py-3 font-bold hover:bg-white hover:text-black">اكتشف المزيد</button>
                            </div>
                        </section>
                    );
                
                case 'category_split':
                    return (
                        <div key={section.id} className="bg-[#151515] py-12 border-t border-[#222]">
                            <SectionHeader title={section.title} />
                            <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                                {['dress', 'blouse'].map(cat => (
                                    <div key={cat} className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
                                        <h3 className="text-2xl font-black text-white mb-4 z-10 relative">WIND {cat === 'dress' ? 'فساتين' : 'بلوزات'}</h3>
                                        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">
                                            {allProducts.filter(p => p.categories?.includes(cat)).slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'winter_discounts':
                    return (
                        <section key={section.id} className="py-12 px-4">
                            <div className="bg-[#F5C518] text-black p-4 mb-6 text-center font-black text-xl uppercase tracking-widest">{data?.description || section.title}</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{allProducts.filter(p => p.compareAtPrice > p.price).slice(0, 8).map(p => <ProductCard key={p.id} {...p} image={p.images?.[0] || p.image} />)}</div>
                        </section>
                    );

                default: return null;
            }
        })
      ) : (
        // حالة التحميل: تظهر شاشة مؤقتة حتى يتم جلب البيانات من اللوحة
        <div className="h-screen flex items-center justify-center text-[#F5C518]">WIND Loading...</div>
      )}
    </main>
  );
}