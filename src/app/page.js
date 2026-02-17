"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// استيراد المكونات الفرعية كما هي
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { products as staticProducts } from "../lib/products";

// --- ستايلات وتأثيرات ---
const styles = {
  kenBurns: { animation: 'kenburns 20s infinite alternate' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }
};

// --- الهيدر الموحد ---
const SectionHeader = ({ title, subTitle, link }) => (
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
  const [products, setProducts] = useState(staticProducts);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالة المودال (التقييمات)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    // 1. Inject CSS Styles (لضمان عمل الأنيميشن في كل الظروف)
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

    // 2. الاستماع لإعدادات الصفحة (Real-time)
    const unsubSettings = onSnapshot(doc(db, "settings", "homePage"), (doc) => {
        if (doc.exists() && doc.data().sections) setSections(doc.data().sections);
    });

    // 3. الاستماع للمنتجات (Real-time)
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        if (!snap.empty) {
            setProducts(snap.docs.map(d => ({ 
                id: d.id, ...d.data(), 
                image: d.data().images?.[0] || d.data().image // توحيد مصدر الصورة
            })));
        }
        setLoading(false);
    });

    // 4. الاستماع للتقييمات
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubProducts(); unsubReviews(); document.head.removeChild(styleSheet); };
  }, []);

  // --- منطق الفلترة الذكي (Smart Filter) ---
  const getProductsForSection = (slug) => {
    if (!slug || slug === 'all') return products;
    if (slug === 'new-arrivals') return products.slice(0, 15); // آخر 15 منتج
    // الفلترة هنا تتأكد من أن المنتج يحتوي على القسم داخل المصفوفة
    return products.filter(p => p.categories && p.categories.includes(slug));
  };

  // --- دالة إرسال التقييم ---
  const handleSendReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
        let url = "";
        if (newReview.image) {
            const snap = await uploadBytes(ref(storage, `reviews/${Date.now()}`), newReview.image);
            url = await getDownloadURL(snap.ref);
        }
        await addDoc(collection(db, "reviews"), {
            userName: newReview.name, userComment: newReview.comment, userImage: url,
            rating: Number(newReview.rating), timestamp: serverTimestamp()
        });
        setNewReview({ name: '', comment: '', rating: 10, image: null });
        setIsReviewModalOpen(false);
        alert("شكراً لك!");
    } catch (e) { alert("حدث خطأ"); }
    setReviewLoading(false);
  };

  if (loading && sections.length === 0) return <div className="h-screen flex items-center justify-center text-[#F5C518]">WIND Loading...</div>;

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
        
        {/* المودال - نفس التصميم القديم */}
        {isReviewModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
                <div className="bg-[#1A1A1A] w-full max-w-lg border border-[#F5C518] p-8 relative animate-[fadeIn_0.3s_ease-out]">
                    <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 left-4 text-white">✕</button>
                    <h3 className="text-[#F5C518] text-2xl font-black text-center mb-6">اترك بصمتك</h3>
                    <form onSubmit={handleSendReview} className="space-y-4">
                        <input placeholder="الاسم" className="w-full bg-[#121212] border border-[#333] p-3 text-white" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} />
                        <textarea placeholder="تجربتك..." className="w-full bg-[#121212] border border-[#333] p-3 text-white h-24" value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} />
                        <button type="submit" disabled={reviewLoading} className="w-full bg-[#F5C518] text-black py-3 font-bold">{reviewLoading ? "جاري النشر..." : "نشر"}</button>
                    </form>
                </div>
            </div>
        )}

        {/* --- المحرك الرئيسي (Engine) --- */}
        {sections.map((section, index) => {
            // تجهيز البيانات لهذا القسم
            const sectionProducts = getProductsForSection(section.collectionSlug);
            const { data } = section;

            // ** قاعدة ذكية: إذا كان القسم ديناميكياً (منتجات) ولا يحتوي على منتجات، لا تعرضه **
            if (['carousel', 'marquee', 'grid', 'featured'].includes(section.template) && sectionProducts.length === 0) {
                return null; 
            }

            switch (section.template) {
                case 'hero_section':
                    return (
                        <section key={section.id} className="relative h-screen max-h-[800px] flex items-center justify-center overflow-hidden">
                            {data?.imageUrl ? (
                                <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} />
                            ) : <HeroSection />}
                            <div className="absolute inset-0 bg-black/40 z-10"></div>
                            {data?.imageUrl && (
                                <div className="relative z-20 text-center px-4">
                                    <h1 className="text-5xl md:text-7xl font-black mb-6 text-white">{section.title}</h1>
                                    <p className="text-xl text-gray-200 mb-8">{data.description}</p>
                                    <Link href={data.link || "#"} className="bg-[#F5C518] text-black px-10 py-4 font-bold">{data.buttonText || "تسوق الآن"}</Link>
                                </div>
                            )}
                        </section>
                    );

                case 'carousel':
                    return (
                        <section key={section.id} className="my-10">
                            <SectionHeader title={section.title} link={`/collections/${section.collectionSlug}`} />
                            <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
                                {sectionProducts.slice(0, 10).map(p => <div key={p.id} className="min-w-[170px] snap-start"><ProductCard {...p} /></div>)}
                            </div>
                        </section>
                    );

                case 'marquee':
                    return (
                        <section key={section.id} className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
                            <SectionHeader title={section.title} />
                            <div className="relative flex overflow-x-auto scrollbar-hide" dir="ltr">
                                <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                                    {[...sectionProducts.slice(0,10), ...sectionProducts.slice(0,10)].map((p, i) => <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100"><ProductCard {...p} /></div>)}
                                </div>
                            </div>
                        </section>
                    );

                case 'featured': // Best Seller Style
                    return (
                        <section key={section.id} className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                            <div className="px-4 mb-4" dir="rtl"><h2 className="text-xl font-black text-white border-r-4 border-[#F5C518] pr-3">{section.title}</h2></div>
                            <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
                                {sectionProducts[0] && <div className="md:w-1/3 bg-[#121212] border border-[#333] p-4 relative"><div className="absolute top-4 right-4 bg-[#F5C518] text-black text-xs px-2 py-1 font-black z-10">#1</div><ProductCard {...sectionProducts[0]} /></div>}
                                <div className="md:w-2/3 grid grid-cols-2 gap-3">{sectionProducts.slice(1, 5).map(p => <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>)}</div>
                            </div>
                        </section>
                    );

                case 'reviews_parallax': // **تنبيه: تم إرجاع التصميم الأصلي حرفياً**
                    return (
                        <section key={section.id} className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222]">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right" dir="rtl">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{section.title || "آراء عائلة WIND"}</h2>
                                        <p className="text-[#F5C518] text-sm font-bold mt-2 uppercase tracking-[0.2em]">أصوات حقيقية - تجارب صادقة</p>
                                    </div>
                                    <button onClick={() => setIsReviewModalOpen(true)} className="bg-transparent border-2 border-[#F5C518] text-[#F5C518] px-8 py-3 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 rounded-sm">
                                        + أضف تجربتك
                                    </button>
                                </div>
                                <div className="relative flex overflow-hidden pointer-events-none">
                                    <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
                                        {reviews.length > 0 ? [...reviews, ...reviews].map((rev, idx) => (
                                            <div key={`${rev.id}-${idx}`} className="min-w-[300px] md:min-w-[400px] bg-[#121212] border border-[#333] p-6 rounded-lg hover:border-[#F5C518]/50 transition-all">
                                                <div className="flex items-center gap-4 mb-4" dir="rtl">
                                                    {rev.userImage ? <img src={rev.userImage} className="w-12 h-12 rounded-full object-cover border-2 border-[#F5C518]/20" /> : <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black border border-[#333]">{rev.userName?.charAt(0)}</div>}
                                                    <div className="text-right">
                                                        <h4 className="text-white font-black text-sm">{rev.userName}</h4>
                                                        <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => <span key={i} className="text-[#F5C518] text-[10px]">★</span>)}</div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-sm italic text-right" dir="rtl">"{rev.userComment}"</p>
                                            </div>
                                        )) : <p className="text-gray-500">لا توجد تقييمات بعد.</p>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    );

                case 'trust_bar':
                     return (
                        <section key={section.id} className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                            <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                                {[{v:"4.9/5",t:"تقييم"},{v:"+10k",t:"مبيعات"},{v:"100%",t:"ضمان"}].map((x,i)=>(
                                    <div key={i}><h4 className="text-white text-3xl font-black">{x.v}</h4><p className="text-gray-400 text-[10px] font-bold">{x.t}</p></div>
                                ))}
                            </div>
                        </section>
                     );

                case 'story_section':
                    return (
                        <section key={section.id} className="relative h-[400px] overflow-hidden border-t border-[#333]">
                            <img src={data?.imageUrl || "/images/story-bg.webp"} className="absolute inset-0 w-full h-full object-cover opacity-50" style={styles.kenBurns} />
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                                <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 mix-blend-screen opacity-90">{section.title}</h2>
                                <p className="text-white max-w-lg mx-auto text-lg font-light">{data?.description || "قصتنا..."}</p>
                            </div>
                        </section>
                    );

                case 'magazine_grid':
                    return (
                        <section key={section.id} className="px-4 max-w-[1280px] mx-auto my-16">
                            <SectionHeader title={section.title || "WIND Magazine"} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                {[{ id: 1, title: "كيفية تنسيق الفستان", tag: "نصائح" }, { id: 2, title: "رحلة WIND", tag: "قصتنا" }].map((art) => (
                                    <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden bg-[#222]">
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                                        <div className="absolute bottom-0 right-0 p-6 z-20 w-full text-right"><h3 className="text-white font-black text-xl">{art.title}</h3></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );

                case 'collections_slider':
                    return <div key={section.id} className="my-10"><SectionHeader title={section.title} /><CollectionsSection /></div>;

                case 'category_split':
                    return (
                        <div key={section.id} className="bg-[#151515] py-12 border-t border-[#222]">
                            <SectionHeader title={section.title} />
                            <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                                {['dress', 'blouse'].map(cat => (
                                    <div key={cat} className="bg-[#121212] p-6 border border-[#333] overflow-hidden">
                                        <h3 className="text-2xl font-black text-white mb-4">WIND {cat === 'dress' ? 'فساتين' : 'بلوزات'}</h3>
                                        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x" dir="ltr">
                                            {products.filter(p => p.categories?.includes(cat)).slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.filter(p => p.compareAtPrice > p.price).slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}</div>
                        </section>
                    );
                
                // --- تصميمات إضافية (IMDb, Grid, etc.) ---
                default:
                    return (
                        <section key={section.id} className="my-10 px-4">
                            <SectionHeader title={section.title} link={`/collections/${section.collectionSlug}`} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {sectionProducts.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                            </div>
                        </section>
                    );
            }
        })}
    </main>
  );
}