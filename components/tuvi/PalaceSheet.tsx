'use client';
import { useEffect } from 'react';
import type { ChartIndex } from '@/lib/lich/vanhan';
import type { Factor } from '@/lib/lich/cung-ngay';
import type { Star } from '@/lib/ziwei/types';
import { vi, canChi, SIHUA_VI } from '@/lib/ziwei/vi';
import { tuanTriet } from '@/lib/ziwei/describe';
import { STAR_MEANING, PALACE_MEANING } from '@/lib/ziwei/y-nghia';
import { verdictOf } from '@/lib/lich/phan-tich';
import { suggestForPalace, type Scope } from '@/lib/lich/de-xuat';
import type { JobTrend } from '@/lib/lich/cong-viec';

const BR_LABEL: Record<string, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Lợi', '平': 'Bình', '不': 'Bất', '陷': 'Hãm',
};
const HIDDEN = new Set(['旬空', '截路', '空亡', '旬中', '截空']);

export const tone = (s: number) => (s >= 66 ? 'great' : s >= 58 ? 'good' : s >= 48 ? 'mid' : s >= 40 ? 'bad' : 'worst');

export interface PalaceSheetData {
  key: string;
  branch: number;
  name: string;
  score: number;
  factors: Factor[];
  advice: string;
  /** Ví dụ "trong ngày 1/11", "trong tháng 11/2026", "trong năm 2026" */
  scopeLabel: string;
  scope: Scope;
  /** Xu hướng công việc của kỳ (dùng cho đề xuất cung Quan Lộc) */
  job?: JobTrend;
  best?: { label: string; score: number }[];
  worst?: { label: string; score: number }[];
  series?: { labels: string[]; values: number[] };
}

function StarRow({ s }: { s: Star }) {
  const color = s.type === 'sha' ? 'var(--worst)' : s.type === 'major' ? 'var(--tx-0)' : 'var(--great)';
  return (
    <li className="grid gap-0.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <b style={{ color }}>{vi(s.name)}</b>
        {s.brightnessLabel && BR_LABEL[s.brightnessLabel] && (
          <span className="text-[11px] px-1.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--tx-2)' }}>{BR_LABEL[s.brightnessLabel]}</span>
        )}
        {s.siHua && <span className="text-[11px] px-1.5 rounded tone-mid">{SIHUA_VI[s.siHua]} gốc</span>}
      </div>
      {STAR_MEANING[s.name] && <div className="text-[13px] tv-muted">{STAR_MEANING[s.name]}</div>}
    </li>
  );
}

function Spark({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] h-20">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${labels[i]}: ${v}`}>
          <div className={`w-full rounded-t tone-${tone(v)}`} style={{ height: `${(v / max) * 60}px`, background: 'currentColor' }} />
          {values.length <= 12 && <span className="text-[9px] tv-muted">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

export default function PalaceSheet({ idx, data, onClose }: { idx: ChartIndex; data: PalaceSheetData; onClose: () => void }) {
  const p = idx.byBranch[data.branch];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  if (!p) return null;
  const majors = p.stars.filter(s => s.type === 'major');
  const lucky = p.stars.filter(s => s.type === 'lucky' && !HIDDEN.has(s.name));
  const sha = p.stars.filter(s => s.type === 'sha' && !HIDDEN.has(s.name));
  const minor = p.stars.filter(s => s.type === 'minor' && !HIDDEN.has(s.name));
  const tt = tuanTriet(p);
  const nameKey = p.name === '命宫' ? '命宫' : p.name.replace(/宫$/, '');
  const suggestions = suggestForPalace(idx, data.key, { score: data.score, factors: data.factors, scope: data.scope, job: data.job });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center no-print" role="dialog" aria-modal="true" aria-label={`Chi tiết cung ${data.name}`}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 grid gap-4"
        style={{ background: 'var(--bg-0)', border: '1px solid var(--bdr-med)' }}>
        <div className="grid gap-1.5 sticky -top-5 -mx-5 -mt-5 px-5 pt-5 pb-3 z-10" style={{ background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-widest tv-accent font-semibold">Cung {data.scopeLabel}</div>
            <button className="tv-btn !px-3 !py-1 shrink-0" onClick={onClose} aria-label="Đóng">✕</button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="tv-title text-2xl">{data.name} <span className="text-base tv-muted font-normal whitespace-nowrap">({canChi(p.stem, p.branch)})</span></h2>
            <span className={`tone-${tone(data.score)} px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap`}>{data.score} · {verdictOf(data.score)}</span>
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--tx-1)' }}>
          <b>Cung này nói về:</b> {PALACE_MEANING[nameKey] ?? ''}
        </p>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {p.isMingGong && <span className="px-2 py-0.5 rounded-full tone-mid">Cung Mệnh</span>}
          {p.isShenGong && <span className="px-2 py-0.5 rounded-full tone-mid">Thân cư tại đây</span>}
          {p.daXianAge && <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2)' }}>Đại hạn {p.daXianAge[0]}–{p.daXianAge[1]} tuổi{p.isCurrentDaXian ? ' (đang đi)' : ''}</span>}
          {p.changsheng && <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2)' }}>Tràng sinh: {vi(p.changsheng)}</span>}
          {tt.map(t => <span key={t} className="px-2 py-0.5 rounded-full tone-worst">Gặp {t}</span>)}
        </div>

        <section className="grid gap-2">
          <h3 className="font-semibold" style={{ color: 'var(--tx-0)' }}>⚡ Vì sao {data.scopeLabel} được {data.score} điểm</h3>
          {data.factors.length ? (
            <ul className="grid gap-1.5 text-sm">
              {data.factors.map(f => (
                <li key={f.text} className="flex gap-2" style={{ color: f.pts > 0 ? 'var(--great)' : f.pts < 0 ? 'var(--worst)' : 'var(--tx-1)' }}>
                  <span>{f.pts > 0 ? '▲' : f.pts < 0 ? '▼' : '•'}</span><span>{f.text}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm tv-muted">Không có tác động đặc biệt; điểm chủ yếu do nền sao của cung.</p>}
          <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: 'var(--ac-bg)', color: 'var(--tx-0)' }}>👉 {data.advice}</p>
        </section>

        {suggestions.length > 0 && (
          <section className="grid gap-3">
            <h3 className="font-semibold" style={{ color: 'var(--tx-0)' }}>💡 Đề xuất cụ thể cho bạn</h3>
            {suggestions.map(g => (
              <div key={g.title} className="rounded-xl p-3 grid gap-1.5"
                style={{ background: g.icon === '🛡' ? 'var(--worst-bg)' : 'var(--bg-1)', border: `1px solid ${g.icon === '🛡' ? 'var(--worst)' : 'var(--bdr-med)'}` }}>
                <div className="text-sm font-semibold tv-accent">{g.icon} {g.title}</div>
                <ul className="grid gap-1.5 text-sm" style={{ color: 'var(--tx-1)' }}>
                  {g.items.map(it => <li key={it} className="pl-4 relative"><span className="absolute left-0 tv-accent">✓</span>{it}</li>)}
                </ul>
                {g.note && <p className="text-[11px] tv-muted italic">{g.note}</p>}
              </div>
            ))}
          </section>
        )}

        {data.series && (
          <section className="grid gap-2">
            <h3 className="font-semibold" style={{ color: 'var(--tx-0)' }}>📈 Diễn biến {data.scopeLabel}</h3>
            <Spark labels={data.series.labels} values={data.series.values} />
          </section>
        )}

        {(data.best?.length || data.worst?.length) ? (
          <section className="grid sm:grid-cols-2 gap-2 text-sm">
            {data.best && (
              <div className="rounded-lg p-3 tone-good">
                <div className="font-semibold mb-1">Thuận nhất</div>
                {data.best.map(x => <div key={x.label} style={{ color: 'var(--tx-1)' }}>{x.label} · <b>{x.score}</b></div>)}
              </div>
            )}
            {data.worst && (
              <div className="rounded-lg p-3 tone-worst">
                <div className="font-semibold mb-1">Cần để ý</div>
                {data.worst.map(x => <div key={x.label} style={{ color: 'var(--tx-1)' }}>{x.label} · <b>{x.score}</b></div>)}
              </div>
            )}
          </section>
        ) : null}

        <section className="grid gap-2">
          <h3 className="font-semibold" style={{ color: 'var(--tx-0)' }}>✦ Sao trong cung (lá số gốc)</h3>
          {majors.length ? (
            <ul className="grid gap-2">{majors.map(s => <StarRow key={s.name} s={s} />)}</ul>
          ) : (
            <p className="text-sm tv-muted">Vô chính diệu{p.borrowedStars?.length ? `, mượn ${p.borrowedStars.map(vi).join(', ')} từ cung ${vi(p.borrowedFromName)}` : ''}.</p>
          )}
          {lucky.length > 0 && (
            <>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--great)' }}>Cát tinh</div>
              <ul className="grid gap-2">{lucky.map(s => <StarRow key={s.name} s={s} />)}</ul>
            </>
          )}
          {sha.length > 0 && (
            <>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--worst)' }}>Sát tinh</div>
              <ul className="grid gap-2">{sha.map(s => <StarRow key={s.name} s={s} />)}</ul>
            </>
          )}
          {minor.length > 0 && (
            <p className="text-xs tv-muted mt-1">Phụ tinh khác: {minor.map(s => vi(s.name)).join(', ')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
