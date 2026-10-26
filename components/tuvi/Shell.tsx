'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useProfiles } from '@/lib/profiles';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/la-so', label: 'Lá số' },
  { href: '/lich', label: 'Lịch vận hạn' },
  { href: '/luan-giai', label: 'AI luận giải' },
  { href: '/hop-tuoi', label: 'Hợp tuổi' },
  { href: '/nhat-ky', label: 'Nhật ký' },
  { href: '/ho-so', label: 'Hồ sơ' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { profiles, active, select } = useProfiles();
  const [open, setOpen] = useState(false);
  // Giao diện sáng/tối chỉ biết được ở trình duyệt → chờ mount để tránh lệch hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print sticky top-0 z-40 border-b" style={{ borderColor: 'var(--bdr-med)', background: 'color-mix(in srgb, var(--bg-0) 88%, transparent)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl" aria-hidden>☯</span>
            <span className="tv-title text-base">Tử Vi <span className="tv-accent">AI</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV.slice(1).map(n => (
              <Link key={n.href} href={n.href}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{ color: path === n.href ? 'var(--ac)' : 'var(--tx-2)', background: path === n.href ? 'var(--ac-bg)' : 'transparent' }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {profiles.length > 0 && (
              <select
                aria-label="Chọn hồ sơ"
                className="tv-input !w-auto !py-1 !text-sm max-w-[150px]"
                value={active?.id ?? ''}
                onChange={e => select(e.target.value)}
              >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button className="tv-btn !px-3 !py-1" onClick={toggle} aria-label="Đổi giao diện sáng/tối">
              {mounted ? (theme === 'dark' ? '☀︎' : '☾') : '◐'}
            </button>
            <button className="tv-btn !px-3 !py-1 lg:hidden" onClick={() => setOpen(o => !o)} aria-label="Mở menu">☰</button>
          </div>
        </div>
        {open && (
          <nav className="lg:hidden border-t px-4 py-2 grid grid-cols-2 gap-1" style={{ borderColor: 'var(--bdr)' }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm"
                style={{ color: path === n.href ? 'var(--ac)' : 'var(--tx-1)', background: path === n.href ? 'var(--ac-bg)' : 'transparent' }}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="no-print border-t text-xs tv-muted" style={{ borderColor: 'var(--bdr)' }}>
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>Tử Vi AI · Nội dung mang tính tham khảo văn hóa, không thay thế tư vấn y tế, pháp lý, tài chính.</span>
          <span className="flex gap-3">
            <Link href="/library">Thư viện cổ thư</Link>
            <Link href="/privacy">Quyền riêng tư</Link>
            <Link href="/terms">Điều khoản</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
