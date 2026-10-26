'use client';
import { useEffect, useRef, useState } from 'react';
import type { DayScore } from '@/lib/lich/vanhan';
import { DOMAINS, scoreLabel } from '@/lib/lich/vanhan';
import { WEEKDAYS_VI, lunarLabel } from '@/lib/lich/ngay';
import { BRANCHES_VI } from '@/lib/ziwei/vi';
import { JOURNAL_TAGS, type JournalEntry, type Outcome } from '@/lib/journal';

export function ScorePill({ score, big }: { score: number; big?: boolean }) {
  const l = scoreLabel(score);
  return (
    <span className={`tone-${l.tone} rounded-full font-semibold inline-flex items-center gap-1 ${big ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}>
      {score} · {l.text}
    </span>
  );
}

function Bar({ value }: { value: number }) {
  const l = scoreLabel(value);
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--bg-2)' }}>
      <div className={`h-full rounded-full tone-${l.tone}`} style={{ width: `${value}%`, background: 'currentColor' }} />
    </div>
  );
}

interface Props {
  ds: DayScore;
  title?: string;
  entry?: JournalEntry;
  onSaveEntry?: (e: JournalEntry | null) => void;
  shareName?: string;
}

export default function DayDetail({ ds, title, entry, onSaveEntry, shareName }: Props) {
  const { info } = ds;
  const ref = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState(entry?.note ?? '');
  const [outcome, setOutcome] = useState<Outcome>(entry?.outcome ?? 'neutral');
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setNote(entry?.note ?? '');
    setOutcome(entry?.outcome ?? 'neutral');
    setTags(entry?.tags ?? []);
    setSaved(false);
  }, [entry, info.key]);

  const share = async () => {
    if (!ref.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const bg = getComputedStyle(document.body).backgroundColor;
      const canvas = await html2canvas(ref.current, { backgroundColor: bg, scale: 2 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `TuVi_${info.d}-${info.m}-${info.y}.png`;
      a.click();
    } finally {
      setSharing(false);
    }
  };

  const best = [...DOMAINS].sort((a, b) => ds.domains[b.key] - ds.domains[a.key]);

  return (
    <div className="tv-card grid gap-4">
      <div ref={ref} className="grid gap-4" style={{ padding: 2 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <div className="text-xs uppercase tracking-wider tv-accent font-semibold mb-1">{title}</div>}
            <div className="tv-title text-xl">{WEEKDAYS_VI[info.weekday]}, {info.d}/{info.m}/{info.y}</div>
            <div className="text-sm tv-muted">
              Âm lịch {lunarLabel(info.lunar)} · Ngày {info.canChiNgay} · Tháng {info.canChiThang} · Năm {info.canChiNam}
              {info.tietKhi ? ` · Tiết ${info.tietKhi}` : ''}
            </div>
            {shareName && <div className="text-xs tv-muted mt-0.5">Theo lá số: {shareName}</div>}
          </div>
          <ScorePill score={ds.score} big />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-1 rounded-full ${info.truc.quality === 'tot' ? 'tone-good' : info.truc.quality === 'xau' ? 'tone-worst' : 'tone-mid'}`}>Trực {info.truc.name}</span>
          <span className={`px-2 py-1 rounded-full ${info.than.hoangDao ? 'tone-good' : 'tone-worst'}`}>{info.than.name} · {info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'}</span>
          <span className={`px-2 py-1 rounded-full ${info.sao28.tot ? 'tone-good' : 'tone-bad'}`}>Sao {info.sao28.name} ({info.sao28.tot ? 'tốt' : 'xấu'})</span>
          <span className="px-2 py-1 rounded-full tone-mid">Xung tuổi {BRANCHES_VI[info.xungBranch]}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {DOMAINS.map(dm => (
            <div key={dm.key} className="grid grid-cols-[140px_1fr_28px] items-center gap-2 text-sm">
              <span>{dm.icon} {dm.label}</span>
              <Bar value={ds.domains[dm.key]} />
              <span className="text-right tv-muted text-xs">{ds.domains[dm.key]}</span>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--great)' }}>Nên làm</div>
            <ul className="list-disc ml-5 grid gap-0.5">{info.truc.nen.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--worst)' }}>Nên tránh</div>
            <ul className="list-disc ml-5 grid gap-0.5">{info.truc.kieng.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-semibold">Giờ hoàng đạo: </span>
          <span className="tv-muted">{info.gioHoangDao.map(g => `${g.name} (${g.range})`).join(', ')}</span>
        </div>

        <div className="text-sm grid gap-1">
          <div>
            <span className="font-semibold">Cung ứng ngày:</span> {ds.palaceName} — {ds.palaceStars}.
            {' '}Mạnh nhất hôm nay: <b>{best[0].label}</b>; cần để ý: <b>{best[best.length - 1].label}</b>.
          </div>
          {ds.notes.map(n => <div key={n} className="tv-muted">• {n}</div>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <button className="tv-btn" onClick={share} disabled={sharing}>{sharing ? 'Đang tạo ảnh…' : '📤 Tải ảnh chia sẻ'}</button>
      </div>

      {onSaveEntry && (
        <div className="border-t pt-4 grid gap-2 no-print" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-semibold text-sm">📝 Nhật ký ngày này</div>
          <textarea className="tv-input min-h-[80px]" value={note} onChange={e => { setNote(e.target.value); setSaved(false); }}
            placeholder="Hôm nay đã diễn ra thế nào? Việc gì thuận, việc gì vướng?" maxLength={2000} />
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm tv-muted">Thực tế:</span>
            {([['good', 'Tốt'], ['neutral', 'Bình thường'], ['bad', 'Không tốt']] as const).map(([k, t]) => (
              <button key={k} type="button" className="tv-chip" data-on={outcome === k} onClick={() => { setOutcome(k); setSaved(false); }}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {JOURNAL_TAGS.map(t => (
              <button key={t} type="button" className="tv-chip !text-xs" data-on={tags.includes(t)}
                onClick={() => { setTags(x => x.includes(t) ? x.filter(y => y !== t) : [...x, t]); setSaved(false); }}>{t}</button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <button className="tv-btn tv-btn-primary" onClick={() => { onSaveEntry({ note, outcome, tags, forecast: ds.score, updatedAt: Date.now() }); setSaved(true); }}>Lưu nhật ký</button>
            {entry && <button className="tv-btn" onClick={() => onSaveEntry(null)}>Xóa</button>}
            {saved && <span className="text-sm" style={{ color: 'var(--great)' }}>Đã lưu ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
