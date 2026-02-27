// app/product/[id]/page.js
import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { products as staticProducts } from "@/lib/products";
import ProductView from "./ProductView"; 

async function getProductData(id) {
  const staticProduct = staticProducts.find((p) => p.id.toString() === id.toString());
  if (staticProduct) return staticProduct;

  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = params;
  const product = await getProductData(id);

  if (!product) return { title: "المنتج غير موجود | WIND" };

  return {
    title: `${product.title} | WIND`,
    description: product.seo?.description || `تسوقي ${product.title} من WIND. جودة وتصميم عصري.`,
    openGraph: {
      title: `${product.title} | WIND`,
      description: product.seo?.description || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160),
      url: `https://www.windeg.com/product/${id}`,
      siteName: 'WIND',
      images: [{ url: product.mainImage || product.images?.[0] }],
      type: 'article',
    },
  };
}

export default async function Page({ params }) {
  const { id } = params;
  const product = await getProductData(id);

  // text-white → text-gray-900 ، bg لم يوجد هنا أصلاً
  if (!product) return <div className="text-gray-900 text-center py-20">المنتج غير موجود</div>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [product.mainImage],
    "description": product.seo?.description || product.description?.replace(/<[^>]*>?/gm, ''),
    "brand": { "@type": "Brand", "name": "WIND" },
    "offers": {
      "@type": "Offer",
      "url": `https://www.windeg.com/product/${id}`,
      "priceCurrency": "EGP",
      "price": product.price,
      "availability": product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  const sanitizedProduct = JSON.parse(JSON.stringify(product));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductView initialProduct={sanitizedProduct} /> 
    </>
  );
}