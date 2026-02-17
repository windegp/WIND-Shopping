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

   

    // 2. المنتجات

    const productsUnsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {

        const data = snap.docs.map(d => ({

            id: d.id,

            ...d.data(),

            image: d.data().images?.[0] || d.data().image || '/images/placeholder.jpg'

        }));

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

  const newArrivals = allProducts.filter(p => p.categories?.includes('new-arrivals') || p.category === 'new-arrivals').slice(0, 10);

  const topRated = allProducts.filter(p => parseFloat(p.rating) >= 4.5 || p.featured === true);

  const dresses = allProducts.filter(p => p.categories?.includes('dress') || p.category === 'dress');

  const blouses = allProducts.filter(p => p.categories?.includes('blouse') || p.category === 'blouse');

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

    let data = [];

   

    // منطق الفلترة الذكي الجديد (Products Logic)

    if (section.type === 'products') {

        // الحالة 1: اختيار يدوي (Manual)

        if (section.selectionMode === 'manual' && section.selectedItems?.length > 0) {

             data = allProducts.filter(p => section.selectedItems.includes(p.id));

        }

        // الحالة 2: أقسام مرتبطة (Related Collections) - الجديد

        else if (section.selectedCollections?.length > 0) {

             data = allProducts.filter(p =>

                // نتأكد إن المنتج ينتمي لأحد الأقسام المختارة

                section.selectedCollections.includes(p.category) ||

                section.selectedCollections.includes(p.collection) ||

                (p.categories && p.categories.some(c => section.selectedCollections.includes(c)))

             );

        }

        // الحالة 3: فئة واحدة (Legacy/Automated)

        else if (section.selectedCategory) {

             data = allProducts.filter(p => p.category === section.selectedCategory || p.categories?.includes(section.selectedCategory));

        }

        // الحالة 4: (Default) عرض أحدث المنتجات لو مفيش أي تحديد

        else {

             data = allProducts.slice(0, 10);

        }

    }

   

    const sectionLink = section.type === 'products' ? `/collections/${section.selectedCategory || 'all'}` : '#';



    return (

      <div className="mb-12">

        {/* 1. ستايل الأكثر مبيعاً (Bestseller Split) */}

        {section.layout === 'bestseller_split' && (

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



        {/* 2. ستايل الماركي اللانهائي (Infinite Marquee) */}

        {section.layout === 'infinite_marquee' && (

            <section className="py-10 bg-[#161616] border-y border-[#222] overflow-hidden">

                <SectionHeader title={section.title} subTitle={section.subTitle} />

                <div className="relative flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing" dir="ltr">

                    <div className="flex gap-6 animate-marquee-infinite pause-on-hover">

                        {[...data, ...data, ...data].slice(0, 15).map((p, idx) => (

                            <div key={`${p.id}-${idx}`} className="min-w-[200px] md:min-w-[250px] opacity-80 hover:opacity-100 transition-opacity">

                                <ProductCard {...p} />

                            </div>

                        ))}

                    </div>

                </div>

            </section>

        )}



        {/* 3. شريط الثقة (Trust Bar) */}

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



        {/* 4. آراء العملاء (Reviews Marquee) */}

        {section.layout === 'review_marquee' && (

            <section className="bg-[#1a1a1a] py-20 relative overflow-hidden border-y border-[#222]">

                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right" dir="rtl">

                        <div>

                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{section.title || "آراء عائلة WIND"}</h2>

                            <p className="text-[#F5C518] text-sm font-bold mt-2 uppercase tracking-[0.2em]">أصوات حقيقية - تجارب صادقة</p>

                        </div>

                        <button onClick={() => setIsReviewModalOpen(true)} className="bg-transparent border-2 border-[#F5C518] text-[#F5C518] px-8 py-3 font-black text-sm hover:bg-[#F5C518] hover:text-black transition-all duration-300 rounded-sm">+ أضف تجربتك</button>

                    </div>

                    <div className="relative flex overflow-hidden pointer-events-none">

                        <div className="flex gap-6 animate-marquee pause-on-hover" dir="ltr">

                            {[...reviews, ...reviews].slice(0, 10).map((rev, index) => (

                                <div key={`${rev.id}-${index}`} className="min-w-[300px] md:min-w-[400px] bg-[#121212] border border-[#333] p-6 rounded-lg hover:border-[#F5C518]/50 transition-all duration-500">

                                    <div className="flex items-center gap-4 mb-4" dir="rtl">

                                        {rev.userImage ? (<img src={rev.userImage} className="w-12 h-12 rounded-full object-cover border-2 border-[#F5C518]/20" alt="" />) : (<div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#F5C518] font-black border border-[#333]">{rev.userName?.charAt(0)}</div>)}

                                        <div className="text-right">

                                            <h4 className="text-white font-black text-sm">{rev.userName}</h4>

                                            <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => (<span key={i} className="text-[#F5C518] text-[10px]">★</span>))}</div>

                                        </div>

                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed italic text-right" dir="rtl">"{rev.userComment}"</p>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </section>

        )}



        {/* 5. المجلة (Magazine) */}

        {section.layout === 'magazine_grid' && (

            <section className="px-4 max-w-[1280px] mx-auto my-16">

                <SectionHeader title={section.title || "WIND Magazine"} subTitle={section.subTitle} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1" dir="rtl">

                    {[{ id: 1, title: "كيفية تنسيق الفستان في الشتاء", tag: "نصائح" }, { id: 2, title: "رحلة WIND: من الفكرة إلى التصميم", tag: "قصتنا" }].map((art) => (

                        <div key={art.id} className="relative h-64 group cursor-pointer overflow-hidden bg-[#222]">

                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>

                            <img src={`/images/blog${art.id}.jpg`} onError={e => e.target.src='https://via.placeholder.com/800x600/111/333?text=WIND+MAGAZINE'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt="" />

                            <div className="absolute bottom-0 right-0 p-6 z-20 w-full bg-gradient-to-t from-black via-black/60 to-transparent text-right">

                                <span className="bg-[#F5C518] text-black text-[10px] font-black px-2 py-1 mb-2 inline-block">{art.tag}</span>

                                <h3 className="text-white font-black text-xl group-hover:text-[#F5C518] transition-colors">{art.title}</h3>

                            </div>

                        </div>

                    ))}

                </div>

            </section>

        )}



        {/* 6. قصة البراند (Story) */}

        {section.layout === 'story_banner' && (

            <section className="relative h-[400px] overflow-hidden border-t border-[#333]">

                <div className="absolute inset-0 bg-black/50 z-10"></div>

                <img src="/images/story-bg.webp" onError={e => e.target.src='https://via.placeholder.com/1600x900/111/333?text=WIND+STORY'} className="absolute inset-0 w-full h-full object-cover animate-kenburns" style={styles.kenBurns} alt="Story" />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">

                    <h2 className="text-[#F5C518] text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter mix-blend-screen opacity-90">{section.title || "قصة WIND"}</h2>

                    <p className="text-white max-w-lg mx-auto text-lg font-light leading-relaxed drop-shadow-md">

                        {section.subTitle || "نحن لا نصنع الملابس، نحن ننسج خيوط الدفء لتصبح جزءاً من ذكرياتك الشتوية."}

                    </p>

                    <button className="mt-8 border border-white text-white px-8 py-3 text-sm font-bold hover:bg-white hover:text-black transition-all">اكتشف المزيد</button>

                </div>

            </section>

        )}



        {/* 7. الاستايلات الافتراضية (Grid, Posters, Bento, etc) */}

        {(section.layout === 'grid_default' || !section.layout) && (

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



        {section.layout === 'imdb_posters' && (

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



        {section.layout === 'sale_grid' && (

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

  };



  if (loading) return (

    <div className="h-screen bg-[#121212] flex items-center justify-center">

        <span className="text-[#F5C518] text-2xl font-black animate-pulse tracking-[0.5em]">WIND LOADING...</span>

    </div>

  );



  return (

    <main className="pb-20 bg-[#121212] min-h-screen text-white relative font-cairo" dir="rtl">

     

      {/* ===== REVIEW MODAL (يعمل دائماً) ===== */}