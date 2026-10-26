'use client';
import { useMemo, useState } from 'react';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import DayDetail, { ScorePill } from '@/components/tuvi/DayDetail';
import YearWave from '@/components/tuvi/YearWave';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { Profile } from '@/lib/profiles';
import { useJournal } from '@/lib/journal';
import {
  indexChart, scoreDay, scoreMonth, scoreYear, scoreLabel, activityScore,
  ACTIVITIES, DOMAINS, type DayScore,
} from '@/lib/lich/vanhan';
import { WEEKDAYS_SHORT, WEEKDAYS_VI } from '@/lib/lich/ngay';
import { yearCanChi } from '@/lib/ziwei/vi';

type Tab = 'thang' | 'nam';

function avg(list: number[]) {
  return list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0;
}

function LichView({ profile, chart }: { profile: Profile; chart: ZiweiChart }) {
  const now = new Date();
  const idx = useMemo(() => indexChart(chart), [chart]);
  const [tab, setTab] = useState<Tab>('thang');
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [selKey, setSelKey] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const { journal, saveEntry } = useJournal(profile.id);

  const today = useMemo(() => scoreDay(idx, now.getFullYear(), now.getMonth() + 1, now.getDate()), [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  const month = useMemo(() => scoreMonth(idx, ym.y, ym.m), [idx, ym]);
  const act = ACTIVITIES.find(a => a.key === activity) ?? null;
  const selected = month.find(d => d.info.key === selKey) ?? null;

  const firstWeekday = new Date(ym.y, ym.m - 1, 1).getDay();
  const offset = (firstWeekday + 6) % 7; // tuần bắt đầu thứ Hai

  const go = (delta: number) => {
    setSelKey(null);
    setYm(({ y, m }) => {
      const t = new Date(y, m - 1 + delta, 1);
      return { y: t.getFullYear(), m: t.getMonth() + 1 };
    });
  };

  const goodDays = act ? month.filter(d => activityScore(d, act) >= 62).length : 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="tv-title text-2xl">Lịch vận hạn của {profile.name}</h1>
          <p className="tv-muted text-sm">Điểm ngày tính theo lá số riêng kết hợp lịch vạn niên (Trực, Hoàng/Hắc đạo, Nhị thập bát tú, tuổi xung hợp).</p>
        </div>
        <div className="flex gap-2">
          <button className="tv-chip !py-2 !px-4" data-on={tab === 'thang'} onClick={() => setTab('thang')}>Theo tháng</button>
          <button className="tv-chip !py-2 !px-4" data-on={tab === 'nam'} onClick={() => setTab('nam')}>Tổng quan năm</button>
        </div>
      </div>

      <DayDetail ds={today} title="Hôm nay" shareName={profile.name}
        entry={journal[today.info.key]} onSaveEntry={e => saveEntry(today.info.key, e)} />

      {tab === 'thang' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="tv-card">
            <div className="flex items-center justify-between mb-3">
              <button className="tv-btn !px-3" onClick={() => go(-1)} aria-label="Tháng trước">‹</button>
              <div className="text-center">
                <div className="tv-title text-lg">Tháng {ym.m}/{ym.y}</div>
                <div className="text-xs tv-muted">Điểm trung bình tháng: {avg(month.map(d => d.score))}</div>
              </div>
              <button className="tv-btn !px-3" onClick={() => go(1)} aria-label="Tháng sau">›</button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-sm tv-muted mr-1 self-center">Chọn ngày để:</span>
              {ACTIVITIES.map(a => (
                <button key={a.key} className="tv-chip !text-xs" data-on={activity === a.key}
                  onClick={() => setActivity(x => (x === a.key ? null : a.key))}>{a.label}</button>
              ))}
            </div>
            {act && <p className="text-sm mb-3 tv-accent">Có {goodDays} ngày hợp để “{act.label.toLowerCase()}” trong tháng này (viền sáng).</p>}

            <div className="lich-grid text-center text-xs tv-muted mb-1">
              {[1, 2, 3, 4, 5, 6, 0].map(w => <div key={w}>{WEEKDAYS_SHORT[w]}</div>)}
            </div>
            <div className="lich-grid">
              {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}
              {month.map(d => {
                const l = scoreLabel(d.score);
                const isToday = d.info.key === today.info.key;
                const fit = act ? activityScore(d, act) >= 62 : false;
                const dim = act && !fit;
                return (
                  <button key={d.info.key} onClick={() => setSelKey(d.info.key)}
                    className={`tone-${l.tone} rounded-md p-1 sm:p-1.5 min-h-[58px] sm:min-h-[70px] flex flex-col items-center justify-between relative transition-opacity`}
                    style={{
                      opacity: dim ? 0.3 : 1,
                      outline: selKey === d.info.key ? '2px solid var(--ac)' : fit ? '2px solid var(--great)' : isToday ? '1px solid var(--ac)' : 'none',
                      outlineOffset: -1,
                    }}
                    title={`${d.info.d}/${d.info.m}: ${d.score} điểm – ${l.text}`}>
                    <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--tx-0)' }}>{d.info.d}</span>
                    <span className="text-[10px]" style={{ color: 'var(--tx-2)' }}>
                      {d.info.lunar.day === 1 ? `${d.info.lunar.day}/${d.info.lunar.month}` : d.info.lunar.day}
                    </span>
                    <span className="text-[10px] font-semibold">{d.score}</span>
                    {journal[d.info.key] && <span className="absolute top-0.5 right-1 text-[10px]" title="Có nhật ký">✎</span>}
                    {d.info.than.hoangDao && <span className="absolute top-0.5 left-1 text-[8px]" title="Ngày hoàng đạo">●</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs tv-muted">
              {(['great', 'good', 'mid', 'bad', 'worst'] as const).map((t, i) => (
                <span key={t} className="flex items-center gap-1"><span className={`tone-${t} w-3 h-3 rounded inline-block`} />{['Rất tốt', 'Tốt', 'Bình hòa', 'Kém', 'Xấu'][i]}</span>
              ))}
              <span>● Hoàng đạo · ✎ Có nhật ký</span>
            </div>
          </div>

          <div>
            {selected
              ? <DayDetail ds={selected} shareName={profile.name} entry={journal[selected.info.key]} onSaveEntry={e => saveEntry(selected.info.key, e)} />
              : <MonthSummary month={month} onPick={setSelKey} />}
          </div>
        </div>
      )}

      {tab === 'nam' && <YearOverview idx={idx} year={ym.y} setYear={y => setYm({ y, m: ym.m })}
        onPickDay={(m, key) => { setYm({ y: ym.y, m }); setSelKey(key); setTab('thang'); }} />}
    </div>
  );
}

function MonthSummary({ month, onPick }: { month: DayScore[]; onPick: (k: string) => void }) {
  const sorted = [...month].sort((a, b) => b.score - a.score);
  return (
    <div className="tv-card grid gap-4">
      <div>
        <h3 className="tv-title mb-2">Ngày đẹp nhất tháng</h3>
        <ul className="grid gap-1.5">
          {sorted.slice(0, 5).map(d => (
            <li key={d.info.key}>
              <button className="w-full flex justify-between items-center text-sm" onClick={() => onPick(d.info.key)}>
                <span>{WEEKDAYS_VI[d.info.weekday]} {d.info.d}/{d.info.m} <span className="tv-muted">· {d.info.canChiNgay}</span></span>
                <ScorePill score={d.score} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="tv-title mb-2">Ngày nên thận trọng</h3>
        <ul className="grid gap-1.5">
          {sorted.slice(-3).reverse().map(d => (
            <li key={d.info.key}>
              <button className="w-full flex justify-between items-center text-sm" onClick={() => onPick(d.info.key)}>
                <span>{WEEKDAYS_VI[d.info.weekday]} {d.info.d}/{d.info.m} <span className="tv-muted">· {d.info.canChiNgay}</span></span>
                <ScorePill score={d.score} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs tv-muted">Bấm vào một ngày trên lịch để xem chi tiết và ghi nhật ký.</p>
    </div>
  );
}

function YearOverview({ idx, year, setYear, onPickDay }: {
  idx: ReturnType<typeof indexChart>;
  year: number;
  setYear: (y: number) => void;
  onPickDay: (m: number, key: string) => void;
}) {
  const days = useMemo(() => scoreYear(idx, year), [idx, year]);
  const months = Array.from({ length: 12 }, (_, i) => days.filter(d => d.info.m === i + 1));
  const monthAvg = months.map(ms => avg(ms.map(d => d.score)));
  const quarters = [0, 1, 2, 3].map(q => avg(months.slice(q * 3, q * 3 + 3).flat().map(d => d.score)));
  const sorted = [...days].sort((a, b) => b.score - a.score);

  const bestMonthFor = ACTIVITIES.map(a => {
    const per = months.map(ms => avg(ms.map(d => activityScore(d, a))));
    const m = per.indexOf(Math.max(...per));
    return { a, m: m + 1, score: per[m] };
  });
  const domainYear = DOMAINS.map(dm => ({ dm, v: avg(days.map(d => d.domains[dm.key])) }));

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <button className="tv-btn !px-3" onClick={() => setYear(year - 1)}>‹</button>
        <div className="tv-title text-lg">Năm {year} · {yearCanChi(year)}</div>
        <button className="tv-btn !px-3" onClick={() => setYear(year + 1)}>›</button>
      </div>

      <div className="tv-card">
        <h3 className="tv-title mb-1">Sóng vận khí cả năm</h3>
        <p className="text-xs tv-muted mb-3">Đường trung bình 7 ngày. Bấm vào biểu đồ để mở ngày đó trên lịch.</p>
        <YearWave days={days} onPick={d => onPickDay(d.info.m, d.info.key)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="tv-card">
          <h3 className="tv-title mb-3">Theo quý và tháng</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quarters.map((q, i) => (
              <div key={i} className={`rounded-lg p-2 text-center tone-${scoreLabel(q).tone}`}>
                <div className="text-xs">Quý {i + 1}</div>
                <div className="text-lg font-bold">{q}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            {monthAvg.map((v, i) => (
              <div key={i} className="grid grid-cols-[70px_1fr_30px] gap-2 items-center text-sm">
                <span>Tháng {i + 1}</span>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-2)' }}>
                  <div className={`h-full rounded-full tone-${scoreLabel(v).tone}`} style={{ width: `${v}%`, background: 'currentColor' }} />
                </div>
                <span className="text-xs tv-muted text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tv-card">
          <h3 className="tv-title mb-3">Tháng (dương lịch) thuận nhất để…</h3>
          <ul className="grid gap-1.5 text-sm">
            {bestMonthFor.map(({ a, m, score }) => (
              <li key={a.key} className="flex justify-between"><span>{a.label}</span><span><b>Tháng {m}</b> <span className="tv-muted text-xs">({score})</span></span></li>
            ))}
          </ul>
          <h3 className="tv-title mt-5 mb-3">Sáu lĩnh vực cả năm</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {domainYear.map(({ dm, v }) => (
              <div key={dm.key} className={`rounded-lg p-2 text-center tone-${scoreLabel(v).tone}`}>
                <div className="text-xs">{dm.icon} {dm.label}</div>
                <div className="font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DayList title="🌟 10 ngày vàng của năm" list={sorted.slice(0, 10)} onPick={onPickDay} />
        <DayList title="⚠️ 5 ngày cần tránh việc lớn" list={sorted.slice(-5).reverse()} onPick={onPickDay} />
      </div>
    </div>
  );
}

function DayList({ title, list, onPick }: { title: string; list: DayScore[]; onPick: (m: number, key: string) => void }) {
  return (
    <div className="tv-card">
      <h3 className="tv-title mb-3">{title}</h3>
      <ul className="grid gap-1.5">
        {list.map(d => (
          <li key={d.info.key}>
            <button className="w-full flex justify-between items-center text-sm gap-2" onClick={() => onPick(d.info.m, d.info.key)}>
              <span className="text-left">{WEEKDAYS_VI[d.info.weekday]} {d.info.d}/{d.info.m} <span className="tv-muted">· ÂL {d.info.lunar.day}/{d.info.lunar.month} · {d.info.canChiNgay}</span></span>
              <ScorePill score={d.score} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LichPage() {
  return (
    <Shell>
      <RequireProfile title="Lịch vận hạn cá nhân">
        {ctx => <LichView key={ctx.profile.id} {...ctx} />}
      </RequireProfile>
    </Shell>
  );
}
