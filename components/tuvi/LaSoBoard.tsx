'use client';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { vi, canChi, yearCanChi, BRANCHES_VI, SIHUA_SHORT_VI, BRIGHTNESS_VI } from '@/lib/ziwei/vi';
import { tuanTriet } from '@/lib/ziwei/describe';
import { solarToLunar } from '@/lib/lich/amlich';

/** Vị trí [hàng, cột] của 12 địa chi trên bàn 4×4 (Tỵ góc trên trái). */
const POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

const HOA_COLOR: Record<string, string> = { '禄': 'var(--lu)', '权': 'var(--quan)', '科': 'var(--ke)', '忌': 'var(--ji)' };
const HIDDEN = new Set(['旬空', '截路', '空亡', '旬中', '截空']);

function StarTag({ star, flowHoa }: { star: Star; flowHoa?: string }) {
  const dim = star.brightness === 'dim';
  return (
    <span className="whitespace-nowrap" style={{ opacity: dim ? 0.7 : 1 }}>
      {vi(star.name)}
      {star.brightnessLabel && star.type === 'major' && (
        <sup className="tv-muted ml-[1px] text-[8px]">{BRIGHTNESS_VI[star.brightnessLabel]}</sup>
      )}
      {star.siHua && (
        <span className="ml-0.5 px-[3px] rounded text-[9px] font-bold text-white" style={{ background: HOA_COLOR[star.siHua] }}>
          {SIHUA_SHORT_VI[star.siHua]}
        </span>
      )}
      {flowHoa && (
        <span className="ml-0.5 px-[3px] rounded text-[9px] font-bold border" style={{ color: HOA_COLOR[flowHoa], borderColor: HOA_COLOR[flowHoa] }}>
          L.{SIHUA_SHORT_VI[flowHoa]}
        </span>
      )}
    </span>
  );
}

interface Props {
  chart: ZiweiChart;
  selected: number | null;
  onSelect: (branch: number) => void;
  /** Năm lưu niên để hiển thị Tứ Hóa năm và Thái Tuế; null = chỉ bản mệnh */
  flowYear: number | null;
}

export default function LaSoBoard({ chart, selected, onSelect, flowYear }: Props) {
  const byBranch: Record<number, Palace> = {};
  chart.palaces.forEach(p => { byBranch[p.branch] = p; });

  const flowHoa: Record<string, string> = {};
  let taiTue = -1;
  if (flowYear) {
    const stem = ((flowYear - 4) % 10 + 10) % 10;
    taiTue = ((flowYear - 4) % 12 + 12) % 12;
    const keys = ['禄', '权', '科', '忌'];
    SI_HUA_TABLE[stem].forEach((s, i) => { flowHoa[s] = keys[i]; });
  }

  const related = selected === null ? [] : [selected, (selected + 4) % 12, (selected + 8) % 12, (selected + 6) % 12];
  const b = chart.birthInfo;
  const l = solarToLunar(b.day, b.month, b.year);

  return (
    <div className="laso-grid select-none">
      {Object.entries(POS).map(([brStr, [row, col]]) => {
        const br = Number(brStr);
        const p = byBranch[br];
        if (!p) return null;
        const majors = p.stars.filter(s => s.type === 'major');
        const goods = p.stars.filter(s => s.type === 'lucky' && !HIDDEN.has(s.name));
        const bads = p.stars.filter(s => s.type === 'sha' && !HIDDEN.has(s.name));
        const minors = p.stars.filter(s => s.type === 'minor' && !HIDDEN.has(s.name));
        const tt = tuanTriet(p);
        const isSel = selected === br;
        const isRel = related.includes(br);
        return (
          <button
            type="button"
            key={br}
            onClick={() => onSelect(br)}
            className="text-left rounded-md p-1.5 sm:p-2 min-w-0 overflow-hidden min-h-[118px] sm:min-h-[150px] flex flex-col gap-0.5 text-[10px] sm:text-[11px] leading-tight transition-colors"
            style={{
              gridRow: row, gridColumn: col,
              background: isSel ? 'var(--ac-bg)' : isRel ? 'color-mix(in srgb, var(--ac-bg) 50%, var(--bg-card))' : 'var(--bg-card)',
              border: `1px solid ${isSel ? 'var(--ac)' : isRel ? 'var(--ac-bdr)' : 'var(--bdr-med)'}`,
              color: 'var(--tx-2)',
            }}
          >
            <div className="flex flex-wrap gap-x-1 gap-y-0.5 font-semibold text-[11px] sm:text-[12.5px]" style={{ color: 'var(--tx-0)' }}>
              {majors.length
                ? majors.map(s => <StarTag key={s.name} star={s} flowHoa={flowHoa[s.name]} />)
                : <span className="tv-muted font-normal italic">Vô chính diệu</span>}
            </div>
            <div className="flex flex-wrap gap-x-1" style={{ color: 'var(--great)' }}>
              {goods.map(s => <StarTag key={s.name} star={s} flowHoa={flowHoa[s.name]} />)}
            </div>
            <div className="flex flex-wrap gap-x-1" style={{ color: 'var(--worst)' }}>
              {bads.map(s => <StarTag key={s.name} star={s} />)}
            </div>
            <div className="hidden sm:flex flex-wrap gap-x-1 tv-muted text-[10px]">
              {minors.slice(0, 6).map(s => <span key={s.name}>{vi(s.name)}</span>)}
            </div>
            <div className="mt-auto pt-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold uppercase tracking-wide text-[10px] sm:text-[11px] leading-none" style={{ color: p.isMingGong ? 'var(--ac)' : 'var(--tx-1)' }}>
                  {vi(p.name)}
                </span>
                {p.isShenGong && <span className="px-1 rounded text-[9px] tone-mid">Thân</span>}
                {tt.map(t => <span key={t} className="px-1 rounded text-[9px] font-semibold tone-worst">{t}</span>)}
              </div>
              <div className="flex justify-between gap-1 text-[9.5px] mt-0.5">
                <span className="tv-muted truncate">{canChi(p.stem, p.branch)}<span className="hidden sm:inline">{p.changsheng ? ` · ${vi(p.changsheng)}` : ''}</span></span>
                {p.daXianAge && (
                  <span className="font-semibold whitespace-nowrap" style={{ color: p.isCurrentDaXian ? 'var(--ac)' : 'var(--tx-3)' }}>
                    {p.daXianAge[0]}–{p.daXianAge[1]}
                  </span>
                )}
              </div>
              {br === taiTue && <div className="text-[9px] font-semibold tv-accent">Thái Tuế</div>}
            </div>
          </button>
        );
      })}

      <div className="rounded-md p-3 flex flex-col items-center justify-center text-center gap-1"
        style={{ gridRow: '2 / 4', gridColumn: '2 / 4', border: '1px solid var(--bdr-med)', background: 'var(--bg-1)' }}>
        <div className="text-2xl" aria-hidden>☯</div>
        <div className="tv-title text-sm sm:text-lg">{b.name || 'Lá số Tử Vi'}</div>
        <div className="text-[11px] sm:text-sm tv-muted">{b.gender === 'male' ? 'Nam' : 'Nữ'} · {yearCanChi(l.year)}</div>
        <div className="text-[11px] sm:text-[13px]" style={{ color: 'var(--tx-1)' }}>
          {b.day}/{b.month}/{b.year} DL · {l.day}/{l.month}{l.leap ? 'N' : ''} ÂL
        </div>
        <div className="text-[11px] sm:text-[13px]" style={{ color: 'var(--tx-1)' }}>Giờ {BRANCHES_VI[b.hour]}</div>
        <div className="text-[11px] sm:text-[13px] tv-accent font-semibold">{vi(chart.wuxingJuName)}</div>
        <div className="hidden sm:block text-[12px] tv-muted">
          Mệnh tại {BRANCHES_VI[chart.mingGongBranch]} · Thân tại {BRANCHES_VI[chart.shenGongBranch]}
        </div>
        {flowYear && <div className="text-[11px] sm:text-xs tone-mid px-2 rounded-full">Lưu niên {flowYear} ({yearCanChi(flowYear)})</div>}
      </div>
    </div>
  );
}
