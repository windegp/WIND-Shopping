import dynamic from 'next/dynamic';

// --- التحميل الذكي (Dynamic Imports) لضمان أسرع أداء للموقع مستقبلاً ---
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"));

// هنا بنسحب المكونات من داخل ملف HomeSections بشكل منفصل عند الحاجة فقط
const FeaturedToday = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.FeaturedToday));
const TopTenProducts = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.TopTenProducts));

export const DESIGN_REGISTRY = {
  "HERO_SECTION": {
    "MODERN_SLIDER": HeroSection, // قسم الهيرو الرئيسي
  },
  "FEATURED_SECTION": {
    "IMDB_STYLE": FeaturedToday, // قسم المميز اليوم
  },
  // ✅ القسم الجديد "أفضل 10 منتجات" - جاهز للعمل فوراً
  "TOP_TEN_SECTION": {
    "TOP_TEN_LIST": TopTenProducts 
  }
};