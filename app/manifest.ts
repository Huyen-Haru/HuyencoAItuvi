import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tử Vi AI · Lá số & Lịch vận hạn',
    short_name: 'Tử Vi AI',
    description: 'Lập lá số Tử Vi, lịch vận hạn cá nhân và AI luận giải bằng tiếng Việt.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020810',
    theme_color: '#020810',
    lang: 'vi',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
