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

// 1. الجزء الخاص بـ Metadata
export async function generateMetadata({ params }) {
  const { id } = params;
  const product = await getProductData(id);

  if (!product) return { title: "المنتج غير موجود | WIND Shopping" };

  return {
    title: `${product.title} | WIND Shopping`,
    description: product.seo?.description || `تسوقي ${product.title} من WIND. جودة وتصميم عصري.`,
    openGraph: {
      title: `${product.title} | WIND Shopping`,
      description: product.seo?.description || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160),
      url: `https://www.windeg.com/product/${id}`,
      siteName: 'WIND Shopping',
      images: [{ url: product.mainImage || product.images?.[0] }],
      type: 'article',
    },
  };
}

// 2. الصفحة الرئيسية
export default async function Page({ params }) {
  const { id } = params;
  const product = await getProductData(id);

  if (!product) return <div className="text-white text-center py-20">المنتج غير موجود</div>;

  // البيانات المنظمة JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [product.mainImage],
    "description": product.seo?.description || product.description?.replace(/<[^>]*>?/gm, ''),
    "brand": {
      "@type": "Brand",
      "name": "WIND Shopping"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.windeg.com/product/${id}`,
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
      
      {/* نمرر الـ sanitizedProduct بدل الـ product الأصلي */}
      <ProductView initialProduct={sanitizedProduct} /> 
    </>
  );
}