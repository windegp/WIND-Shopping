import dynamic from 'next/dynamic';

// --- التحميل الذكي (Dynamic Imports) لضمان أسرع أداء للموقع مستقبلاً ---
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"));

// هنا بنسحب المكونات من داخل ملف HomeSections بشكل منفصل عند الحاجة فقط
const FeaturedToday = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.FeaturedToday));
const TopTenProducts = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.TopTenProducts));
const MarqueeProducts = dynamic(() => import("@/components/sections/HomeSections").then(mod => mod.MarqueeProducts));

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
  // ✅ القسم الجديد "شريط المنتجات"
  "MARQUEE_SECTION": {
    "PRODUCTS_SLIDER": MarqueeProducts 
  }
};