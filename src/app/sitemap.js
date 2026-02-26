import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products";

export default async function sitemap() {
  const baseUrl = "https://www.windeg.com";

  // 1. جلب المنتجات من Firebase
  let fbProducts = [];
  
  // التحقق من وجود Project ID وأيضاً أن قاعدة البيانات جاهزة (db ليست null)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId && projectId !== "undefined" && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      if (!querySnapshot.empty) {
        fbProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      // طباعة الخطأ في الـ Logs دون توقيف الـ Build
      console.error("❌ Sitemap Build Warning (Firebase):", error.message);
    }
  } else {
    // رسالة تنبيه واضحة في الـ Terminal أثناء الـ Build
    console.warn("⚠️ Sitemap: Firebase DB is not initialized or Project ID is missing. Falling back to static products.");
  }

  // 2. دمج المنتجات (لو فيربيز فشل، هيكون عندنا الـ static فقط)
  const allProducts = [...staticProducts, ...fbProducts];

  // 3. تحويل المنتجات لروابط مع معالجة ذكية للتاريخ
  const productEntries = allProducts.map((p) => {
    // نستخدم الـ id الخاص بفيربيز أو الـ handle من الملف الثابت
    const identifier = p.id || p.handle; 
    
    let finalDate = new Date(); // افتراضياً تاريخ اليوم

    if (p.updatedAt) {
      try {
        // فحص نوع التاريخ (Firebase Timestamp vs JS Date)
        if (p.updatedAt && typeof p.updatedAt === 'object' && p.updatedAt.seconds) {
          finalDate = new Date(p.updatedAt.seconds * 1000);
        } else {
          const parsedDate = new Date(p.updatedAt);
          if (!isNaN(parsedDate.getTime())) {
            finalDate = parsedDate;
          }
        }
      } catch (e) {
        finalDate = new Date(); // في حالة أي خطأ في التحويل
      }
    }

    return {
      url: `${baseUrl}/product/${identifier}`,
      lastModified: finalDate,
      changeFrequency: 'daily',
      priority: 0.7,
    };
  });

  // 4. إرجاع الروابط النهائية (الصفحة الرئيسية + روابط المنتجات)
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