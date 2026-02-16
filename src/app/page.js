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

// --- تأثيرات الحركة (CSS في JS) - كما هي تماماً ---
const styles = {
  kenBurns: {
    animation: 'kenburns 20s infinite alternate',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(5px)',
  }
};

// --- مكون الهيدر - كما هو تماماً ---
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  
  // الحالة الجديدة لحفظ المنتجات القادمة من Firebase
  const [allProducts, setAllProducts] = useState(staticProducts);
  
  // --- إضافة: حالة لحفظ الأقسام الديناميكية من لوحة التحكم ---
  const [dynamicSections, setDynamicSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  useEffect(() => {
    // 1. إضافة الـ CSS Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes kenburns {
        0% { transform: scale(1); }
        100% { transform: scale(1.15); }
      }
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(50%); }
      }
      @keyframes marquee-infinite {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        display: flex;
        animation: marquee 25s linear infinite;
      }
      .animate-marquee-infinite {
        display: flex;
        width: max-content;
        animation: marquee-infinite 35s linear infinite;
      }
      .pause-on-hover:hover {
        animation-play-state: paused;
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleSheet);

    // --- إضافة: جلب إعدادات الصفحة الرئيسية (الأقسام الديناميكية) ---
    const fetchPageSettings = () => {
      const docRef = doc(db, "settings", "homePage");
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().sections) {
          setDynamicSections(docSnap.data().sections);
        }
        setSectionsLoaded(true);
      });
      return unsub;
    };
    const unsubSettings = fetchPageSettings();

    // 2. جلب التقييمات من Firebase
    const qReviews = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    });

    // 3. جلب المنتجات من Firebase
    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      if (!snap.empty) {
        const firebaseData = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            image: data.images ? data.images[0] : data.image 
          };
        });
        setAllProducts(firebaseData);
      }
    });

    return () => {
      unsubSettings();
      unsubReviews();
      unsubProducts();
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال الاسم والتعليق");
    setLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const imageRef = ref(storage, `reviews/${Date.now()}_${newReview.image.name}`);
        const snapshot = await uploadBytes(imageRef, newReview.image);
        url = await getDownloadURL(snapshot.ref);
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
      setIsReviewModalOpen(false);
      alert("شكراً لتقييمك! تم النشر بنجاح.");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert(`حدث خطأ: ${error.message}`);
    }
    setLoading(false);
  };

  // --- دالة مساعدة لتصفية المنتجات لكل قسم ---
  const getSectionProducts = (section) => {
    return allProducts.filter(p => {
        const matchesCategory = section.slug === 'all' || !section.slug || p.categories?.includes(section.slug);
        const notExcluded = !section.excludedIds?.includes(p.id);
        return matchesCategory && notExcluded;
    });
  };

  // --- دالة رسم القسم (Render Section) بناءً على التصميم المختار ---
  const renderSection = (section) => {
    const products = getSectionProducts(section);
    const link = section.slug ? `/collections/${section.slug}` : "#";

    switch (section.designType) {
        // 1. بانر الهيرو (Hero Section)
        case 'hero_section':
            return <HeroSection key={section.id} />;

        // 2. شريط سحب عادي (Carousel) - مثل "أحدث صيحات WIND"
        case 'carousel':
            return (
                <section key={section.id} className="my-10">
                    <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                    <div className="flex overflow-x-auto pb-6 px-4 gap-4 scrollbar-hide snap-x">
                        {products.length > 0 ? products.slice(0, 10).map((product) => (
                            <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start transform hover:scale-[1.02] transition-transform duration-300">
                                <ProductCard {...product} image={product.images?.[0] || product.image} />
                            </div>
                        )) : (
                            <p className="text-gray-600 text-xs px-4">جاري إضافة منتجات...</p>
                        )}
                    </div>
                </section>
            );

        // 3. شريط متحرك (Marquee) - مثل "تسوق التشكيلة الجديدة"
        case 'marquee':
            return (
                <section key={section.id} className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden mt-8">
                    <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                    <div className="relative flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing" dir="ltr">
                        <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                            {[...products.slice(0, 10), ...products.slice(0, 10)].map((product, i) => (
                                <div key={`${product.id}-${i}`} className="min-w-[200px] md:min-w-[250px] opacity-80 hover:opacity-100 transition-opacity">
                                    <ProductCard {...product} image={product.images?.[0] || product.image} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );

        // 4. شبكة الأكثر مبيعاً (Bestseller Grid)
        case 'bestseller_grid':
            if (products.length === 0) return null;
            return (
                <section key={section.id} className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                    <div className="px-4 mb-4" dir="rtl">
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight border-r-4 border-[#F5C518] pr-3">{section.title}</h2>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto">
                        {products[0] && (
                            <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative group">
                                <div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">الأكثر طلباً #1</div>
                                <ProductCard {...products[0]} image={products[0].images?.[0] || products[0].image} />
                            </div>
                        )}
                        <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">
                            {products.slice(1, 5).map(p => (
                                <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>
                            ))}
                        </div>
                    </div>
                </section>
            );

        // 5. شريط الثقة (Trust Bar)
        case 'trust_bar':
            return (
                <section key={section.id} className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                    <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                        <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">تقييم العملاء</p></div>
                        <div className="w-px h-10 bg-[#333]"></div>
                        <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">+10k</h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">قطعة بيعت</p></div>
                        <div className="w-px h-10 bg-[#333]"></div>
                        <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">100%</h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">ضمان الجودة</p></div>
                    </div>
                </section>
            );

        // 6. سلايدر الكولكشنات (Collections)
        case 'collections_slider':
            return (
                <div key={section.id} className="my-10">
                    <SectionHeader title={section.title || "مجموعات مميزة"} />
                    <CollectionsSection />
                </div>
            );

        // 7. شريط الآراء (Reviews Marquee)
        case 'reviews_marquee':
            return (
                <section key={section.id} className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222] my-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right" dir="rtl">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{section.title}</h2>
                                <p className="text-[#F5C518] text-sm font-bold mt-2 uppercase tracking-[0.2em]">{section.subTitle}</p>
                            </div>
                            <button onClick={() => setIsReviewModalOpen(true)} className="bg-transparent border-2 border-[#F5C518] text-[#F5C518] px-8 py-3 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 rounded-sm">+ أضف تجربتك</button>
                        </div>
                        <div className="relative flex overflow-hidden pointer-events-none">
                            <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
                                {[...reviews, ...reviews].map((rev, i) => (
                                    <div key={`${rev.id}-${i}`} className="min-w-[300px] md:min-w-[400px] bg-[#121212] border border-[#333] p-6 rounded-lg hover:border-[#F5C518]/50 transition-all duration-500">
                                        <div className="flex items-center gap-4 mb-4" dir="rtl">
                                            {rev.userImage ? <img src={rev.userImage} className="w-12 h-12 rounded-full object-cover border-2 border-[#F5C518]/20" alt="" /> : <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black border border-[#333]">{rev.userName?.charAt(0)}</div>}
                                            <div className="text-right">
                                                <h4 className="text-white font-black text-sm">{rev.userName}</h4>
                                                <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, j) => (<span key={j} className="text-[#F5C518] text-[10px]">★</span>))}<span className="text-gray-500 text-[9px] mr-2 italic">({rev.rating}/10)</span></div>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed italic text-right" dir="rtl">"{rev.userComment}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            );

        // 8. مجلة WIND (Magazine)
        case 'magazine_grid':
            return (
                <section key={section.id} className="px-4 max-w-[1280px] mx-auto my-16">
                    <SectionHeader title={section.title} subTitle={section.subTitle} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {[{ id: 1, title: "كيفية تنسيق الفستان في الشتاء", tag: "نصائح" }, { id: 2, title: "رحلة WIND: من الفكرة إلى التصميم", tag: "قصتنا" }].map((art) => (
                            <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden bg-[#222]">
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                                <div className="absolute inset-0 bg-[#333] group-hover:scale-110 transition-transform duration-[2s]"></div>
                                <div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black via-black/60 to-transparent text-right">
                                    <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span>
                                    <h3 className="text-white font-black text-xl group-hover:text-[#F5C518] transition-colors">{art.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );

        // 9. شبكة منتظمة (Grid) - مثل "الأعلى تقييماً"
        case 'grid':
            return (
                <section key={section.id} className="px-4 mb-12 my-10">
                    <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {products.slice(0, 8).map((product) => <ProductCard key={product.id} {...product} image={product.images?.[0] || product.image} />)}
                    </div>
                </section>
            );

        // 10. قصة WIND (Story Section)
        case 'story_section':
            return (
                <section key={section.id} className="relative h-[400px] overflow-hidden border-t border-[#333] my-10">
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <img src="/images/story-bg.webp" className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} alt="Story Background" />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                        <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter mix-blend-screen opacity-90">قصة WIND</h2>
                        <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed drop-shadow-md">"نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."</p>
                        <button className="mt-8 border border-white text-white px-8 py-3 text-sm font-bold hover:bg-white hover:text-black transition-all">اكتشف المزيد</button>
                    </div>
                </section>
            );

        // 11. انقسام الفئات (Category Split)
        case 'category_split':
            const dresses = allProducts.filter(p => p.categories?.includes('dress'));
            const blouses = allProducts.filter(p => p.categories?.includes('blouse'));
            return (
                <div key={section.id} className="bg-[#151515] py-12 border-t border-[#222]">
                    <SectionHeader title={section.title || "تسوق حسب الفئة"} />
                    <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                        <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
                            <h3 className="text-2xl font-black text-white mb-4 z-10 relative">فساتين WIND</h3>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">
                                {dresses.slice(0, 5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                            </div>
                        </div>
                        <div className="bg-[#121212] p-6 border border-[#333] relative overflow-hidden">
                            <h3 className="text-2xl font-black text-white mb-4 z-10 relative">البلوزات العصرية</h3>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x relative z-10" dir="ltr">
                                {blouses.slice(0, 5).map(p => <div key={p.id} className="min-w-[140px]"><ProductCard {...p} image={p.images?.[0] || p.image} /></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            );

        // 12. تصميم إضافي (IMDb Style)
        case 'imdb':
             return (
                 <section key={section.id} className="px-4 my-8">
                     <SectionHeader title={section.title} subTitle={section.subTitle} link={link} />
                     <div className="flex flex-col gap-4">
                         {products.slice(0, 5).map(product => (
                             <div key={product.id} className="flex gap-4 bg-[#1A1A1A] p-4 border border-[#333] hover:border-[#F5C518] transition-colors">
                                 <img src={product.images?.[0] || product.image} className="w-24 h-32 object-cover" />
                                 <div className="flex-1">
                                     <h3 className="text-lg font-bold text-white">{product.title}</h3>
                                     <p className="text-[#F5C518] font-bold mt-2">{product.price} ج.م</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </section>
             );

        default:
            return null;
    }
  };

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative" dir="rtl">
      
      {/* ===== REVIEW POPUP MODAL ===== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] shadow-[0_0_30px_rgba(245,197,24,0.1)] relative animate-[fadeIn_0.3s_ease-out]">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold text-xl"
            >✕</button>
            
            <div className="p-8">
              <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
              <p className="text-gray-400 text-xs text-center mb-6">شاركنا تجربتك مع منتجات WIND</p>
              
              <form onSubmit={handleSendReview} className="space-y-4 text-right">
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

      {/* --- عرض الأقسام الديناميكية (Dynamic Section Renderer) --- */}
      {/* هذا الجزء يستبدل كل الأقسام الثابتة ويعرض الصفحة بناءً على ترتيب لوحة التحكم */}
      
      {sectionsLoaded && dynamicSections.length > 0 ? (
          dynamicSections.map((section) => renderSection(section))
      ) : (
          /* شاشة تحميل أنيقة في حال لم يتم تحميل الأقسام بعد */
          <div className="h-screen flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-[#333] border-t-[#F5C518] rounded-full animate-spin"></div>
              <p className="text-[#F5C518] text-sm tracking-widest animate-pulse">جاري تحميل واجهة WIND...</p>
          </div>
      )}

    </main>
  );
}