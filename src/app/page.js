"use client";
import { useState, useEffect } from 'react';
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { products as staticProducts } from "../lib/products";
import Link from 'next/link';

// استيراد إعدادات Firebase
import { db, storage } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- تأثيرات الحركة (Styles) ---
const styles = {
  kenBurns: { animation: 'kenburns 20s infinite alternate' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }
};

// --- مكون الهيدر الموحد ---
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-8" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {link && link !== "#" && (
        <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
        عرض الكل <span className="text-xl leading-none">›</span>
        </Link>
    )}
  </div>
);

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  const [allProducts, setAllProducts] = useState(staticProducts);
  const [dynamicSections, setDynamicSections] = useState([]);

  // البيانات المحسوبة (للاستخدام داخل المكونات الثابتة)
  const dresses = allProducts.filter(p => p.categories?.includes('dress'));
  const blouses = allProducts.filter(p => p.categories?.includes('blouse'));

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
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleSheet);

    // 2. جلب إعدادات الصفحة (Sections)
    const fetchPageSettings = async () => {
      try {
        const docRef = doc(db, "settings", "homePage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().sections) {
          setDynamicSections(docSnap.data().sections);
        } else {
            // Fallback: إذا لم يتم الحفظ من الأدمن بعد، لا تعرض شيئاً (أو اعرض لودينج)
            // سيتم تعبئتها عند أول حفظ من الأدمن
        }
      } catch (e) {
        console.error("Error fetching home settings:", e);
      }
    };
    fetchPageSettings();

    // 3. جلب التقييمات والمنتجات
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
      if (!snap.empty) {
        setAllProducts(snap.docs.map(doc => ({
          id: doc.id, ...doc.data(), image: doc.data().images ? doc.data().images[0] : doc.data().image 
        })));
      }
    });

    return () => { unsubReviews(); unsubProducts(); if(document.head.contains(styleSheet)) document.head.removeChild(styleSheet); };
  }, []);

  // دالة إرسال التقييم
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال الاسم والتعليق");
    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const snapshot = await uploadBytes(ref(storage, `reviews/${Date.now()}_${newReview.image.name}`), newReview.image);
        url = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, "reviews"), {
        userName: newReview.name, userComment: newReview.comment, userImage: url,
        rating: Number(newReview.rating), productHandle: "home_page", timestamp: serverTimestamp()
      });
      setNewReview({ name: '', comment: '', rating: 10, image: null });
      setIsReviewModalOpen(false);
      alert("شكراً لتقييمك! تم النشر بنجاح.");
    } catch (error) { alert(`حدث خطأ: ${error.message}`); }
    setLoading(false);
  };

  // --- محرك عرض الصفحة (The Page Builder Engine) ---
  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
      
      {/* مودال التقييم */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] relative animate-[fadeIn_0.3s_ease-out]">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white text-xl">✕</button>
            <div className="p-8">
              <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
              <form onSubmit={handleSendReview} className="space-y-4 text-right mt-6">
                <input type="text" placeholder="الاسم" className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white outline-none rounded-sm" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
                <select className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-[#F5C518] outline-none rounded-sm" value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})}>
                  {[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}
                </select>
                <textarea placeholder="اكتب تجربتك..." className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white h-24 outline-none rounded-sm resize-none" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm hover:bg-[#ffdb4d] transition-colors rounded-sm">{loading ? 'جاري النشر...' : 'نشر التقييم'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* حلقة تكرار الأقسام الديناميكية */}
      {dynamicSections.map((section, index) => {
        
        // 1. تصفية المنتجات لهذا القسم
        let sectionProducts = [];
        if (section.type === 'collection') {
            sectionProducts = allProducts.filter(p => 
                (section.slug === 'all' || p.categories?.includes(section.slug)) && 
                !section.excludedIds?.includes(p.id)
            );
        }

        const link = section.type === 'collection' ? `/collections/${section.slug}` : section.slug;

        // 2. Switch Case للتصميمات المختلفة
        switch (section.designType) {
            
            // --- المكونات الثابتة (يمكن تحريكها) ---
            case 'hero_section':
                return <div key={section.id}><HeroSection /></div>;
            
            case 'trust_bar':
                return (
                    <section key={section.id} className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                        <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                            <div className="group"><h4 className="text-white group-hover:text-[#F5C518] text-3xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4><p className="text-gray-400 text-[10px] font-bold tracking-widest">تقييم العملاء</p></div>
                            <div className="w-px h-10 bg-[#333]"></div>
                            <div className="group"><h4 className="text-white group-hover:text-[#F5C518] text-3xl font-black">+10k</h4><p className="text-gray-400 text-[10px] font-bold tracking-widest">قطعة بيعت</p></div>
                        </div>
                    </section>
                );

            case 'reviews_parallax':
                return (
                    <section key={section.id} className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                            <div className="flex justify-between items-center mb-12" dir="rtl">
                                <div><h2 className="text-3xl font-black text-white">{section.title}</h2><p className="text-[#F5C518] text-sm font-bold mt-2">{section.subTitle}</p></div>
                                <button onClick={() => setIsReviewModalOpen(true)} className="border-2 border-[#F5C518] text-[#F5C518] px-6 py-2 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all">+ أضف تجربتك</button>
                            </div>
                            <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
                                {reviews.map((rev, i) => (
                                    <div key={i} className="min-w-[300px] bg-[#121212] border border-[#333] p-6 rounded-lg">
                                        <h4 className="text-[#F5C518] font-bold text-sm mb-2">{rev.userName}</h4>
                                        <p className="text-gray-400 text-xs italic">"{rev.userComment}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'story_section':
                return (
                    <section key={section.id} className="relative h-[400px] overflow-hidden border-t border-[#333]">
                        <div className="absolute inset-0 bg-black/50 z-10"></div>
                        <img src="/images/story-bg.webp" className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} alt="Story" />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                            <h2 className="text-[#F5C518] text-5xl font-black mb-6 mix-blend-screen opacity-90">{section.title}</h2>
                            <p className="text-white max-w-lg text-lg font-light">"نحن لا نصنع الملابس، نحن ننسج خيوط الدفء."</p>
                        </div>
                    </section>
                );

            case 'magazine_grid':
                return (
                    <section key={section.id} className="px-4 max-w-[1280px] mx-auto my-16">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {[{ id: 1, title: "تنسيق الشتاء", tag: "نصائح" }, { id: 2, title: "رحلة التصميم", tag: "قصتنا" }].map((art) => (
                                <div key={art.id} className="relative h-64 group cursor-pointer bg-[#222]">
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                                    <div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black to-transparent text-right">
                                        <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span>
                                        <h3 className="text-white font-black text-xl">{art.title}</h3>
                                    </div>
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
                           <div className="bg-[#121212] p-6 border border-[#333]">
                              <h3 className="text-2xl font-black text-white mb-4">فساتين WIND</h3>
                              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x" dir="ltr">{dresses.slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}</div>
                           </div>
                           <div className="bg-[#121212] p-6 border border-[#333]">
                              <h3 className="text-2xl font-black text-white mb-4">البلوزات العصرية</h3>
                              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x" dir="ltr">{blouses.slice(0,5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} /></div>)}</div>
                           </div>
                        </div>
                    </div>
                );

            // --- تصميمات المنتجات (Collections) ---
            case 'marquee':
                return (
                    <section key={section.id} className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="relative flex overflow-x-auto scrollbar-hide" dir="ltr">
                            <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                                {[...sectionProducts, ...sectionProducts].slice(0, 16).map((p, i) => (
                                    <div key={i} className="min-w-[200px] opacity-80 hover:opacity-100 transition-opacity"><ProductCard {...p} /></div>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'featured': // Best Seller Style
                if(sectionProducts.length === 0) return null;
                return (
                    <section key={section.id} className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                        <div className="px-4 mb-4" dir="rtl"><h2 className="text-xl font-black text-white border-r-4 border-[#F5C518] pr-3">{section.title}</h2></div>
                        <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
                            <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative"><ProductCard {...sectionProducts[0]} /></div>
                            <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">
                                {sectionProducts.slice(1, 5).map(p => <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>)}
                            </div>
                        </div>
                    </section>
                );

            case 'grid':
                return (
                    <section key={section.id} className="px-4 my-10">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {sectionProducts.slice(0, 8).map(p => <ProductCard key={p.id} {...p} />)}
                        </div>
                    </section>
                );

            case 'imdb': // New IMDb Style Horizontal Card
                return (
                    <section key={section.id} className="px-4 my-10">
                         <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {sectionProducts.slice(0, 6).map(p => (
                                 <div key={p.id} className="flex bg-[#1A1A1A] border border-[#333] rounded overflow-hidden h-32 hover:border-[#F5C518] transition-colors group cursor-pointer">
                                     <div className="w-24 h-full relative">
                                        <img src={p.images?.[0] || p.image} className="w-full h-full object-cover" alt={p.title} />
                                     </div>
                                     <div className="p-3 flex-1 flex flex-col justify-center">
                                         <h3 className="text-white font-bold text-sm group-hover:text-[#F5C518]">{p.title}</h3>
                                         <div className="flex items-center gap-1 my-1"><span className="text-[#F5C518]">★</span><span className="text-xs text-gray-400">{p.rating || 4.5}</span></div>
                                         <p className="text-[#F5C518] font-black text-sm">{p.price} EGP</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </section>
                );

            case 'ranked': // Top 10 Ranked List
                 return (
                    <section key={section.id} className="px-4 my-12 bg-[#141414] py-8">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="flex overflow-x-auto gap-6 px-4 pb-4 scrollbar-hide">
                            {sectionProducts.slice(0, 10).map((p, i) => (
                                <div key={p.id} className="min-w-[160px] relative mt-8">
                                    <span className="absolute -top-8 -right-4 text-7xl font-black text-[#1A1A1A] stroke-text-yellow z-0 select-none opacity-50">{i+1}</span>
                                    <div className="relative z-10"><ProductCard {...p} /></div>
                                </div>
                            ))}
                        </div>
                    </section>
                 );

            case 'masonry': // Pinterest Grid
                return (
                    <section key={section.id} className="px-4 my-10">
                        <SectionHeader title={section.title} />
                        <div className="columns-2 md:columns-4 gap-4 space-y-4">
                            {sectionProducts.slice(0, 12).map(p => (
                                <div key={p.id} className="break-inside-avoid mb-4"><ProductCard {...p} /></div>
                            ))}
                        </div>
                    </section>
                );

            default: // Carousel (Default)
                return (
                    <section key={section.id} className="my-10">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                        <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
                            {sectionProducts.slice(0, 10).map(p => (
                                <div key={p.id} className="min-w-[170px] md:min-w-[220px] snap-start transform hover:scale-[1.02] transition-transform duration-300">
                                    <ProductCard {...p} />
                                </div>
                            ))}
                        </div>
                    </section>
                );
        }
      })}
    </main>
  );
}