import { db } from "@/lib/firebase"; // تأكد أن المسار @/lib/firebase صحيح
import { collection, getDocs } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products"; // تأكد أن المسار @/lib/products صحيح

export default async function sitemap() {
  const baseUrl = "https://www.windeg.com";

  // 1. جلب المنتجات من Firebase (Firestore)
  let fbProducts = [];
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    fbProducts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    // في حال حدث خطأ، سنكتفي بالمنتجات الثابتة لضمان عدم فشل الـ Build
  }

  // 2. دمج المنتجات الثابتة مع منتجات Firebase لضمان شمولية الروابط
  const allProducts = [...staticProducts, ...fbProducts];

  // 3. تحويل قائمة المنتجات إلى روابط (Product Entries)
  const productEntries = allProducts.map((p) => {
    // نستخدم الـ id أو الـ handle حسب الطريقة التي تتبعها في روابط موقعك
    const identifier = p.id || p.handle; 
    
    return {
      url: `${baseUrl}/product/${identifier}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    };
  });

  // 4. إرجاع الروابط كاملة (الصفحة الرئيسية + روابط المنتجات)
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