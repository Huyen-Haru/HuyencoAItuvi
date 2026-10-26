import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tử Vi AI · Lá số & Lịch vận hạn',
    short_name: 'Tử Vi AI',
    description: 'Lập lá số Tử Vi, lịch vận hạn cá nhân và AI luận giải bằng tiếng Việt.',
    start_url: `${base}/`,
    display: 'standalone',
    background_color: '#020810',
    theme_color: '#020810',
    lang: 'vi',
    icons: [{ src: `${base}/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
