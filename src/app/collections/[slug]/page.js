import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs } from "firebase/firestore";
import CategoryView from "./CategoryView"; 

// دالة جلب بيانات القسم من السيرفر للـ SEO
async function getCategoryData(slug) {
  try {
    const catQuery = query(collection(db, "collections"), where("slug", "in", [slug, `/${slug}`]));
    const catSnapshot = await getDocs(catQuery);
    
    if (!catSnapshot.empty) {
      const data = catSnapshot.docs[0].data();
      return { id: catSnapshot.docs[0].id, ...data };
    }
  } catch (error) {
    console.error("Error fetching category data:", error);
  }
  return null;
}

// 1. توليد الـ Metadata لمحركات البحث
export async function generateMetadata({ params }) {
  const { slug } = params;
  const category = await getCategoryData(slug);

  const formatSlugToName = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
  const fallbackTitle = slug === 'isdal' ? 'الإسدالات' : slug === 'shawls' ? 'الشيلان' : formatSlugToName(slug);

  const title = category?.seoTitle || category?.name || fallbackTitle;
  const description = category?.seoDescription || category?.description || `تسوق أحدث تشكيلة من ${title} في WIND. جودة وتصاميم عصرية.`;

  return {
    title: `${title} | WIND`,
    description: description,
    openGraph: {
      title: `${title} | WIND`,
      description: description,
      url: `https://windeg.com/collections/${slug}`,
      siteName: 'WIND',
      images: [{ url: category?.image || "" }],
      type: 'website',
    },
  };
}

// 2. مكون السيرفر الرئيسي
export default async function CategoryPageServer({ params }) {
  const { slug } = params;
  
  const categoryData = await getCategoryData(slug);
  
  const formatSlugToName = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
  const fallbackTitle = slug === 'isdal' ? 'الإسدالات' : slug === 'shawls' ? 'الشيلان' : formatSlugToName(slug);
  
  const finalCategoryData = categoryData || { 
    name: fallbackTitle, 
    subtitle: "WIND ESSENTIALS", 
    description: "تشكيلة حصرية من WIND تناسب ذوقك." 
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": finalCategoryData.name,
    "description": finalCategoryData.seoDescription || finalCategoryData.description || "",
    "url": `https://windeg.com/collections/${slug}`,
    "image": finalCategoryData.image || ""
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryView initialSlug={slug} initialCategoryData={finalCategoryData} />
    </>
  );
}