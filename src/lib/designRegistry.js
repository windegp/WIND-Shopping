import HeroSection from "@/components/sections/HeroSection";
import * as Home from "@/components/sections/HomeSections";

export const DESIGN_REGISTRY = {
  "HERO_SECTION": {
    "MODERN_SLIDER": HeroSection, // الهيرو سيكشن اللي في الملف المنفصل
  },
  "FEATURED_SECTION": {
    "IMDB_STYLE": Home.FeaturedToday,
  },
  "PRODUCTS_MARQUEE": {
    "INFINITE_SCROLL": Home.NewArrivalsMarquee,
  },
  "BEST_SELLERS": {
    "GRID_WITH_FEATURED": Home.BestSellersSection,
  },
  "TRUST_BAR": {
    "STATS_STRIP": Home.TrustBar,
  },
  "COLLECTIONS": {
    "MAIN_GRID": Home.FeaturedCollections,
  },
  "REVIEWS": {
    "MARQUEE_REVIEWS": Home.ReviewsMarquee,
  },
  "MAGAZINE": {
    "BENTO_STYLE": Home.MagazineGrid,
  },
  "STORY": {
    "KEN_BURNS_FULL": Home.StorySection,
  },
  "CATEGORIES_GRID": {
    "SPLIT_GRID": Home.CategoryGrid,
  },
  "DISCOUNTS": {
    "PROMO_GRID": Home.DiscountGrid,
  }
};