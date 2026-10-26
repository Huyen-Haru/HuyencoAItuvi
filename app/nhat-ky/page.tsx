'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import { ScorePill } from '@/components/tuvi/DayDetail';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { Profile } from '@/lib/profiles';
import { useJournal, type Outcome } from '@/lib/journal';
import { indexChart, scoreDay } from '@/lib/lich/vanhan';

const OUTCOME: Record<Outcome, { text: string; tone: string }> = {
  good: { text: 'Tốt', tone: 'tone-good' },
  neutral: { text: 'Bình thường', tone: 'tone-mid' },
  bad: { text: 'Không tốt', tone: 'tone-worst' },
};

function NhatKyView({ profile, chart }: { profile: Profile; chart: ZiweiChart }) {
  const { journal } = useJournal(profile.id);
  const idx = useMemo(() => indexChart(chart), [chart]);

  const rows = useMemo(() => Object.entries(journal)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, e]) => {
      const [y, m, d] = key.split('-').map(Number);
      return { key, e, forecast: e.forecast ?? scoreDay(idx, y, m, d).score };
    }), [journal, idx]);

  // Dự báo "tốt" khi ≥ 60, "xấu" khi < 45; đối chiếu với kết quả người dùng ghi
  const judged = rows.filter(r => r.e.outcome !== 'neutral' && (r.forecast >= 60 || r.forecast < 45));
  const hits = judged.filter(r => (r.forecast >= 60) === (r.e.outcome === 'good')).length;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ profile: profile.name, journal }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nhat-ky-${profile.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="tv-title text-2xl">Nhật ký của {profile.name}</h1>
          <p className="tv-muted text-sm">Ghi lại điều thực sự xảy ra mỗi ngày để đối chiếu với dự báo. Ghi chú mới từ mục <Link className="tv-accent" href="/lich">Lịch vận hạn</Link>.</p>
        </div>
        <button className="tv-btn" onClick={exportJson} disabled={!rows.length}>Xuất nhật ký</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="tv-card text-center"><div className="text-sm tv-muted">Số ngày đã ghi</div><div className="text-3xl font-bold">{rows.length}</div></div>
        <div className="tv-card text-center"><div className="text-sm tv-muted">Ngày có thể đối chiếu</div><div className="text-3xl font-bold">{judged.length}</div></div>
        <div className="tv-card text-center">
          <div className="text-sm tv-muted">Dự báo khớp thực tế</div>
          <div className="text-3xl font-bold tv-accent">{judged.length ? `${Math.round((hits / judged.length) * 100)}%` : '—'}</div>
        </div>
      </div>

      {!rows.length && <div className="tv-card tv-muted">Chưa có ghi chú nào. Mở Lịch vận hạn, chọn một ngày và bấm “Lưu nhật ký”.</div>}

      <ul className="grid gap-3">
        {rows.map(({ key, e, forecast }) => {
          const [y, m, d] = key.split('-');
          return (
            <li key={key} className="tv-card grid gap-2">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="font-semibold">{d}/{m}/{y}</div>
                <div className="flex gap-2 items-center text-xs">
                  <span className="tv-muted">Dự báo</span><ScorePill score={forecast} />
                  <span className="tv-muted">Thực tế</span><span className={`px-2 py-0.5 rounded-full font-semibold ${OUTCOME[e.outcome].tone}`}>{OUTCOME[e.outcome].text}</span>
                </div>
              </div>
              {e.note && <p className="text-sm whitespace-pre-wrap">{e.note}</p>}
              {e.tags.length > 0 && <div className="flex flex-wrap gap-1">{e.tags.map(t => <span key={t} className="tv-chip !text-xs !cursor-default">{t}</span>)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function NhatKyPage() {
  return (
    <Shell>
      <RequireProfile title="Nhật ký vận hạn">
        {ctx => <NhatKyView key={ctx.profile.id} {...ctx} />}
      </RequireProfile>
    </Shell>
  );
}
