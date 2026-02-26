import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products";

export default async function sitemap() {
  const baseUrl = "https://www.windeg.com";

  // 1. جلب المنتجات من Firebase
  let fbProducts = [];
  
  // هنا شيلنا الاعتماد على process.env وخلينا الشرط يعتمد على وجود الـ db فقط
  // بما إننا عملنا Hardcode لملف firebase.js، فالـ db دايماً هتكون موجودة
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      if (!querySnapshot.empty) {
        fbProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      console.error("❌ Sitemap Build Warning (Firebase Fetch Failed):", error.message);
    }
  }

  // 2. دمج المنتجات
  const allProducts = [...staticProducts, ...fbProducts];

  // 3. تحويل المنتجات لروابط
  const productEntries = allProducts.map((p) => {
    const identifier = p.id || p.handle; 
    let finalDate = new Date();

    if (p.updatedAt) {
      try {
        if (p.updatedAt && typeof p.updatedAt === 'object' && p.updatedAt.seconds) {
          finalDate = new Date(p.updatedAt.seconds * 1000);
        } else {
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