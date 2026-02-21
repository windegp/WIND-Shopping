import HeroSection from "@/components/sections/HeroSection";
import * as Home from "@/components/sections/HomeSections";

export const DESIGN_REGISTRY = {
  "HERO_SECTION": {
    "MODERN_SLIDER": HeroSection, // قسم الهيرو الرئيسي
  },
  "FEATURED_SECTION": {
    "IMDB_STYLE": Home.FeaturedToday, // قسم المميز اليوم
  }
};