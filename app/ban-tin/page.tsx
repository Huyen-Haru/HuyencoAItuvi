'use client';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import { generateChart } from '@/lib/ziwei/algorithm';
import { profileToBirthInfo, type Profile } from '@/lib/profiles';
import { indexChart, scoreLabel } from '@/lib/lich/vanhan';
import { buildBrief, type Brief } from '@/lib/lich/phan-tich';

const tone = (s: number) => (s >= 66 ? 'great' : s >= 58 ? 'good' : s >= 48 ? 'mid' : s >= 40 ? 'bad' : 'worst');

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

function BriefView({ b, name }: { b: Brief; name: string }) {
  const [open, setOpen] = useState<string | null>(null);
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
            <div key={d.key} className="tv-card !p-4 grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold" style={{ color: 'var(--tx-0)' }}>{d.icon} {d.label}</span>
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
            </div>
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {b.palaces.map(p => (
            <button key={p.key} onClick={() => setOpen(o => (o === p.key ? null : p.key))}
              className={`tone-${tone(p.score)} rounded-lg p-2 text-left`}
              style={{ outline: open === p.key ? '2px solid var(--ac)' : 'none' }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--tx-0)' }}>{p.name}</div>
              <div className="text-xl font-bold">{p.score}</div>
              <div className="text-[10px] truncate" style={{ color: 'var(--tx-2)' }}>{p.stars}</div>
            </button>
          ))}
        </div>
        {open && (() => {
          const p = b.palaces.find(x => x.key === open)!;
          return (
            <div className="rounded-lg p-3 text-sm grid gap-1" style={{ background: 'var(--bg-1)' }}>
              <div className="font-semibold" style={{ color: 'var(--tx-0)' }}>{p.name} ({p.canChi}) · {p.stars}</div>
              {p.factors.length ? p.factors.map(f => (
                <div key={f.text} style={{ color: f.pts > 0 ? 'var(--great)' : f.pts < 0 ? 'var(--worst)' : 'var(--tx-2)' }}>
                  {f.pts > 0 ? '▲' : f.pts < 0 ? '▼' : '•'} {f.text}
                </div>
              )) : <div className="tv-muted">Không có tác động đặc biệt.</div>}
              <div className="mt-1">👉 {p.advice}</div>
            </div>
          );
        })()}
        <p className="text-xs tv-muted">Bấm vào một cung để xem lý do tăng/giảm điểm.</p>
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

function useBrief(profile: Profile | null, date: Date) {
  return useMemo(() => {
    if (!profile) return null;
    const idx = indexChart(generateChart(profileToBirthInfo(profile)));
    return buildBrief(idx, date.getFullYear(), date.getMonth() + 1, date.getDate());
  }, [profile, date]);
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

function LinkView({ profile, base, date, offset, setOffset }: { profile: Profile; base: Date; date: Date; offset: number; setOffset: (n: number) => void }) {
  const b = useBrief(profile, date);
  if (!b) return null;
  return (
    <>
      <DateSwitch base={base} day={offset} setDay={setOffset} />
      <BriefView b={b} name={profile.name} />
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
