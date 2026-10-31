'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import { generateChart } from '@/lib/ziwei/algorithm';
import { profileToBirthInfo, type Profile } from '@/lib/profiles';
import { indexChart, scoreLabel, type ChartIndex } from '@/lib/lich/vanhan';
import { buildBrief, DOMAIN_DEFS, type Brief } from '@/lib/lich/phan-tich';
import { monthOverview, yearOverview, type PeriodOverview } from '@/lib/lich/tong-quan';
import PalaceSheet, { tone, type PalaceSheetData } from '@/components/tuvi/PalaceSheet';
import { suggestForPalace, topSuggestion, pickDomainPalace } from '@/lib/lich/de-xuat';
import type { JobTrend } from '@/lib/lich/cong-viec';

/** Kỳ có biến động công việc rõ nhất (dùng cho đề xuất Quan Lộc) */
function strongestJob(jobs: JobTrend[]): JobTrend | undefined {
  return [...jobs].sort((a, b) => b.chuDong + b.biDong - (a.chuDong + a.biDong))[0];
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative w-[132px] h-[132px] tone-${tone(score)} !bg-transparent shrink-0 justify-self-center`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: 'var(--tx-0)' }}>{score}</span>
        <span className="text-xs font-semibold">{scoreLabel(score).text}</span>
      </div>
    </div>
  );
}

function Meter({ score }: { score: number }) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--bg-2)' }}>
      <div className={`h-full rounded-full tone-${tone(score)}`} style={{ width: `${score}%`, background: 'currentColor' }} />
    </div>
  );
}

const KP: Record<string, { icon: string; color: string }> = {
  'co-hoi': { icon: '✨', color: 'var(--great)' },
  'luu-y': { icon: '⚠️', color: 'var(--bad)' },
  'nen-lam': { icon: '🎯', color: 'var(--ac)' },
};

function BriefView({ b, name, idx, onOpen }: { b: Brief; name: string; idx: ChartIndex; onOpen: (d: PalaceSheetData) => void }) {
  const dayLabel = `ngày ${b.ds.info.d}/${b.ds.info.m}`;
  const openPalace = (key: string) => {
    const p = b.palaces.find(x => x.key === key);
    if (p) onOpen({ key: p.key, branch: p.branch, name: p.name, score: p.score, factors: p.factors, advice: p.advice, scopeLabel: dayLabel, scope: 'ngay', job: b.job });
  };
  const tip = (domainKey: string, domainScore: number) => {
    const keys = DOMAIN_DEFS.find(x => x.key === domainKey)!.palaces;
    const p = pickDomainPalace(domainScore, keys.map(k => b.palaces.find(x => x.key === k)!).filter(Boolean));
    return p ? topSuggestion(suggestForPalace(idx, p.key, { score: p.score, factors: p.factors, scope: 'ngay', job: b.job })) : undefined;
  };
  const maxWeek = Math.max(...b.week.map(w => w.score));

  return (
    <div className="grid gap-5 max-w-3xl mx-auto">
      {/* Hero */}
      <section className="tv-card !p-5 sm:!p-6 grid sm:grid-cols-[auto_1fr] gap-5 items-center"
        style={{ background: 'linear-gradient(135deg, var(--ac-bg), var(--bg-card))', borderColor: 'var(--ac-bdr)' }}>
        <ScoreRing score={b.ds.score} />
        <div className="grid gap-1.5">
          <div className="text-xs uppercase tracking-widest tv-accent font-semibold">Bản tin của {name}</div>
          <h1 className="tv-title text-2xl">{b.dateLabel}</h1>
          <div className="text-sm tv-muted">{b.lunarLine}</div>
          <p className="text-[15px] leading-relaxed mt-1" style={{ color: 'var(--tx-1)' }}>{b.theme}</p>
        </div>
      </section>

      {/* 3 điều cần biết */}
      <section className="grid sm:grid-cols-3 gap-3">
        {b.keyPoints.map(k => (
          <div key={k.kind} className="tv-card !p-4 grid gap-1.5" style={{ borderLeft: `4px solid ${KP[k.kind].color}` }}>
            <div className="font-semibold text-[15px]" style={{ color: 'var(--tx-0)' }}>{KP[k.kind].icon} {k.title}</div>
            <p className="text-sm leading-relaxed tv-muted">{k.text}</p>
          </div>
        ))}
      </section>

      {/* Lĩnh vực */}
      <section className="grid gap-3">
        <h2 className="tv-title text-lg">Từng lĩnh vực</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {b.domains.map(d => (
            <button key={d.key} className="tv-card !p-4 grid gap-2 text-left hover:border-[color:var(--ac)] transition-colors"
              onClick={() => openPalace(DOMAIN_DEFS.find(x => x.key === d.key)!.palaces[0])}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold" style={{ color: 'var(--tx-0)' }}>{d.icon} {d.label} <span className="tv-muted text-xs font-normal">›</span></span>
                <span className={`tone-${tone(d.score)} px-2 py-0.5 rounded-full text-xs font-semibold`}>{d.score} · {d.verdict}</span>
              </div>
              <Meter score={d.score} />
              <p className="text-[13px] tv-muted">{d.intro}</p>
              {d.reasons.length > 0 && (
                <ul className="text-[13px] grid gap-1" style={{ color: 'var(--tx-2)' }}>
                  {d.reasons.map(r => <li key={r} className="pl-3 relative"><span className="absolute left-0">·</span>{r}</li>)}
                </ul>
              )}
              <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: 'var(--bg-1)', color: 'var(--tx-0)' }}>👉 {d.action}</p>
              {(() => { const t = tip(d.key, d.score); return t ? <p className="text-[13px] tv-accent">💡 {t} <span className="tv-muted">Bấm để xem thêm đề xuất.</span></p> : null; })()}
            </button>
          ))}
        </div>
      </section>

      {/* Giờ */}
      <section className="tv-card !p-4 grid gap-3">
        <h2 className="tv-title text-lg">Lịch giờ trong ngày</h2>
        <div className="grid grid-cols-9 gap-1">
          {b.hours.map(h => (
            <div key={h.branch} className="rounded-md py-1.5 text-center text-[10px] sm:text-xs leading-tight"
              style={{ background: h.good ? 'var(--ac-bg)' : 'var(--bg-1)', border: `1px solid ${h.good ? 'var(--ac)' : 'transparent'}`, color: h.good ? 'var(--ac)' : 'var(--tx-3)' }}>
              <div className="font-semibold">{h.name}</div>
              <div>{h.range.replace('h', '')}</div>
            </div>
          ))}
        </div>
        <ul className="grid gap-1.5 text-sm">
          {b.hours.filter(h => h.good).map(h => (
            <li key={h.branch} className="flex gap-2"><span className="tv-accent font-semibold w-16 shrink-0">{h.range}</span><span>{h.suggestion}</span></li>
          ))}
        </ul>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg p-3 tone-good"><b>Nên:</b> <span style={{ color: 'var(--tx-1)' }}>{b.calendar.nen.join(', ')}</span></div>
          <div className="rounded-lg p-3 tone-worst"><b>Tránh:</b> <span style={{ color: 'var(--tx-1)' }}>{b.calendar.kieng.join(', ')}</span></div>
        </div>
        <p className="text-xs tv-muted">
          Trực {b.calendar.truc} ({b.calendar.trucQuality}) · {b.calendar.than}, {b.calendar.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'} · Sao {b.calendar.sao} ({b.calendar.saoTot ? 'tốt' : 'xấu'}) · Xung tuổi {b.calendar.xung}
        </p>
      </section>

      {/* 12 cung */}
      <section className="tv-card !p-4 grid gap-3">
        <h2 className="tv-title text-lg">12 cung trong ngày</h2>
        <PalaceGrid palaces={b.palaces} onPick={openPalace} />
        <p className="text-xs tv-muted">Bấm vào một cung để xem chi tiết: sao trong cung, lý do tăng/giảm điểm, lời khuyên.</p>
      </section>

      {/* Công việc + tuần */}
      <section className="grid sm:grid-cols-2 gap-3">
        <div className="tv-card !p-4 grid gap-2">
          <h2 className="tv-title">💼 Công việc tháng {b.job.lunarMonth} âm</h2>
          <div className="text-lg font-semibold tv-accent">{b.job.label}</div>
          <div className="flex gap-2 text-xs">
            <span className="tone-good px-2 py-0.5 rounded-full">Chủ động {b.job.chuDong}</span>
            <span className="tone-worst px-2 py-0.5 rounded-full">Bị động {b.job.biDong}</span>
          </div>
          <ul className="text-[13px] grid gap-1 tv-muted">{b.job.reasons.map(r => <li key={r}>· {r}</li>)}</ul>
          {b.job.keyMonth && <p className="text-sm">📌 Tháng then chốt: <b>tháng {b.job.keyMonth.lunarMonth} âm</b>, {b.job.keyMonth.label.toLowerCase()}.</p>}
        </div>
        <div className="tv-card !p-4 grid gap-2">
          <h2 className="tv-title">📅 7 ngày tới</h2>
          <div className="flex items-end gap-1.5 h-28">
            {b.week.map(w => (
              <div key={w.short} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--tx-1)' }}>{w.score}{w.isBest ? '⭐' : ''}</span>
                <div className={`w-full rounded-t tone-${tone(w.score)}`} style={{ height: `${(w.score / maxWeek) * 70}px`, background: 'currentColor' }} />
                <span className="text-[10px] tv-muted text-center leading-tight">{w.short.replace(' ', '\n')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="text-xs tv-muted text-center">Tính theo lá số và lịch vạn niên, mang tính tham khảo.</p>
    </div>
  );
}

function PalaceGrid({ palaces, onPick }: { palaces: { key: string; name: string; score: number; stars: string }[]; onPick: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {palaces.map(p => (
        <button key={p.key} onClick={() => onPick(p.key)} className={`tone-${tone(p.score)} rounded-lg p-2 text-left hover:brightness-110`}>
          <div className="text-xs font-semibold" style={{ color: 'var(--tx-0)' }}>{p.name} ›</div>
          <div className="text-xl font-bold">{p.score}</div>
          <div className="text-[10px] truncate" style={{ color: 'var(--tx-2)' }}>{p.stars}</div>
        </button>
      ))}
    </div>
  );
}

/** Tổng quan tháng hoặc năm */
function PeriodView({ o, name, idx, onOpen, onPickDay, onPickMonth }: {
  o: PeriodOverview;
  name: string;
  idx: ChartIndex;
  onOpen: (d: PalaceSheetData) => void;
  onPickDay: (key: string) => void;
  onPickMonth: (m: number) => void;
}) {
  const job = strongestJob(o.jobs);
  const scopeLabel = o.scope === 'thang' ? `trong ${o.title.toLowerCase()}` : `trong ${o.title.split(' · ')[0].toLowerCase()}`;
  const openPalace = (key: string) => {
    const p = o.palaces.find(x => x.key === key);
    if (!p) return;
    onOpen({
      key: p.key, branch: p.branch, name: p.name, score: p.score, factors: p.factors, advice: p.advice, scopeLabel,
      scope: o.scope, job, best: p.best, worst: p.worst,
      series: { labels: o.series.map(x => x.label), values: p.series },
    });
  };
  const maxS = Math.max(...o.series.map(x => x.score));
  const tip = (domainKey: string, domainScore: number) => {
    const keys = DOMAIN_DEFS.find(x => x.key === domainKey)!.palaces;
    const p = pickDomainPalace(domainScore, keys.map(k => o.palaces.find(x => x.key === k)!).filter(Boolean));
    return p ? topSuggestion(suggestForPalace(idx, p.key, { score: p.score, factors: p.factors, scope: o.scope, job })) : undefined;
  };

  return (
    <div className="grid gap-5 max-w-3xl mx-auto">
      <section className="tv-card !p-5 sm:!p-6 grid sm:grid-cols-[auto_1fr] gap-5 items-center"
        style={{ background: 'linear-gradient(135deg, var(--ac-bg), var(--bg-card))', borderColor: 'var(--ac-bdr)' }}>
        <ScoreRing score={o.score} />
        <div className="grid gap-1.5">
          <div className="text-xs uppercase tracking-widest tv-accent font-semibold">Tổng quan {o.scope === 'thang' ? 'tháng' : 'năm'} · {name}</div>
          <h1 className="tv-title text-2xl">{o.title}</h1>
          <div className="text-sm tv-muted">{o.subtitle}</div>
          <p className="text-[15px] leading-relaxed mt-1" style={{ color: 'var(--tx-1)' }}>{o.theme}</p>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        {o.highlights.map(k => (
          <div key={k.kind} className="tv-card !p-4 grid gap-1.5" style={{ borderLeft: `4px solid ${KP[k.kind].color}` }}>
            <div className="font-semibold text-[15px]" style={{ color: 'var(--tx-0)' }}>{KP[k.kind].icon} {k.title}</div>
            <p className="text-sm leading-relaxed tv-muted">{k.text}</p>
          </div>
        ))}
      </section>

      <section className="tv-card !p-4 grid gap-3">
        <h2 className="tv-title text-lg">{o.scope === 'thang' ? 'Từng ngày trong tháng' : 'Từng tháng trong năm'}</h2>
        {o.scope === 'thang' ? (
          <div className="grid grid-cols-7 gap-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(w => <div key={w} className="text-center text-[11px] tv-muted">{w}</div>)}
            {Array.from({ length: (new Date(`${o.series[0].key}T00:00:00`).getDay() + 6) % 7 }, (_, i) => <div key={`e${i}`} />)}
            {o.series.map(x => (
              <button key={x.key} onClick={() => onPickDay(x.key)} className={`tone-${tone(x.score)} rounded-md py-1.5 text-center hover:brightness-110`}>
                <div className="text-sm font-bold" style={{ color: 'var(--tx-0)' }}>{x.label}</div>
                <div className="text-[11px] font-semibold">{x.score}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-36">
            {o.series.map(x => (
              <button key={x.key} onClick={() => onPickMonth(Number(x.key))} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--tx-1)' }}>{x.score}</span>
                <div className={`w-full rounded-t tone-${tone(x.score)} group-hover:brightness-125`} style={{ height: `${(x.score / maxS) * 90}px`, background: 'currentColor' }} />
                <span className="text-[10px] tv-muted">{x.label}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-xs tv-muted">{o.scope === 'thang' ? 'Bấm vào một ngày để xem bản tin ngày đó.' : 'Bấm vào một tháng để xem tổng quan tháng.'}</p>
      </section>

      <section className="grid gap-3">
        <h2 className="tv-title text-lg">Từng lĩnh vực</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {o.domains.map(d => (
            <button key={d.key} onClick={() => openPalace(d.mainKey)} className="tv-card !p-4 grid gap-2 text-left hover:border-[color:var(--ac)] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold" style={{ color: 'var(--tx-0)' }}>{d.icon} {d.label} <span className="tv-muted text-xs font-normal">›</span></span>
                <span className={`tone-${tone(d.score)} px-2 py-0.5 rounded-full text-xs font-semibold`}>{d.score} · {d.verdict}</span>
              </div>
              <Meter score={d.score} />
              <p className="text-[13px] tv-muted">{d.note}</p>
              {(() => { const t = tip(d.key, d.score); return t ? <p className="text-[13px] tv-accent">💡 {t} <span className="tv-muted">Bấm để xem thêm.</span></p> : null; })()}
            </button>
          ))}
        </div>
      </section>

      <section className="tv-card !p-4 grid gap-3">
        <h2 className="tv-title text-lg">12 cung {o.scope === 'thang' ? 'trong tháng' : 'trong năm'}</h2>
        <PalaceGrid palaces={o.palaces} onPick={openPalace} />
        <p className="text-xs tv-muted">Bấm vào một cung để xem chi tiết, diễn biến và {o.scope === 'thang' ? 'ngày' : 'tháng'} thuận nhất của cung đó.</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="tv-card !p-4 grid gap-2">
          <h2 className="tv-title">🌟 {o.scope === 'thang' ? 'Ngày đẹp nhất' : '10 ngày vàng của năm'}</h2>
          {o.bestDays.map(x => (
            <button key={x.key} onClick={() => onPickDay(x.key)} className="flex justify-between text-sm text-left gap-2">
              <span>{x.label}</span><span className={`tone-${tone(x.score)} px-2 rounded-full text-xs font-semibold`}>{x.score}</span>
            </button>
          ))}
        </div>
        <div className="tv-card !p-4 grid gap-2 content-start">
          <h2 className="tv-title">⚠️ Ngày nên thận trọng</h2>
          {o.worstDays.map(x => (
            <button key={x.key} onClick={() => onPickDay(x.key)} className="flex justify-between text-sm text-left gap-2">
              <span>{x.label}</span><span className={`tone-${tone(x.score)} px-2 rounded-full text-xs font-semibold`}>{x.score}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="tv-card !p-4 grid gap-2">
        <h2 className="tv-title">💼 Công việc: chủ động hay bị động</h2>
        <div className="grid gap-2">
          {o.jobs.map(j => (
            <div key={`${j.lunarYear}-${j.lunarMonth}`} className="grid grid-cols-[92px_1fr] gap-2 text-sm items-start">
              <span className="font-semibold">Tháng {j.lunarMonth} âm</span>
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${j.label === 'Ổn định' ? 'tone-mid' : j.label.includes('bị động') ? 'tone-worst' : j.label.includes('chủ động') ? 'tone-good' : 'tone-bad'}`}>{j.label}</span>
                <span className="text-xs tv-muted ml-2">Chủ động {j.chuDong} · Bị động {j.biDong}</span>
                {o.scope === 'thang' && <ul className="text-[13px] tv-muted mt-1">{j.reasons.map(r => <li key={r}>· {r}</li>)}</ul>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs tv-muted text-center">Tính theo lá số và lịch vạn niên, mang tính tham khảo.</p>
    </div>
  );
}

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function DateSwitch({ base, day, setDay }: { base: Date; day: number; setDay: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-2 mb-4 no-print">
      <button className="tv-chip !py-1.5 !px-3" onClick={() => setDay(day - 1)} aria-label="Ngày trước">‹</button>
      {[0, 1, 2].map(n => {
        const t = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
        return (
          <button key={n} className="tv-chip !py-1.5 !px-4" data-on={day === n} onClick={() => setDay(n)}>
            {WD[t.getDay()]} {t.getDate()}/{t.getMonth() + 1}
          </button>
        );
      })}
      <button className="tv-chip !py-1.5 !px-3" onClick={() => setDay(day + 1)} aria-label="Ngày sau">›</button>
    </div>
  );
}

/** Hồ sơ lấy từ link (?ten=&ns=yyyy-mm-dd&gio=HH:MM&gt=nu) để mở được trên mọi máy. */
function profileFromParams(sp: URLSearchParams): Profile | null {
  const ns = sp.get('ns');
  if (!ns) return null;
  const [y, m, d] = ns.split('-').map(Number);
  if (!y || !m || !d) return null;
  const gio = sp.get('gio') ?? 'khong-ro';
  const [hh, mm] = gio === 'khong-ro' ? [null, 0] : gio.split(':').map(Number);
  return {
    id: 'link', name: sp.get('ten') ?? 'Bạn', gender: sp.get('gt') === 'nu' ? 'female' : 'male',
    year: y, month: m, day: d, hour: hh, minute: mm ?? 0, createdAt: 0,
  };
}

function Content() {
  const sp = useSearchParams();
  const linkProfile = useMemo(() => profileFromParams(new URLSearchParams(sp.toString())), [sp]);
  const ngay = sp.get('ngay');
  const base = useMemo(() => {
    if (ngay) { const [y, m, d] = ngay.split('-').map(Number); if (y && m && d) return new Date(y, m - 1, d); }
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, [ngay]);
  const [offset, setOffset] = useState(0);
  const date = useMemo(() => new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset), [base, offset]);

  if (linkProfile) return <LinkView profile={linkProfile} base={base} date={date} offset={offset} setOffset={setOffset} />;
  return (
    <RequireProfile title="Bản tin Tử Vi">
      {({ profile }) => <LinkView profile={profile} base={base} date={date} offset={offset} setOffset={setOffset} />}
    </RequireProfile>
  );
}

type Scope = 'ngay' | 'thang' | 'nam';

function LinkView({ profile, base, date, offset, setOffset }: { profile: Profile; base: Date; date: Date; offset: number; setOffset: (n: number) => void }) {
  const idx = useMemo<ChartIndex>(() => indexChart(generateChart(profileToBirthInfo(profile))), [profile]);
  const [scope, setScope] = useState<Scope>('ngay');
  const [sheet, setSheet] = useState<PalaceSheetData | null>(null);
  const [ym, setYm] = useState({ y: date.getFullYear(), m: date.getMonth() + 1 });
  const [year, setYear] = useState(date.getFullYear());
  const [yearData, setYearData] = useState<ReturnType<typeof yearOverview> | null>(null);

  const b = useMemo(() => buildBrief(idx, date.getFullYear(), date.getMonth() + 1, date.getDate()), [idx, date]);
  const month = useMemo(() => (scope === 'thang' ? monthOverview(idx, ym.y, ym.m) : null), [idx, ym, scope]);

  // Tổng quan năm tính lâu hơn (~1 giây): tính sau khi hiện trạng thái "đang tính"
  useEffect(() => {
    if (scope !== 'nam') return;
    setYearData(null);
    const t = setTimeout(() => setYearData(yearOverview(idx, year)), 30);
    return () => clearTimeout(t);
  }, [idx, year, scope]);

  const goDay = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    setOffset(Math.round((target.getTime() - base.getTime()) / 86400000));
    setScope('ngay');
    window.scrollTo({ top: 0 });
  };
  const goMonth = (m: number) => { setYm({ y: year, m }); setScope('thang'); window.scrollTo({ top: 0 }); };
  const shiftMonth = (delta: number) => setYm(({ y, m }) => { const t = new Date(y, m - 1 + delta, 1); return { y: t.getFullYear(), m: t.getMonth() + 1 }; });

  return (
    <>
      <div className="text-center text-xs tv-muted mb-1.5 no-print">Tổng quan theo</div>
      <div className="flex justify-center mb-3 no-print">
        <div className="inline-flex p-1 rounded-full gap-1" style={{ background: 'var(--bg-1)', border: '1px solid var(--bdr-med)' }}>
          {([['ngay', 'Ngày'], ['thang', 'Tháng'], ['nam', 'Năm']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setScope(k)} className="px-6 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap"
              style={{ background: scope === k ? 'var(--ac)' : 'transparent', color: scope === k ? '#1a1408' : 'var(--tx-2)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {scope === 'ngay' && (
        <>
          <DateSwitch base={base} day={offset} setDay={setOffset} />
          <BriefView b={b} name={profile.name} idx={idx} onOpen={setSheet} />
        </>
      )}

      {scope === 'thang' && month && (
        <>
          <div className="flex justify-center items-center gap-2 mb-4 no-print">
            <button className="tv-chip !py-1.5 !px-3" onClick={() => shiftMonth(-1)} aria-label="Tháng trước">‹</button>
            <span className="font-semibold px-2">Tháng {ym.m}/{ym.y}</span>
            <button className="tv-chip !py-1.5 !px-3" onClick={() => shiftMonth(1)} aria-label="Tháng sau">›</button>
          </div>
          <PeriodView o={month} name={profile.name} idx={idx} onOpen={setSheet} onPickDay={goDay} onPickMonth={goMonth} />
        </>
      )}

      {scope === 'nam' && (
        <>
          <div className="flex justify-center items-center gap-2 mb-4 no-print">
            <button className="tv-chip !py-1.5 !px-3" onClick={() => setYear(y => y - 1)} aria-label="Năm trước">‹</button>
            <span className="font-semibold px-2">Năm {year}</span>
            <button className="tv-chip !py-1.5 !px-3" onClick={() => setYear(y => y + 1)} aria-label="Năm sau">›</button>
          </div>
          {yearData
            ? <PeriodView o={yearData} name={profile.name} idx={idx} onOpen={setSheet} onPickDay={goDay} onPickMonth={goMonth} />
            : <div className="tv-card text-center py-16 tv-muted max-w-3xl mx-auto">Đang tính vận cả năm…</div>}
        </>
      )}

      {sheet && <PalaceSheet idx={idx} data={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}

export default function BanTinPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="tv-muted py-20 text-center">Đang tải…</div>}>
        <Content />
      </Suspense>
    </Shell>
  );
}
