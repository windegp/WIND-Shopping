import dynamic from 'next/dynamic';

// --- التحميل الذكي (Dynamic Imports) لضمان أسرع أداء للموقع مستقبلاً ---
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"));

// هنا بنسحب المكونات من داخل ملف HomeSections بشكل منفصل عند الحاجة فقط
const FeaturedToday = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.FeaturedToday));
const TopTenProducts = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.TopTenProducts));
const MarqueeProducts = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.MarqueeProducts));

// ✅ الإضافة الجديدة: سحب مكون الأكثر مبيعاً
const BestSellersSection = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.BestSellersSection));

// 🔥 الإضافة الجديدة: سحب مكون العروض الحصرية (القسم المبتكر)
const ExclusiveOffers = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.ExclusiveOffers));

// 📽️ الإضافة الجديدة: سحب مكون تصنيفات النخبة (البوسترات)
const MasterpieceCollections = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.MasterpieceCollections));

export const DESIGN_REGISTRY = {
  "HERO_SECTION": {
    "MODERN_SLIDER": HeroSection, // قسم الهيرو الرئيسي
  },
  "FEATURED_SECTION": {
    "IMDB_STYLE": FeaturedToday, // قسم المميز اليوم
  },
  "TOP_TEN_SECTION": {
    "TOP_TEN_LIST": TopTenProducts 
  },
  "MARQUEE_SECTION": {
    "PRODUCTS_SLIDER": MarqueeProducts 
  },
  // ✅ تسجيل قسم الأكثر مبيعاً
  "BEST_SELLERS_SECTION": {
    "BEST_SELLERS_GRID": BestSellersSection 
  },
  // 🔥 تسجيل القسم المبتكر الجديد: العروض الحصرية
  "EXCLUSIVE_OFFERS_SECTION": {
    "PREMIUM_CARDS": ExclusiveOffers 
  },
  // 📽️ تسجيل قسم تصنيفات النخبة
  "COLLECTIONS_SPOTLIGHT": {
    "POSTER_COLLECTIONS": MasterpieceCollections 
  }
};