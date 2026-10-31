/**
 * Tổng quan tháng (dương lịch) và năm: gom điểm từng ngày thành điểm cung,
 * lĩnh vực, chuỗi điểm theo thời gian, kèm các yếu tố nền (Tứ Hóa tháng/năm,
 * Thái Tuế, đại hạn) giải thích vì sao.
 */
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { vi, canChi, yearCanChi } from '@/lib/ziwei/vi';
import { scoreMonth, type ChartIndex, type DayScore } from './vanhan';
import { palaceDay, natalFactor, PALACE_TIPS, HOA_EFFECT, type Factor, type PalaceDay } from './cung-ngay';
import { DOMAIN_DEFS, verdictOf } from './phan-tich';
import { jobTrend, jobTrendYear, type JobTrend } from './cong-viec';
import { WEEKDAYS_VI, lunarLabel } from './ngay';

export interface PalacePeriod {
  key: string;
  branch: number;
  name: string;
  canChi: string;
  stars: string;
  score: number;
  factors: Factor[];
  advice: string;
  /** Mốc tốt nhất / kém nhất của cung trong kỳ (ngày hoặc tháng) */
  best: { label: string; score: number }[];
  worst: { label: string; score: number }[];
  /** Chuỗi điểm của cung theo ngày (tháng) hoặc theo tháng (năm) */
  series: number[];
}

export interface DomainPeriod {
  key: string;
  icon: string;
  label: string;
  score: number;
  verdict: string;
  mainKey: string;
  note: string;
}

export interface PeriodOverview {
  scope: 'thang' | 'nam';
  title: string;
  subtitle: string;
  score: number;
  theme: string;
  highlights: { kind: 'co-hoi' | 'luu-y' | 'nen-lam'; title: string; text: string }[];
  domains: DomainPeriod[];
  palaces: PalacePeriod[];
  series: { label: string; score: number; key: string }[];
  bestDays: { label: string; key: string; score: number }[];
  worstDays: { label: string; key: string; score: number }[];
  jobs: JobTrend[];
}

const HOA = ['Lộc', 'Quyền', 'Khoa', 'Kỵ'];
const HOA_W = [12, 8, 6, -14];
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function dayLabel(ds: DayScore) {
  return `${WEEKDAYS_VI[ds.info.weekday]} ${ds.info.d}/${ds.info.m} (ÂL ${lunarLabel(ds.info.lunar)})`;
}

/** Yếu tố nền của kỳ: Tứ Hóa theo các can (tháng/năm), Thái Tuế, cung tháng, đại hạn. */
function periodFactors(
  idx: ChartIndex,
  branch: number,
  hoaSources: { stem: number; label: string; weight: number }[],
  marks: { branch: number; text: string }[],
): Factor[] {
  const out: Factor[] = [];
  for (const src of hoaSources) {
    SI_HUA_TABLE[src.stem].forEach((star, i) => {
      if (idx.starBranch[star] === branch) {
        out.push({ text: `Hóa ${HOA[i]} của ${src.label} (${vi(star)}): ${HOA_EFFECT[i]}`, pts: HOA_W[i] * src.weight });
      }
    });
  }
  for (const mk of marks) if (mk.branch === branch) out.push({ text: mk.text, pts: 0 });
  const natal = natalFactor(idx, branch);
  if (natal) out.push(natal);
  const SHA = ['擎羊', '陀罗', '地空', '地劫', '火星', '铃星'];
  const sha = idx.byBranch[branch]?.stars.filter(st => SHA.includes(st.name)).map(st => vi(st.name)) ?? [];
  if (sha.length) out.push({ text: `Có sát tinh ${sha.join(', ')}: dễ va chạm, nóng vội`, pts: -0.1 });
  return out.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
}

function adviceFor(key: string, score: number) {
  const tip = PALACE_TIPS[key] ?? ['', '', ''];
  return score >= 60 ? tip[0] : score >= 45 ? tip[1] : tip[2];
}

function buildDomains(palaces: PalacePeriod[], scopeWord: string): DomainPeriod[] {
  const byKey = Object.fromEntries(palaces.map(p => [p.key, p]));
  return DOMAIN_DEFS.map(def => {
    const ps = def.palaces.map(k => byKey[k]).filter(Boolean);
    const score = Math.round(ps.reduce((a, p, i) => a + p.score * (i === 0 ? 2 : 1), 0) / (ps.length + 1));
    const main = ps[0];
    // Ưu tiên tác động riêng của kỳ (Tứ Hóa, Thái Tuế…) hơn nền sao gốc
    const top = main.factors.find(f => f.pts !== 0 && !f.text.startsWith('Nền sao'))
      ?? main.factors.find(f => !f.text.startsWith('Nền sao')) ?? main.factors[0];
    const note = top ? top.text.replace(': ', ' → ') : `Không có tác động lớn trong ${scopeWord}.`;
    return { key: def.key, icon: def.icon, label: def.label, score, verdict: verdictOf(score), mainKey: main.key, note };
  });
}

function themeOf(score: number, domains: DomainPeriod[], scopeWord: string) {
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const mood = score >= 62 ? `${scopeWord[0].toUpperCase()}${scopeWord.slice(1)} thuận, nên chủ động mở rộng`
    : score >= 54 ? `${scopeWord[0].toUpperCase()}${scopeWord.slice(1)} khá, tiến từng bước chắc`
    : score >= 46 ? `${scopeWord[0].toUpperCase()}${scopeWord.slice(1)} bình ổn, giữ nhịp đều`
    : `${scopeWord[0].toUpperCase()}${scopeWord.slice(1)} nhiều thử thách, ưu tiên phòng thủ`;
  const short = (k: string) => DOMAIN_DEFS.find(d => d.key === k)?.short ?? k;
  return `${mood}. Mạnh về ${short(sorted[0].key)} và ${short(sorted[1].key)}; cần để ý ${short(sorted[sorted.length - 1].key)}.`;
}

function highlightsOf(domains: DomainPeriod[], best: { label: string }[], scopeWord: string): PeriodOverview['highlights'] {
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  return [
    { kind: 'co-hoi', title: `Điểm sáng: ${hi.label}`, text: `${hi.note}. Nên tận dụng trong ${scopeWord} này.` },
    { kind: 'luu-y', title: `Cần để ý: ${lo.label}`, text: `${lo.note}. Giữ nhịp chậm, chuẩn bị kỹ trước khi quyết định.` },
    { kind: 'nen-lam', title: 'Mốc nên chọn', text: `Dành việc quan trọng cho: ${best.slice(0, 3).map(b => b.label).join('; ')}.` },
  ];
}

interface MonthCore {
  days: DayScore[];
  pdays: PalaceDay[][];
}

function monthCore(idx: ChartIndex, y: number, m: number): MonthCore {
  const days = scoreMonth(idx, y, m);
  return { days, pdays: days.map(ds => palaceDay(idx, ds)) };
}

export function monthOverview(idx: ChartIndex, y: number, m: number, core = monthCore(idx, y, m)): PeriodOverview {
  const { days, pdays } = core;

  // Các tháng âm có trong tháng dương này
  const lunarMonths: { year: number; month: number; stem: number; branch: number }[] = [];
  for (const ds of days) {
    const l = ds.info.lunar;
    if (!lunarMonths.some(x => x.year === l.year && x.month === l.month)) {
      lunarMonths.push({ year: l.year, month: l.month, stem: ds.info.monthStem, branch: ds.info.monthBranch });
    }
  }
  const yearStem = days[15].info.yearStem;
  const yearBranch = days[15].info.yearBranch;

  const hoaSources = [
    ...lunarMonths.map(lm => ({ stem: lm.stem, label: `tháng ${lm.month} âm`, weight: 0.6 / lunarMonths.length })),
    { stem: yearStem, label: `năm ${canChi(yearStem, yearBranch)}`, weight: 0.4 },
  ];
  const marks = [
    ...lunarMonths.map(lm => ({ branch: lm.branch, text: `Là cung của tháng ${lm.month} âm: chuyện của cung này nổi lên trong tháng` })),
    { branch: yearBranch, text: 'Là cung Thái Tuế của năm: chủ đề lớn của cả năm' },
  ];

  const palaces: PalacePeriod[] = pdays[0].map((p0, i) => {
    const scores = pdays.map(pd => pd[i].score);
    const score = avg(scores);
    const ranked = days.map((ds, j) => ({ label: dayLabel(ds), score: scores[j] })).sort((a, b) => b.score - a.score);
    return {
      key: p0.key, branch: p0.branch, name: p0.name, canChi: p0.canChi, stars: p0.stars, score,
      factors: periodFactors(idx, p0.branch, hoaSources, marks),
      advice: adviceFor(p0.key, score),
      best: ranked.slice(0, 3), worst: ranked.slice(-2).reverse(),
      series: scores,
    };
  });

  const score = avg(days.map(d => d.score));
  const domains = buildDomains(palaces, 'tháng');
  const sorted = [...days].sort((a, b) => b.score - a.score);
  const bestDays = sorted.slice(0, 5).map(d => ({ label: dayLabel(d), key: d.info.key, score: d.score }));
  const worstDays = sorted.slice(-3).reverse().map(d => ({ label: dayLabel(d), key: d.info.key, score: d.score }));

  return {
    scope: 'thang',
    title: `Tháng ${m}/${y}`,
    subtitle: `Gồm ${lunarMonths.map(lm => `tháng ${lm.month} âm`).join(' và ')} · Năm ${yearCanChi(lunarMonths[0].year)}`,
    score,
    theme: themeOf(score, domains, 'tháng'),
    highlights: highlightsOf(domains, bestDays, 'tháng'),
    domains,
    palaces,
    series: days.map(d => ({ label: `${d.info.d}`, score: d.score, key: d.info.key })),
    bestDays, worstDays,
    jobs: lunarMonths.map(lm => jobTrend(idx, lm.year, lm.month)),
  };
}

export function yearOverview(idx: ChartIndex, y: number): PeriodOverview & { months: PeriodOverview[] } {
  const months = Array.from({ length: 12 }, (_, i) => monthOverview(idx, y, i + 1));

  const yearStem = ((y - 4) % 10 + 10) % 10;
  const yearBranch = ((y - 4) % 12 + 12) % 12;
  const chart = idx.chart;
  const lunarBirthYear = chart.lunarInfo.lunarYear;
  const age = y - lunarBirthYear + 1;
  const daiHan = chart.daXians.find(d => age >= d.startAge && age <= d.endAge);

  const hoaSources = [{ stem: yearStem, label: `năm ${canChi(yearStem, yearBranch)}`, weight: 1 }];
  const marks = [
    { branch: yearBranch, text: 'Là cung Thái Tuế: chủ đề lớn, dễ có chuyển động trong năm' },
    ...(daiHan ? [{ branch: daiHan.palaceBranch, text: `Là cung đại hạn ${daiHan.startAge}–${daiHan.endAge} tuổi: nền vận của cả 10 năm` }] : []),
  ];

  const palaces: PalacePeriod[] = months[0].palaces.map((p0, i) => {
    const series = months.map(mo => mo.palaces[i].score);
    const score = avg(series);
    const ranked = series.map((s, j) => ({ label: `Tháng ${j + 1}`, score: s })).sort((a, b) => b.score - a.score);
    return {
      ...p0, score, series,
      factors: periodFactors(idx, p0.branch, hoaSources, marks),
      advice: adviceFor(p0.key, score),
      best: ranked.slice(0, 3), worst: ranked.slice(-2).reverse(),
    };
  });

  const score = avg(months.map(mo => mo.score));
  const domains = buildDomains(palaces, 'năm');
  const allDays = months.flatMap(mo => mo.bestDays);
  const bestDays = [...allDays].sort((a, b) => b.score - a.score).slice(0, 10);
  const worstDays = months.flatMap(mo => mo.worstDays).sort((a, b) => a.score - b.score).slice(0, 5);
  const bestMonths = months.map((mo, i) => ({ label: `tháng ${i + 1}`, score: mo.score })).sort((a, b) => b.score - a.score);

  return {
    scope: 'nam',
    title: `Năm ${y} · ${yearCanChi(y)}`,
    subtitle: `Tuổi mụ ${age}${daiHan ? ` · Đại hạn ${daiHan.startAge}–${daiHan.endAge} tại cung ${vi(daiHan.palaceName)}` : ''}`,
    score,
    theme: themeOf(score, domains, 'năm'),
    highlights: highlightsOf(domains, bestMonths, 'năm'),
    domains,
    palaces,
    series: months.map((mo, i) => ({ label: `T${i + 1}`, score: mo.score, key: String(i + 1) })),
    bestDays, worstDays,
    jobs: jobTrendYear(idx, y),
    months,
  };
}
