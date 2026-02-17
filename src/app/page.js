"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroSection from "../components/sections/HeroSection";
import CollectionsSection from "../components/sections/CollectionsSection";
import ProductCard from "../components/products/ProductCard";
import { db, storage } from "../lib/firebase"; 
import { doc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- تأثيرات الحركة (CSS في JS) ---
const styles = {
  kenBurns: { animation: 'kenburns 20s infinite alternate' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }
};

// --- مكون الهيدر الموحد ---
const SectionHeader = ({ title, subTitle, link = "#" }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-10" dir="rtl">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-[#F5C518] rounded-sm"></div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subTitle && <p className="text-gray-400 text-[10px] md:text-xs mt-1 font-normal">{subTitle}</p>}
      </div>
    </div>
    {link && link !== '#' && (
        <Link href={link} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
        عرض الكل <span className="text-xl leading-none">›</span>
        </Link>
    )}
  </div>
);

export default function Home() {
  // --- الحالات (State) ---
  const [sections, setSections] = useState([]); // الأقسام القادمة من الأدمن
  const [allProducts, setAllProducts] = useState([]); // كل المنتجات
  const [reviews, setReviews] = useState([]); // التقييمات
  const [loading, setLoading] = useState(true);

  // حالات مودال التقييم
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });
  const [reviewLoading, setReviewLoading] = useState(false);

  // --- جلب البيانات (Firebase) ---
  useEffect(() => {
    // 1. إعدادات الصفحة (الأقسام الديناميكية)
    const settingsUnsub = onSnapshot(doc(db, "settings", "homePage_v2"), (snap) => {
        if (snap.exists()) setSections(snap.data().sections || []);
        setLoading(false);
    });
    
    // 2. المنتجات (مع تحسين البحث)
    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        const data = snap.docs.map(d => {
            const raw = d.data();
            // إنشاء مصفوفة بحث موحدة (lowercase + trimmed) لحل مشاكل الكتابة
            const searchCats = [
                raw.category, 
                raw.collection, 
                ...(raw.categories || [])
            ].filter(Boolean).map(s => s.toString().toLowerCase().trim());

            return { 
                id: d.id, 
                ...raw, 
                searchCategories: searchCats, // حقل جديد للمقارنة الذكية
                image: raw.images?.[0] || raw.image || '/images/placeholder.jpg' 
            };
        });
        setAllProducts(data);
    });

    // 3. التقييمات
    const reviewsUnsub = onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { settingsUnsub(); productsUnsub(); reviewsUnsub(); };
  }, []);

  // --- تصنيف المنتجات (للاستخدام في الوضع الافتراضي Fallback) ---
  const bestSellers = allProducts.slice(0, 8); 
  const newArrivals = allProducts.filter(p => p.searchCategories?.includes('new-arrivals')).slice(0, 10);
  const topRated = allProducts.filter(p => parseFloat(p.rating) >= 4.5 || p.featured === true);
  const dresses = allProducts.filter(p => p.searchCategories?.includes('dress') || p.searchCategories?.includes('فساتين'));
  const blouses = allProducts.filter(p => p.searchCategories?.includes('blouse') || p.searchCategories?.includes('بلوزات'));
  const discounts = allProducts.filter(p => p.compareAtPrice > p.price);

  // --- دالة إرسال التقييم ---
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return alert("يرجى إدخال الاسم والتعليق");
    setReviewLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const imageRef = ref(storage, `reviews/${Date.now()}_${newReview.image.name}`);
        const snapshot = await uploadBytes(imageRef, newReview.image);
        url = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, "reviews"), {
        userName: newReview.name, userComment: newReview.comment, userImage: url,
        rating: Number(newReview.rating), productHandle: "home_page", timestamp: serverTimestamp()
      });
      setNewReview({ name: '', comment: '', rating: 10, image: null });
      setIsReviewModalOpen(false);
      alert("شكراً لتقييمك! تم النشر بنجاح.");
    } catch (error) { console.error(error); alert("حدث خطأ أثناء النشر"); }
    setReviewLoading(false);
  };

  // --- محرك عرض الأقسام الديناميكية (Dynamic Render Engine) ---
  const RenderDynamicSection = ({ section }) => {
    
    // ==========================================
    // 1. منطق عرض المنتجات (Products Logic)
    // ==========================================
    if (section.type === 'products') {
        let data = [];
        
        // أ) اختيار يدوي
        if (section.selectionMode === 'manual' && section.selectedItems?.length > 0) {
             data = allProducts.filter(p => section.selectedItems.includes(p.id));
        } 
        // ب) أقسام مرتبطة (البحث الذكي)
        else if (section.selectedCollections?.length > 0) {
             data = allProducts.filter(p => {
                // هل المنتج ينتمي لأي من الأقسام المختارة؟
                return section.selectedCollections.some(selCol => {
                    const cleanSel = selCol.toString().toLowerCase().trim();
                    return p.searchCategories.includes(cleanSel);
                });
             });
        }
        // ج) فئة واحدة (Legacy)
        else if (section.selectedCategory) {
             const cleanCat = section.selectedCategory.toString().toLowerCase().trim();
             data = allProducts.filter(p => p.searchCategories.includes(cleanCat));
        }
        // د) الافتراضي
        else {
             data = allProducts.slice(0, 10);
        }

        const sectionLink = section.type === 'products' ? `/collections/${section.selectedCategory || 'all'}` : '#';

        // --- قوالب عرض المنتجات ---
        return (
            <div className="mb-12">
                {/* 1. ستايل الأكثر مبيعاً (Split) */}
                {section.layout === 'bestseller_split' && data.length > 0 && (
                    <section className="bg-[#181818] py-8 my-4 border-y border-[#222]">
                        <div className="px-4 mb-4" dir="rtl">
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight border-r-4 border-[#F5C518] pr-3">{section.title}</h2>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 px-4 max-w-[1400px] mx-auto" dir="rtl">
                            {data[0] && (
                                <div className="md:w-1/3 w-full bg-[#121212] border border-[#333] p-4 relative group">
                                    <div className="absolute top-4 right-4 bg-[#F5C518] text-black font-black text-xs px-2 py-1 z-10">الأكثر طلباً #1</div>
                                    <ProductCard {...data[0]} />
                                </div>
                            )}
                            <div className="md:w-2/3 w-full grid grid-cols-2 gap-3">
                                {data.slice(1, 5).map(p => (
                                    <div key={p.id} className="scale-90 origin-top-right"><ProductCard {...p} /></div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. ستايل الماركي (Marquee) */}
                {section.layout === 'infinite_marquee' && data.length > 0 && (
                    <section className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="relative flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing" dir="ltr">
                            <div className="flex gap-6 animate-marquee-infinite pause-on-hover">
                                {[...data, ...data].slice(0, 15).map((p, idx) => (
                                    <div key={`${p.id}-${idx}`} className="min-w-[200px] md:min-w-[250px] opacity-80 hover:opacity-100 transition-opacity">
                                        <ProductCard {...p} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. ستايل الشبكة الافتراضي (Grid) */}
                {(section.layout === 'grid_default' || !section.layout) && data.length > 0 && (
                    <section className="px-4">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={sectionLink} />
                        <div className="flex overflow-x-auto pb-6 gap-4 scrollbar-hide snap-x" dir="rtl">
                            {data.map((product) => (
                                <div key={product.id} className="min-w-[170px] md:min-w-[220px] snap-start transform hover:scale-[1.02] transition-transform duration-300">
                                    <ProductCard {...product} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. ستايل البوسترات (Posters) */}
                {section.layout === 'imdb_posters' && data.length > 0 && (
                    <section className="px-4">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={sectionLink} />
                        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 scrollbar-hide snap-x" dir="rtl">
                            {data.map(p => (
                                <div key={p.id} className="min-w-[170px] md:min-w-[240px] snap-start group cursor-pointer">
                                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 right-6 left-6 text-right">
                                            <div className="text-[#F5C518] font-black text-xl mb-1">{p.price} EGP</div>
                                            <h4 className="text-white font-black text-sm uppercase leading-tight line-clamp-2">{p.title}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. ستايل البنتو (Bento) */}
                {section.layout === 'bento_modern' && data.length >= 3 && (
                    <section className="px-4">
                        <SectionHeader title={section.title} subTitle={section.subTitle} link={sectionLink} />
                        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]" dir="rtl">
                            <div className="md:col-span-2 md:row-span-2 relative rounded-[2rem] overflow-hidden group border border-white/5">
                                <img src={data[0]?.image} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                                <div className="absolute bottom-10 right-10">
                                    <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-none tracking-tighter">{data[0]?.title}</h3>
                                    <Link href={`/product/${data[0]?.id}`} className="bg-[#F5C518] text-black px-8 py-3 rounded-full font-black text-sm uppercase">اكتشف الآن</Link>
                                </div>
                            </div>
                            <div className="md:col-span-2 md:row-span-1 rounded-[2rem] overflow-hidden border border-white/5 relative group">
                                <img src={data[1]?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            </div>
                            <div className="md:col-span-1 md:row-span-1 rounded-[2rem] overflow-hidden border border-white/5">
                                <img src={data[2]?.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="md:col-span-1 md:row-span-1 bg-[#F5C518] rounded-[2rem] flex items-center justify-center p-6 text-center text-black font-black text-xl italic leading-tight shadow-[inset_0_0_30px_rgba(0,0,0,0.1)]">
                                {section.title}
                            </div>
                        </div>
                    </section>
                )}

                {/* 6. ستايل التخفيضات (Sale Grid) */}
                {section.layout === 'sale_grid' && data.length > 0 && (
                    <section className="py-12 px-4">
                        <div className="bg-[#F5C518] text-black p-4 mb-6 text-center font-black text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(245,197,24,0.3)]">
                            {section.title}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="rtl">
                            {data.slice(0, 8).map((product) => <ProductCard key={product.id} {...product} />)}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    // ==========================================
    // 2. منطق عرض الأقسام والمحتوى العام (Collections & General Logic)
    // ==========================================
    if (section.type === 'collections_list') {
        
        // تجهيز بيانات الأقسام (صورة واسم ورابط)
        const collectionItems = (section.selectedCollections || []).map(catName => {
            // نحاول إيجاد صورة من أي منتج يتبع هذا القسم
            const cleanCatName = catName.toString().toLowerCase().trim();
            const repProduct = allProducts.find(p => p.searchCategories.includes(cleanCatName));
            return {
                title: catName,
                image: repProduct?.image || '/images/placeholder_cat.jpg', 
                link: `/collections/${catName}`
            };
        });

        return (
            <div className="mb-12">
                
                {/* أ) دوائر الأقسام (Circle Avatars) */}
                {section.layout === 'circle_avatars' && (
                    <section className="px-4 my-8">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="flex gap-6 overflow-x-auto pb-4 justify-start md:justify-center scrollbar-hide" dir="rtl">
                            {collectionItems.map((item, idx) => (
                                <Link key={idx} href={item.link} className="flex flex-col items-center gap-3 min-w-[80px] group cursor-pointer">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 border-2 border-dashed border-[#333] group-hover:border-[#F5C518] transition-colors">
                                        <div className="w-full h-full rounded-full overflow-hidden relative">
                                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-300 group-hover:text-white">{item.title}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ب) بانرات عريضة (Rect Banners) */}
                {section.layout === 'rect_banners' && (
                    <section className="px-4 my-8">
                         <SectionHeader title={section.title} subTitle={section.subTitle} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                            {collectionItems.slice(0, 4).map((item, idx) => (
                                <Link key={idx} href={item.link} className="relative h-40 rounded-xl overflow-hidden group border border-[#333]">
                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-80" alt={item.title} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-widest border-b-2 border-[#F5C518] pb-1">{item.title}</h3>
                                    </div>
                                </Link>
                            ))}
                         </div>
                    </section>
                )}

                {/* ج) شريط الثقة (Trust Bar) */}
                {section.layout === 'trust_bar' && (
                     <section className="bg-gradient-to-r from-[#121212] via-[#222] to-[#121212] py-8 border-y border-[#333] my-8">
                        <div className="flex justify-around items-center max-w-4xl mx-auto text-center px-4">
                            <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">4.9<span className="text-sm text-gray-500">/5</span></h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{section.title || "تقييم العملاء"}</p></div>
                            <div className="w-px h-10 bg-[#333]"></div>
                            <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">+10k</h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">قطعة بيعت</p></div>
                            <div className="w-px h-10 bg-[#333]"></div>
                            <div className="group"><h4 className="text-white group-hover:text-[#F5C518] transition-colors text-3xl font-black">100%</h4><p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-widest">ضمان الجودة</p></div>
                        </div>
                    </section>
                )}

                {/* د) آراء العملاء (Review Marquee) */}
                {section.layout === 'review_marquee' && (
                    <section className="bg-[#1a1a1a] py-16 relative overflow-hidden border-y border-[#222]">
                        <SectionHeader title={section.title || "آراء العملاء"} />
                         <div className="relative flex overflow-hidden pointer-events-none">
                            <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">
                                {[...reviews, ...reviews].slice(0, 10).map((rev, index) => (
                                    <div key={`${rev.id}-${index}`} className="min-w-[300px] bg-[#121212] border border-[#333] p-6 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2 justify-end">
                                            <h4 className="text-white font-bold text-right">{rev.userName}</h4>
                                            <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-[#F5C518]">{rev.userName?.charAt(0)}</div>
                                        </div>
                                        <p className="text-gray-400 text-xs text-right">"{rev.userComment}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* هـ) قصة البراند (Story Banner) */}
                {section.layout === 'story_banner' && (
                     <section className="relative h-[400px] overflow-hidden border-t border-[#333]">
                        <div className="absolute inset-0 bg-black/60 z-10"></div>
                        <img src="/images/story-bg.webp" className="absolute inset-0 w-full h-full object-cover" style={styles.kenBurns} onError={(e) => e.target.src='https://via.placeholder.com/1500x500/111/333?text=OUR+STORY'} alt="" />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                            <h2 className="text-[#F5C518] text-5xl font-black mb-4 uppercase tracking-tighter">{section.title || "قصة WIND"}</h2>
                            <p className="text-white max-w-lg mx-auto text-lg font-light">{section.subTitle}</p>
                            <button className="mt-6 border border-white text-white px-6 py-2 text-sm hover:bg-white hover:text-black transition-all">اقرأ المزيد</button>
                        </div>
                    </section>
                )}

                {/* و) المجلة (Magazine) */}
                {section.layout === 'magazine_grid' && (
                    <section className="px-4 my-12">
                        <SectionHeader title={section.title} subTitle={section.subTitle} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1" dir="rtl">
                            <div className="h-64 bg-[#222] relative group cursor-pointer border border-[#333]">
                                <div className="absolute inset-0 flex items-center justify-center"><span className="text-gray-600 font-bold text-xl">Article #1</span></div>
                                <div className="absolute inset-0 border-2 border-[#F5C518] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="h-64 bg-[#222] relative group cursor-pointer border border-[#333]">
                                 <div className="absolute inset-0 flex items-center justify-center"><span className="text-gray-600 font-bold text-xl">Article #2</span></div>
                                 <div className="absolute inset-0 border-2 border-[#F5C518] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        );
    }

    return null;
  };

  if (loading) return (
    <div className="h-screen bg-[#121212] flex items-center justify-center">
        <span className="text-[#F5C518] text-2xl font-black animate-pulse tracking-[0.5em]">WIND LOADING...</span>
    </div>
  );

  return (
    <main className="pb-20 bg-[#121212] min-h-screen text-white relative font-cairo" dir="rtl">
      {/* ===== REVIEW MODAL (يعمل دائماً) ===== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={styles.modalOverlay}>
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-sm border border-[#F5C518] shadow-[0_0_30px_rgba(245,197,24,0.1)] relative animate-[fadeIn_0.3s_ease-out]">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold text-xl">✕</button>
            <div className="p-8">
              <h3 className="text-[#F5C518] text-2xl font-black mb-1 text-center">اترك بصمتك</h3>
              <p className="text-gray-400 text-xs text-center mb-6">شاركنا تجربتك مع منتجات WIND</p>
              <form onSubmit={handleSendReview} className="space-y-4 text-right">
                <input type="text" placeholder="الاسم" className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white focus:border-[#F5C518] outline-none rounded-sm" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
                <select className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-[#F5C518] outline-none rounded-sm" value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: e.target.value})}>
                  {[10, 9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}/10 نجوم</option>)}
                </select>
                <textarea placeholder="اكتب تجربتك..." className="w-full bg-[#121212] border border-[#333] p-3 text-sm text-white h-24 focus:border-[#F5C518] outline-none rounded-sm resize-none" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
                <div className="border border-dashed border-[#444] p-4 text-center rounded-sm cursor-pointer hover:bg-[#222] transition relative">
                   <p className="text-gray-400 text-xs">{newReview.image ? newReview.image.name : "اضغط لرفع صورة (اختياري)"}</p>
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setNewReview({...newReview, image: e.target.files[0]})} />
                </div>
                <button type="submit" disabled={reviewLoading} className="w-full bg-[#F5C518] text-black py-3 font-black text-sm uppercase tracking-wide hover:bg-[#ffdb4d] transition-colors rounded-sm">{reviewLoading ? 'جاري النشر...' : 'نشر التقييم'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection />

      {/* ===== Main Content Area ===== */}
      <div className="mt-10">
        {sections.length > 0 ? (
            // (A) العرض الديناميكي (إذا كان هناك أقسام في الأدمن)
            sections.map((section, index) => <RenderDynamicSection key={section.id || index} section={section} />)
        ) : (
            // (B) العرض الافتراضي (Fallback) في حالة عدم وجود أقسام
            <div className="text-center py-20 text-gray-500">لا توجد أقسام للعرض، يرجى ضبط الصفحة الرئيسية من لوحة التحكم.</div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
        @keyframes marquee-infinite { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
        .animate-marquee-infinite { display: flex; width: max-content; animation: marquee-infinite 35s linear infinite; }
        .pause-on-hover:hover { animation-play-state: paused; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>
    </main>
  );
}