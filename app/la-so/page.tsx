'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import LaSoBoard from '@/components/tuvi/LaSoBoard';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { Profile } from '@/lib/profiles';
import { formatBirth } from '@/lib/profiles';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { vi, viPattern, canChi, SIHUA_VI } from '@/lib/ziwei/vi';
import { tuanTriet } from '@/lib/ziwei/describe';
import { STAR_MEANING, PALACE_MEANING } from '@/lib/ziwei/y-nghia';

const LEVEL: Record<string, { text: string; tone: string }> = {
  excellent: { text: 'Đại cát', tone: 'tone-great' },
  good: { text: 'Cát', tone: 'tone-good' },
  neutral: { text: 'Trung tính', tone: 'tone-mid' },
  caution: { text: 'Cần lưu ý', tone: 'tone-worst' },
};

function LaSoView({ profile, chart }: { profile: Profile; chart: ZiweiChart }) {
  const [selected, setSelected] = useState<number | null>(chart.mingGongBranch);
  const [flowYear, setFlowYear] = useState<number | null>(new Date().getFullYear());
  const patterns = useMemo(() => detectPatterns(chart), [chart]);
  const palace = chart.palaces.find(p => p.branch === selected) ?? null;
  const thisYear = new Date().getFullYear();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="tv-title text-2xl">Lá số của {profile.name}</h1>
          <p className="tv-muted text-sm">{formatBirth(profile)}{profile.place ? ` · ${profile.place}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm tv-muted">Lưu niên</label>
          <select className="tv-input !w-auto !py-1.5" value={flowYear ?? ''} onChange={e => setFlowYear(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Chỉ bản mệnh</option>
            {Array.from({ length: 11 }, (_, i) => thisYear - 3 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Link href="/luan-giai" className="tv-btn tv-btn-primary">✦ AI luận giải</Link>
          <button className="tv-btn" onClick={() => window.print()}>In / Lưu PDF</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div>
          <LaSoBoard chart={chart} selected={selected} onSelect={setSelected} flowYear={flowYear} />
          <p className="text-xs tv-muted mt-2">
            Bấm vào một cung để xem chi tiết và tam phương tứ chính (được tô sáng). Chữ nhỏ cạnh sao: M miếu · V vượng · Đ đắc · L lợi · B bình · H hãm.
            Nhãn &quot;L.Lộc/L.Kỵ…&quot; là Tứ Hóa của năm lưu niên.
          </p>
        </div>

        <aside className="grid gap-4">
          {palace && (
            <div className="tv-card">
              <div className="flex items-baseline justify-between">
                <h2 className="tv-title text-lg">Cung {vi(palace.name)}</h2>
                <span className="tv-muted text-sm">{canChi(palace.stem, palace.branch)}</span>
              </div>
              <p className="text-sm tv-muted mb-3">{PALACE_MEANING[palace.name]}</p>
              {palace.daXianAge && (
                <p className="text-sm mb-2">Đại hạn: <b>{palace.daXianAge[0]}–{palace.daXianAge[1]} tuổi</b>{palace.isCurrentDaXian ? <span className="tv-accent"> (đang đi)</span> : ''}</p>
              )}
              {palace.isEmpty && palace.borrowedStars?.length ? (
                <p className="text-sm mb-2">Vô chính diệu, mượn sao cung {vi(palace.borrowedFromName)}: {palace.borrowedStars.map(vi).join(', ')}.</p>
              ) : null}
              {tuanTriet(palace).length > 0 && <p className="text-sm mb-2" style={{ color: 'var(--worst)' }}>Gặp {tuanTriet(palace).join(' và ')}.</p>}
              <ul className="grid gap-2 text-sm">
                {palace.stars.filter(s => STAR_MEANING[s.name]).map(s => (
                  <li key={s.name}>
                    <b style={{ color: s.type === 'sha' ? 'var(--worst)' : s.type === 'major' ? 'var(--tx-0)' : 'var(--great)' }}>{vi(s.name)}</b>
                    {s.siHua && <span className="tv-accent"> · {SIHUA_VI[s.siHua]}</span>}
                    <span className="tv-muted"> — {STAR_MEANING[s.name]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="tv-card">
            <h2 className="tv-title text-lg mb-3">Đại hạn 10 năm</h2>
            <ol className="grid gap-1 text-sm">
              {chart.daXians.map((d, i) => (
                <li key={i} className="flex justify-between rounded px-2 py-1 cursor-pointer"
                  onClick={() => setSelected(d.palaceBranch)}
                  style={{ background: i === chart.currentDaXianIndex ? 'var(--ac-bg)' : 'transparent', color: i === chart.currentDaXianIndex ? 'var(--ac)' : 'var(--tx-1)' }}>
                  <span>{d.startAge}–{d.endAge} tuổi</span><span>{vi(d.palaceName)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="tv-card">
            <h2 className="tv-title text-lg mb-3">Cách cục nổi bật</h2>
            {patterns.length === 0 && <p className="text-sm tv-muted">Chưa nhận diện cách cục đặc biệt.</p>}
            <ul className="flex flex-wrap gap-2">
              {patterns.map(p => (
                <li key={p.name} className={`px-2.5 py-1 rounded-full text-xs font-medium ${LEVEL[p.level].tone}`} title={LEVEL[p.level].text}>
                  {viPattern(p.name)}
                </li>
              ))}
            </ul>
            <p className="text-xs tv-muted mt-3">Muốn hiểu sâu từng cách cục, hãy hỏi trong mục AI luận giải.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LaSoPage() {
  return (
    <Shell>
      <RequireProfile title="Lập lá số Tử Vi">
        {ctx => <LaSoView key={ctx.profile.id} {...ctx} />}
      </RequireProfile>
    </Shell>
  );
}
