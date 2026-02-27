// مسار الملف: app/products/[id]/layout.js

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { constructMetadata } from "@/lib/seo"; // استدعاء المصنع المركزي اللي عملناه

export async function generateMetadata({ params }) {
  const { id } = params; 

  try {
    // 1. بنروح فايربيز نجيب بيانات المنتج بنفس الطريقة اللي الواجهة بتجيبها
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const product = docSnap.data();
      
      // 2. القراءة الدقيقة من الإدمن (بناءً على الكود بتاعك)
      // بيقرأ من product.seo.title الأول، لو فاضي بياخد product.title
      const seoTitle = product.seo?.title || product.title || "WIND Origins";
      
      // بننضف وصف المنتج الأساسي من أي أكواد HTML (لو الإدمن استخدم محرر النصوص)
      const rawDesc = product.description ? product.description.replace(/<[^>]+>/g, '').trim() : "";
      
      // بيقرأ من product.seo.description، لو مفيش بياخد أول 160 حرف من الوصف المنظف
      const seoDesc = product.seo?.description || rawDesc.substring(0, 160) || "اكتشف أحدث منتجات WIND";
      
      // بيجيب أول صورة من مصفوفة images اللي بترفعها لـ ImageKit
      const mainImage = product.images?.[0] || product.image || "https://ik.imagekit.io/windeg/default-cover.jpg";

      // 3. بنبعت البيانات دي للمصنع يطبع كروت جوجل وسوشيال ميديا
      return constructMetadata({
        title: seoTitle,
        description: seoDesc,
        image: mainImage
      });
    }
  } catch (error) {
    console.error("Error fetching product metadata:", error);
  }

  // لو المنتج اتحذف أو الرابط غلط
  return constructMetadata({
    title: "المنتج غير متوفر | WIND",
    description: "هذا المنتج غير متاح حالياً في متجر WIND.",
    noIndex: true // بنمنع جوجل من أرشفة الصفحة دي
  });
}

// الكوبري اللي بيعرض صفحتك الأصلية (page.js) بدون ما نلمسها
export default function ProductLayout({ children }) {
  return <>{children}</>;
}