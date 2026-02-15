export default async function sitemap() {
  const products = await getAllProducts(); // جلب كل منتجات WIND
  const productEntries = products.map(p => ({
    url: `https://www.windeg.com/product/${p.handle}`,
    lastModified: p.updatedAt,
  }));

  return [
    { url: 'https://www.windeg.com/', lastModified: new Date() },
    ...productEntries,
  ];
}