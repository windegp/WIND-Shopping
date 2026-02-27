// مسار الملف: lib/seo.js

export function constructMetadata({ 
  title = "WIND | أحدث صيحات الموضة", // العنوان الافتراضي لو مفيش داتا
  description = "اكتشف أحدث تشكيلة من أزياء WIND. تسوق الآن أفضل الملابس والخامات المتميزة.", 
  image = "https://ik.imagekit.io/windeg/default-cover.jpg", // ممكن تغيره برابط لوجو أو غلاف للمتجر
  noIndex = false // بنستخدمها عشان نمنع جوجل يأرشف صفحات معينة زي الإدمن
} = {}) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      siteName: "WIND Egypt",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex, 
      follow: !noIndex
    }
  };
}