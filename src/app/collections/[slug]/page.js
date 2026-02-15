import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import Link from "next/link";

// 1. دعم الـ SEO الديناميكي وتحسين محركات البحث لـ WIND
export async function generateMetadata({ params }) {
    const slug = `/${params.slug.join('/')}`;
    const q = query(collection(db, "collections"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    const category = querySnapshot.docs[0]?.data();

    return {
        title: category?.name ? `${category.name} | WIND` : "تشكيلة WIND",
        description: category?.description || "اكتشف الأناقة والراحة في تشكيلة WIND الفريدة والمصممة بعناية.",
        openGraph: {
            title: category?.name,
            description: category?.description,
            images: category?.image ? [{ url: category.image }] : [],
        },
    }
}

export default async function CategoryPage({ params }) {
    const slugPath = `/${params.slug.join('/')}`;
    
    // جلب بيانات القسم (الاسم، الوصف، ونص الفوتر الـ SEO)
    const categoryQuery = query(collection(db, "collections"), where("slug", "==", slugPath));
    const categorySnap = await getDocs(categoryQuery);
    const categoryData = categorySnap.docs[0]?.data() || { name: "القسم", description: "" };

    // جلب المنتجات التي تنتمي لهذا القسم بناءً على الـ slug
    const productsQuery = query(
        collection(db, "products"), 
        where("categories", "array-contains", slugPath),
        limit(40) // زيادة الحد لعرض منتجات أكثر
    );
    const productsSnap = await getDocs(productsQuery);
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return (
        <div className="min-h-screen bg-white text-black font-sans" dir="rtl">
            {/* 2. هيدر القسم - تصميم دافئ وأنيق (Warm & Stylish) */}
            <header className="bg-[#fcfcfc] py-20 px-4 border-b border-gray-50">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#1a1a1a]">
                        {categoryData.name}
                    </h1>
                    
                    {categoryData.description && (
                        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-lg font-light italic">
                            {categoryData.description}
                        </p>
                    )}

                    <nav className="mt-8 flex justify-center items-center gap-3 text-[11px] uppercase tracking-widest text-gray-400">
                        <Link href="/" className="hover:text-black transition-colors">الرئيسية</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-black font-semibold">{categoryData.name}</span>
                    </nav>
                </div>
            </header>

            {/* 3. شبكة المنتجات - عرض عصري */}
            <main className="max-w-7xl mx-auto px-4 py-16">
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                        {products.map((product) => (
                            <Link key={product.id} href={`/product/${product.handle}`} className="group block">
                                <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] rounded-sm">
                                    <img 
                                        src={product.images?.[0] || product.mainImageUrl} 
                                        alt={product.title}
                                        className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {product.compareAtPrice > product.price && (
                                        <div className="absolute top-3 right-3 bg-black text-white text-[10px] px-2.5 py-1 font-bold tracking-tighter">
                                            خصم خاص
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-5 space-y-1.5 text-center md:text-right">
                                    <h3 className="text-[14px] md:text-[16px] text-[#333] font-medium group-hover:text-gray-600 transition-colors">
                                        {product.title}
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-1 md:gap-3 items-center md:items-baseline">
                                        <span className="font-bold text-[15px] md:text-[17px] text-black">
                                            {product.price} ج.م
                                        </span>
                                        {product.compareAtPrice > 0 && (
                                            <span className="text-gray-400 line-through text-xs md:text-sm">
                                                {product.compareAtPrice} ج.م
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 border-2 border-dashed border-gray-50 rounded-xl">
                        <p className="text-gray-400 text-lg">نعمل حالياً على تجهيز قطع جديدة لتنضم لـ {categoryData.name}.</p>
                        <Link href="/" className="inline-block mt-6 text-sm underline underline-offset-4 hover:text-[#F5C518]">
                            العودة لتصفح جديدنا
                        </Link>
                    </div>
                )}
            </main>

            {/* 4. فوتر القسم المخصص للـ SEO - يظهر فقط إذا وُجد نص */}
            {categoryData.footerText && (
                <section className="bg-[#fafafa] border-t border-gray-100 py-20 mt-10">
                    <div className="max-w-4xl mx-auto px-6 text-center md:text-right">
                        <div className="prose prose-sm max-w-none">
                            <h2 className="text-[#1a1a1a] text-xl font-bold mb-6">
                                تصفحي مجموعة {categoryData.name} من WIND
                            </h2>
                            <div className="text-gray-500 leading-8 text-[15px] font-light whitespace-pre-line">
                                {categoryData.footerText}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}