/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        /** * السحر هنا: أي رابط فرعي (ما عدا الملفات الثابتة والصفحات الموجودة فعلياً)
         * سيتم توجيهه داخلياً لمسار الكولكشنز الديناميكي.
         */
        source: '/:slug',
        destination: '/collections/:slug',
      },
    ];
  },
};

export default nextConfig;