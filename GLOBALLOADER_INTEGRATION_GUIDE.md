# GlobalLoader Data-Driven Implementation Guide

## Overview

The GlobalLoader now uses a **data-driven transition model** that waits for pages to signal readiness instead of relying on timers. This ensures a premium UX on both fast and slow connections.

## Three-Part System

### 1. GlobalLoaderContext (Already Implemented)
- Detects route changes and shows loader
- Automatically scrolls to top
- Waits for `pageReady` signal OR 8-second timeout
- Manages loader visibility and recede animation

### 2. usePageReady() Hook (For Pages)
Pages use this hook to signal when their critical data and images have loaded.

### 3. Skeleton Loaders (Optional but Recommended)
While the GlobalLoader is active, render skeleton placeholders instead of empty content.

---

## Implementation Pattern

### Step 1: Import the Hook

```jsx
import { usePageReady } from "@/context/GlobalLoaderContext";
import { SkeletonGrid, SkeletonHero } from "@/lib/SkeletonLoaders";
```

### Step 2: Signal When Ready

Call `signalPageReady()` after critical data and images load:

```jsx
"use client";
import { useEffect, useState } from "react";
import { usePageReady } from "@/context/GlobalLoaderContext";
import { useGlobalLoader } from "@/context/GlobalLoaderContext";
import { SkeletonGrid } from "@/lib/SkeletonLoaders";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderVisible } = useGlobalLoader();

  // Fetch critical data
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  // Track when images load
  useEffect(() => {
    if (products.length > 0 && imagesLoaded) {
      // All critical data and images ready - tell GlobalLoader to recede
      signalPageReady();
    }
  }, [products, imagesLoaded, signalPageReady]);

  return (
    <main className="bg-[#121212] min-h-screen pt-24 pb-12">
      {/* Show skeletons while loader is visible, real content when ready */}
      {loaderVisible ? (
        <SkeletonGrid />
      ) : (
        <div className="grid grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} onImageLoad={() => setImagesLoaded(true)} />
          ))}
        </div>
      )}
    </main>
  );
}
```

### Step 3: Handle Images (Optional)

For better UX, track when images load:

```jsx
<img
  src={product.image}
  alt={product.name}
  onLoad={() => setImagesLoaded(true)}
  className="w-full h-auto"
/>
```

Or use Next.js Image with `onLoadingComplete`:

```jsx
import Image from "next/image";

<Image
  src={product.image}
  alt={product.name}
  fill
  onLoadingComplete={() => setImagesLoaded(true)}
/>
```

---

## How It Works

### Fast Connection (≤ 1 second)
```
Route Change
    ↓
GlobalLoader shows (600ms minimum)
    ↓
Page data loads instantly
    ↓
signalPageReady() called
    ↓
GlobalLoader recedes (900ms animation)
    ↓
Page fully visible
```

### Slow Connection (3-5 seconds)
```
Route Change
    ↓
GlobalLoader shows with pulse animation
    ↓
Page renders with skeletons underneath
    ↓
Data loads slowly in background
    ↓
Images load progressively
    ↓
signalPageReady() called when ready
    ↓
GlobalLoader recedes, skeletons replaced with real content
```

### Very Slow / Failed Load (> 8 seconds)
```
Route Change
    ↓
GlobalLoader shows with pulse
    ↓
Fail-safe timeout triggers after 8 seconds
    ↓
GlobalLoader recedes automatically
    ↓
Page visible with whatever loaded (skeletons remain visible)
    ↓
User can see partial content or try again
```

---

## Skeleton Loader Reference

Available skeleton components from `@/lib/SkeletonLoaders`:

```jsx
import { 
  SkeletonGrid,      // 4-column product grid
  SkeletonCard,      // Single product card skeleton
  SkeletonHero,      // Full-width hero skeleton
  SkeletonText       // Text lines skeleton
} from "@/lib/SkeletonLoaders";

// Usage
<SkeletonGrid columns={4} rows={3} />
<SkeletonCard />
<SkeletonHero />
<SkeletonText lines={5} />
```

---

## Automatic Features

✅ **Scroll-to-Top**: Happens automatically on every route change
✅ **Instant**: `window.scrollTo(0, 0)` with `behavior: "auto"` (no animation)
✅ **Timing**: Happens BEFORE loader animation starts

✅ **Fail-Safe**: 8-second maximum timeout prevents infinite loading
✅ **Premium Feel**: Heavy cubic-bezier easing (0.2, 0.8, 0.2, 1)
✅ **No Manual Setup**: Just call `signalPageReady()` when ready

---

## Best Practices

### ✅ DO
- Call `signalPageReady()` after critical data loads
- Use `useGlobalLoader()` to conditionally render skeletons
- Keep skeleton structure similar to real content (prevents shifts)
- Handle errors gracefully (timeout will still recede)

### ❌ DON'T
- Don't call `signalPageReady()` in initial mount (wait for data)
- Don't rely on timers to signal readiness (use actual data checks)
- Don't render full page content while `isVisible === true`
- Don't manually manage scroll position (it's automatic)

---

## Example: Complete Product Page

```jsx
"use client";
import { useEffect, useState } from "react";
import { usePageReady, useGlobalLoader } from "@/context/GlobalLoaderContext";
import { SkeletonGrid } from "@/lib/SkeletonLoaders";
import ProductCard from "@/components/products/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signalPageReady } = usePageReady();
  const { isVisible: loaderActive } = useGlobalLoader();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } finally {
        setLoading(false);
        // Signal ready when data fetched (not when page renders)
        signalPageReady();
      }
    };
    fetchData();
  }, [signalPageReady]);

  return (
    <main className="bg-[#121212] min-h-screen pt-24">
      {/* Show skeletons during loader transition */}
      {loaderActive && loading ? (
        <SkeletonGrid />
      ) : (
        <div className="grid grid-cols-4 gap-8">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

---

## Migration Checklist

For each customer-facing page:

- [ ] Import `usePageReady` and `useGlobalLoader`
- [ ] Add `signalPageReady()` call after critical data loads
- [ ] Conditionally render skeletons when `loaderActive === true`
- [ ] Remove any manual loading states or spinners
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Verify scroll-to-top happens automatically
- [ ] Ensure page renders skeletons, not empty content

---

## Support

If a page doesn't signal readiness within 8 seconds, the loader will automatically recede anyway. This prevents users from being stuck on a black screen.

For detailed examples, see:
- `src/app/page.js` (Homepage with multiple sections)
- `src/app/collections/[slug]/page.js` (Category page with products)
- `src/app/product/[id]/ProductView.js` (Product detail with images)
