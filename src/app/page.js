import HeroSection from "../components/sections/HeroSection";
import ProductCard from "../components/products/ProductCard";
import { products } from "../lib/products"; // استدعاء المخزن الجديد

export default function Home() {
  // لاحظ أننا حذفنا المصفوفات (newArrivals, shawls, flashSale) لأن البيانات الآن تأتي من lib/products

  return (
    <main className="min-h-screen pb-20 bg-[#121212]">
      {/* القسم الرئيسي - الهيرو */}
      <HeroSection />

      {/* شريط الإعلان السينمائي المتحرك */}
      <div className="bg-[#F5C518] py-2 overflow-hidden whitespace-nowrap border-y border-black/10">
        <div className="inline-block animate-marquee text-black font-black text-xs md:text-sm uppercase tracking-tighter px-4">
          اكتشفي مجموعة الشتاء الجديدة • توصيل سريع لجميع محافظات مصر • جودة استثنائية من Wind • دفء يكتمل به حضورك • 
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mt-16 space-y-24">
        
        {/* القسم الأول: وصل حديثاً - يقرأ من المخزن مباشرة */}
        <section>
          <div className="flex items-center justify-between mb-10 border-r-4 border-[#F5C518] pr-4">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">وصل حديثاً</h2>
              <p className="text-gray-500 text-sm mt-1 font-bold">اكتشفي أحدث القطع التي وصلت مخازننا</p>
            </div>
            <button className="text-[#F5C518] text-sm font-black border-b border-[#F5C518] pb-1 hover:text-white hover:border-white transition">عرض الكل</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.filter(p => p.category === "وصل حديثاً").map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>

        {/* القسم الثاني: مجموعة الشالات - يقرأ من المخزن مباشرة */}
        <section className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-[#333] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/3 text-right">
              <span className="text-[#F5C518] font-black text-xs tracking-[0.3em] uppercase mb-4 block">Limited Edition</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">مجموعة شيلان <br/><span className="text-[#F5C518]">WIND</span></h2>
              <p className="text-gray-400 font-bold leading-relaxed mb-8">
                صُممت لتكون رفيقتكِ في أكثر الأيام برودة. لمسات ناعمة وتصاميم تجمع بين فخامة الخامات وعصرية الإطلالة.
              </p>
              <button className="bg-white text-black px-8 py-3 rounded-full font-black hover:bg-[#F5C518] transition">تسوقي المجموعة</button>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 gap-4">
              {products.filter(p => p.category === "شالات").map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* القسم الثالث: التخفيضات - يقرأ من المخزن مباشرة */}
        <section>
          <div className="flex items-center gap-3 mb-10 border-r-4 border-[#F5C518] pr-4">
            <h2 className="text-3xl font-black text-white tracking-tight">تخفيضات Wind الحصرية</h2>
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse">لفترة محدودة</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.filter(p => p.category === "تخفيضات").map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>

      </div>

      {/* شريط المميزات */}
      <section className="mt-24 border-t border-[#333] py-16 bg-[#0c0c0c]">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-3">
            <div className="text-[#F5C518] text-3xl font-black uppercase tracking-tighter italic">Wind Express</div>
            <p className="text-white font-bold text-sm">توصيل في وقت قياسي</p>
            <p className="text-gray-500 text-xs px-4">استلم طلبك خلال يومين في القاهرة والجيزة</p>
          </div>
          <div className="space-y-3">
            <div className="text-[#F5C518] text-3xl font-black uppercase tracking-tighter italic">Premium</div>
            <p className="text-white font-bold text-sm">جودة استثنائية</p>
            <p className="text-gray-500 text-xs px-4">نعتمد أرقى الخامات الصوفية والقطنية</p>
          </div>
          <div className="space-y-3 border-r md:border-r-0 border-[#333]">
            <div className="text-[#F5C518] text-3xl font-black uppercase tracking-tighter italic">14 Days</div>
            <p className="text-white font-bold text-sm">ضمان الاستبدال</p>
            <p className="text-gray-500 text-xs px-4">سياسة استرجاع مرنة تضمن رضاكم</p>
          </div>
          <div className="space-y-3">
            <div className="text-[#F5C518] text-3xl font-black uppercase tracking-tighter italic">Flex Pay</div>
            <p className="text-white font-bold text-sm">ادفع بالتقسيط</p>
            <p className="text-gray-500 text-xs px-4">خيارات دفع مرنة: اشترِ الآن وادفع لاحقاً</p>
          </div>
        </div>
      </section>
    </main>
  );
}