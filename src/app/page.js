"use client";
import React, { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, getDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DESIGN_REGISTRY } from "@/lib/designRegistry";
import { ReviewModal } from "@/components/sections/HomeSections";
import { products as staticProducts } from "@/lib/products";

export default function Home() {
  const [layout, setLayout] = useState([]); 
  const [allProducts, setAllProducts] = useState(staticProducts);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 10, image: null });

  // --- 1. جلب البيانات (الترتيب، المنتجات، التقييمات) ---
  useEffect(() => {
    // جلب ترتيب الأقسام
    const unsubLayout = onSnapshot(doc(db, "homepage", "layout_config"), (docSnap) => {
      if (docSnap.exists()) setLayout(docSnap.data().sections || []);
      setLoading(false);
    });

    // جلب التقييمات الحية
    const qReviews = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // جلب المنتجات الحية
    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      if (!snap.empty) {
        setAllProducts(snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().images ? doc.data().images[0] : doc.data().image 
        })));
      }
    });

    return () => { unsubLayout(); unsubReviews(); unsubProducts(); };
  }, []);

  // --- 2. فلترة المنتجات لتوزيعها على الأقسام ---
  const liveData = {
    newArrivals: allProducts.filter(p => p.categories?.includes('new-arrivals')),
    bestSellers: allProducts.slice(0, 8),
    topRated: allProducts.filter(p => parseFloat(p.rating) >= 4.5),
    dresses: allProducts.filter(p => p.categories?.includes('dress')),
    blouses: allProducts.filter(p => p.categories?.includes('blouse')),
    discounts: allProducts.filter(p => p.compareAtPrice > p.price),
  };

  // --- 3. معالج إرسال التقييم ---
  const handleSendReview = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      let url = "";
      if (newReview.image) {
        const imageRef = ref(storage, `reviews/${Date.now()}`);
        await uploadBytes(imageRef, newReview.image);
        url = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, "reviews"), {
        ...newReview, userImage: url, timestamp: serverTimestamp(), productHandle: "home"
      });
      setIsReviewModalOpen(false);
      setNewReview({ name: '', comment: '', rating: 10, image: null });
    } catch (err) { console.error(err); }
    setModalLoading(false);
  };

  if (loading) return null;

  return (
    <main className="bg-[#121212] min-h-screen">
      {layout.map((section, index) => {
        const SectionDesign = DESIGN_REGISTRY[section.category];
        const Component = SectionDesign ? SectionDesign[section.designId] : null;
        if (!Component) return null;

        // "حقن" البيانات الحية داخل القسم بناءً على نوعه
        const injectData = {
          ...section.data,
          products: section.category === "BEST_SELLERS" ? liveData.bestSellers :
                    section.category === "PRODUCTS_MARQUEE" ? liveData.newArrivals :
                    section.category === "DISCOUNTS" ? liveData.discounts :
                    section.category === "TOP_RATED" ? liveData.topRated : section.data?.products,
          dresses: liveData.dresses,
          blouses: liveData.blouses,
          reviews: reviews
        };

        return (
          <Component 
            key={index} 
            data={injectData} 
            onOpenModal={() => setIsReviewModalOpen(true)} 
          />
        );
      })}

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSendReview}
        newReview={newReview}
        setNewReview={setNewReview}
        loading={modalLoading}
      />
    </main>
  );
}