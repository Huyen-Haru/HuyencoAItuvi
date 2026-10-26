/** @type {import('next').NextConfig} */

// GITHUB_PAGES=true: xuất trang tĩnh để đăng lên GitHub Pages (xem .github/workflows/pages.yml)
const pages = process.env.GITHUB_PAGES === 'true';
const basePath = pages ? process.env.PAGES_BASE_PATH ?? '/HuyencoAItuvi' : '';

const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  ...(pages && {
    output: 'export',
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_DEMO: pages ? 'true' : '',
  },
};

module.exports = nextConfig;
