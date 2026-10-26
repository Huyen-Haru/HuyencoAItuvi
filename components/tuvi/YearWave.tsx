'use client';
import { useState } from 'react';
import type { DayScore } from '@/lib/lich/vanhan';
import { scoreLabel } from '@/lib/lich/vanhan';

const W = 1000;
const H = 180;
const PAD = 24;

export default function YearWave({ days, onPick }: { days: DayScore[]; onPick: (d: DayScore) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!days.length) return null;

  const smooth = days.map((_, i) => {
    const win = days.slice(Math.max(0, i - 3), i + 4);
    return win.reduce((a, d) => a + d.score, 0) / win.length;
  });
  const lo = Math.floor(Math.min(...smooth) / 5) * 5 - 5;
  const hi = Math.ceil(Math.max(...smooth) / 5) * 5 + 5;
  const ticks = Array.from({ length: Math.floor((hi - lo) / 5) + 1 }, (_, i) => lo + i * 5).filter((_, i, a) => a.length <= 6 || i % 2 === 0);
  const x = (i: number) => PAD + (i / (days.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const path = smooth.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(days.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;
  const monthStarts = days.map((d, i) => (d.info.d === 1 ? i : -1)).filter(i => i >= 0);

  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD) / (W - PAD * 2)) * (days.length - 1));
    return Math.max(0, Math.min(days.length - 1, i));
  };

  const h = hover !== null ? days[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair" role="img" aria-label="Biểu đồ vận khí cả năm"
        onMouseMove={e => setHover(pick(e))} onMouseLeave={() => setHover(null)} onClick={e => onPick(days[pick(e)])}>
        <defs>
          <linearGradient id="wave-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--ac)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--ac)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map(v => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="var(--bdr-med)" strokeDasharray="3 4" />
            <text x={4} y={y(v) + 4} fontSize="11" fill="var(--tx-3)">{v}</text>
          </g>
        ))}
        {monthStarts.map((i, k) => (
          <text key={i} x={x(i) + 2} y={H - 6} fontSize="11" fill="var(--tx-3)">T{k + 1}</text>
        ))}
        <path d={area} fill="url(#wave-fill)" />
        <path d={path} fill="none" stroke="var(--ac)" strokeWidth="2" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD} y2={H - PAD} stroke="var(--tx-3)" />
            <circle cx={x(hover)} cy={y(smooth[hover])} r="4" fill="var(--ac)" />
          </>
        )}
      </svg>
      {h && (
        <div className="absolute top-0 right-0 text-xs tv-card !p-2 pointer-events-none">
          {h.info.d}/{h.info.m} (ÂL {h.info.lunar.day}/{h.info.lunar.month}) · {h.score} – {scoreLabel(h.score).text}
        </div>
      )}
    </div>
  );
}
