// app/product/[id]/page.js
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products";
import ProductView from "./ProductView"; 

// دالة جلب البيانات موحدة للسيرفر
async function getProductData(id) {
  const staticProduct = staticProducts.find((p) => p.id.toString() === id.toString());
  if (staticProduct) return staticProduct;

  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
}

// 1. الجزء الخاص بـ Metadata (متوافق مع حقول Firebase)
export async function generateMetadata({ params }) {
  const { id } = params;
  const product = await getProductData(id);

  if (!product) return { title: "المنتج غير موجود | WIND" };

  // الاعتماد على حقول SEO من فايربيز (seoTitle و seoDescription)
  const seoTitle = product.seoTitle || product.title || "WIND";
  const seoDesc = product.seoDescription || product.seo?.description || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || "اكتشف أحدث تشكيلة من WIND.";
  const imageUrl = product.mainImageUrl || product.mainImage || product.images?.[0] || "";

  return {
    title: `${seoTitle} | WIND`,
    description: seoDesc,
    openGraph: {
      title: `${seoTitle} | WIND`,
      description: seoDesc,
      url: `https://windeg.com/product/${id}`,
      siteName: 'WIND',
      images: [{ url: imageUrl.startsWith("http") ? imageUrl : `https://windeg.com/images/products/${product.folderName}/${imageUrl}` }],
      type: 'product',
    },
  };
}

// 2. الصفحة الرئيسية (تحديث الـ JSON-LD للـ SEO)
export default async function Page({ params, searchParams }) {
  const { id } = params;
  const product = await getProductData(id);

  // استخدام await لحل مشكلة Next.js 14/15 مع الـ searchParams لضمان عدم ضياع الرابط
  const resolvedSearchParams = await searchParams;
  const sourceCategory = resolvedSearchParams?.source || null;

  if (!product) return null; // Silent fallback - GlobalLoader handles initial page load

  // البيانات المنظمة JSON-LD متوافقة مع فايربيز
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.seoTitle || product.title,
    "image": product.images || [product.mainImageUrl || product.mainImage],
    "description": product.seoDescription || product.seo?.description || product.description?.replace(/<[^>]*>?/gm, ''),
    "brand": {
      "@type": "Brand",
      "name": "WIND"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://windeg.com/product/${id}`,
      "priceCurrency": "EGP",
      "price": product.price,
      "availability": product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  // --- الزتونة هنا: تحويل البيانات لـ Plain Object عشان تهرب من الـ Error ---
  const sanitizedProduct = JSON.parse(JSON.stringify(product));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* نمرر الـ sanitizedProduct والـ sourceCategory لملف العرض */}
      <ProductView initialProduct={sanitizedProduct} sourceCategory={sourceCategory} /> 
    </>
  );
}