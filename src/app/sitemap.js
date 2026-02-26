import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products";

export default async function sitemap() {
  const baseUrl = "https://www.windeg.com";

  // 1. جلب المنتجات من Firebase
  let fbProducts = [];
  
  // --- إضافة صمام أمان: التحقق من وجود Project ID قبل الطلب ---
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId && projectId !== "undefined") {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      if (!querySnapshot.empty) {
        fbProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      // طباعة الخطأ بشكل واضح في الـ Logs بتاعة Vercel للتشخيص
      console.error("❌ Sitemap Build Warning (Firebase):", error.message);
    }
  } else {
    console.warn("⚠️ Sitemap: Skipping Firebase fetch because Project ID is missing.");
  }

  // 2. دمج المنتجات
  const allProducts = [...staticProducts, ...fbProducts];

  // 3. تحويل المنتجات لروابط مع معالجة ذكية للتاريخ
  const productEntries = allProducts.map((p) => {
    const identifier = p.id || p.handle; 
    
    // --- معالجة التاريخ لضمان عدم حدوث Error ---
    let finalDate = new Date(); // افتراضياً تاريخ اليوم

    if (p.updatedAt) {
      try {
        // إذا كان التاريخ جاي من Firebase Timestamp
        if (p.updatedAt && typeof p.updatedAt === 'object' && p.updatedAt.seconds) {
          finalDate = new Date(p.updatedAt.seconds * 1000);
        } else {
          // إذا كان التاريخ نصي أو Date عادي
          const parsedDate = new Date(p.updatedAt);
          if (!isNaN(parsedDate.getTime())) {
            finalDate = parsedDate;
          }
        }
      } catch (e) {
        finalDate = new Date();
      }
    }

    return {
      url: `${baseUrl}/product/${identifier}`,
      lastModified: finalDate,
      changeFrequency: 'daily',
      priority: 0.7,
    };
  });

  // 4. إرجاع الروابط النهائية
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...productEntries,
  ];
}