/**
 * Chấm điểm vận khí từng ngày theo lá số riêng.
 *
 * Cách tính (tham khảo, minh bạch để người dùng hiểu):
 *  1. Cung ứng ngày: cung bản mệnh nằm ở địa chi của ngày (lưu nhật thái tuế).
 *     Chất lượng cung = độ sáng chính tinh + cát tinh − sát tinh + Tứ Hóa gốc.
 *  2. Tứ Hóa theo can ngày rơi vào cung nào của lá số → cộng/trừ cho lĩnh vực đó.
 *  3. Lịch vạn niên: 12 Trực, Hoàng/Hắc đạo, Nhị thập bát tú.
 *  4. Quan hệ chi ngày với chi tuổi: xung, lục hợp, tam hợp.
 *  5. Nền tháng: chất lượng cung ứng tháng âm (lưu nguyệt theo chi tháng).
 */
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { getDayInfo, daysInMonth, type DayInfo } from './ngay';
import { vi } from '@/lib/ziwei/vi';

export type DomainKey = 'suNghiep' | 'taiLoc' | 'tinhCam' | 'sucKhoe' | 'giaDao' | 'diLai';

export const DOMAINS: { key: DomainKey; label: string; icon: string; palaces: string[] }[] = [
  { key: 'suNghiep', label: 'Sự nghiệp', icon: '💼', palaces: ['官禄'] },
  { key: 'taiLoc', label: 'Tài lộc', icon: '💰', palaces: ['财帛'] },
  { key: 'tinhCam', label: 'Tình cảm', icon: '❤️', palaces: ['夫妻'] },
  { key: 'sucKhoe', label: 'Sức khỏe', icon: '🌿', palaces: ['疾厄'] },
  { key: 'giaDao', label: 'Gia đạo', icon: '🏠', palaces: ['田宅', '子女'] },
  { key: 'diLai', label: 'Đi lại · Giao tế', icon: '🧭', palaces: ['迁移', '仆役'] },
];

export interface Activity {
  key: string;
  label: string;
  domains: DomainKey[];
  trucTot: string[];
}

export const ACTIVITIES: Activity[] = [
  { key: 'ky-hop-dong', label: 'Ký hợp đồng', domains: ['suNghiep', 'taiLoc'], trucTot: ['Định', 'Thành', 'Khai', 'Mãn'] },
  { key: 'khai-truong', label: 'Khai trương', domains: ['taiLoc', 'suNghiep'], trucTot: ['Khai', 'Thành', 'Mãn', 'Kiến'] },
  { key: 'gap-doi-tac', label: 'Gặp đối tác', domains: ['suNghiep', 'diLai'], trucTot: ['Kiến', 'Định', 'Thành', 'Khai'] },
  { key: 'xuat-hanh', label: 'Xuất hành, đi xa', domains: ['diLai', 'sucKhoe'], trucTot: ['Kiến', 'Định', 'Thành', 'Khai'] },
  { key: 'cuoi-hoi', label: 'Cưới hỏi', domains: ['tinhCam', 'giaDao'], trucTot: ['Định', 'Thành', 'Khai'] },
  { key: 'thu-no', label: 'Thu nợ, đòi tiền', domains: ['taiLoc'], trucTot: ['Thu', 'Mãn'] },
  { key: 'kham-benh', label: 'Khám chữa bệnh', domains: ['sucKhoe'], trucTot: ['Trừ', 'Phá', 'Thành'] },
  { key: 'sua-nha', label: 'Động thổ, sửa nhà', domains: ['giaDao'], trucTot: ['Khai', 'Thành', 'Chấp', 'Định'] },
  { key: 'ra-quyet-dinh', label: 'Ra quyết định lớn', domains: ['suNghiep', 'taiLoc', 'sucKhoe'], trucTot: ['Định', 'Thành', 'Khai', 'Kiến'] },
];

export interface DayScore {
  info: DayInfo;
  score: number;                         // 0–100
  domains: Record<DomainKey, number>;    // 0–100
  palaceName: string;                    // cung ứng ngày (tiếng Việt)
  palaceStars: string;                   // chính tinh của cung ứng ngày
  hoa: { type: 'Lộc' | 'Quyền' | 'Khoa' | 'Kỵ'; star: string; palace: string }[];
  notes: string[];                       // giải thích ngắn
  xungTuoi: boolean;
}

const clamp = (n: number, lo = 4, hi = 96) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Chất lượng một cung, khoảng −1..1 */
function palaceQuality(p: Palace | undefined): number {
  if (!p) return 0;
  let s = 0;
  for (const star of p.stars) {
    if (star.type === 'major') s += star.brightness === 'bright' ? 2 : star.brightness === 'dim' ? -1 : 0.8;
    else if (star.type === 'lucky') s += 0.6;
    else if (star.type === 'sha') s -= 0.9;
    if (star.siHua === '禄') s += 1.5;
    if (star.siHua === '权') s += 1;
    if (star.siHua === '科') s += 0.8;
    if (star.siHua === '忌') s -= 1.8;
  }
  if (p.isEmpty) s -= 0.5;
  return Math.max(-1, Math.min(1, s / 5));
}

const HOA_LABEL = ['Lộc', 'Quyền', 'Khoa', 'Kỵ'] as const;
const HOA_WEIGHT = [12, 8, 6, -14];

function trineOf(branch: number): number[] {
  return [branch, (branch + 4) % 12, (branch + 8) % 12, (branch + 6) % 12];
}

export interface ChartIndex {
  chart: ZiweiChart;
  byBranch: Record<number, Palace>;
  byName: Record<string, Palace>;
  starBranch: Record<string, number>;
  quality: Record<number, number>;
  birthBranch: number;
}

export function indexChart(chart: ZiweiChart): ChartIndex {
  const byBranch: Record<number, Palace> = {};
  const byName: Record<string, Palace> = {};
  const starBranch: Record<string, number> = {};
  const quality: Record<number, number> = {};
  for (const p of chart.palaces) {
    byBranch[p.branch] = p;
    byName[p.name.replace(/宫$/, '')] = p;
    if (p.name === '命宫') byName['命'] = p;
    for (const s of p.stars) if (!(s.name in starBranch)) starBranch[s.name] = p.branch;
    quality[p.branch] = palaceQuality(p);
  }
  return { chart, byBranch, byName, starBranch, quality, birthBranch: chart.lunarInfo.yearBranch };
}

function majorNames(p: Palace | undefined): string {
  if (!p) return '';
  const names = p.stars.filter(s => s.type === 'major').map(s => vi(s.name));
  if (names.length) return names.join(', ');
  return p.borrowedStars?.length ? `Vô chính diệu (mượn ${p.borrowedStars.map(vi).join(', ')})` : 'Vô chính diệu';
}

export function scoreDay(idx: ChartIndex, y: number, m: number, d: number): DayScore {
  const info = getDayInfo(y, m, d);
  const notes: string[] = [];
  const dayPalace = idx.byBranch[info.dayBranch];
  const q = idx.quality[info.dayBranch] ?? 0;
  const trine = trineOf(info.dayBranch);

  // Lịch vạn niên
  const trucPts = info.truc.quality === 'tot' ? 6 : info.truc.quality === 'xau' ? -7 : 0;
  const thanPts = info.than.hoangDao ? 5 : -5;
  const xiuPts = info.sao28.tot ? 3 : -3;

  // Quan hệ tuổi
  const b = idx.birthBranch;
  const xungTuoi = info.xungBranch === b;
  let tuoiPts = 0;
  if (xungTuoi) { tuoiPts = -10; notes.push(`Ngày ${info.canChiNgay} xung tuổi, nên thận trọng việc lớn.`); }
  else if ((info.dayBranch + b) % 12 === 1) { tuoiPts = 5; notes.push('Ngày lục hợp với tuổi, dễ được trợ giúp.'); }
  else if (info.dayBranch !== b && (info.dayBranch - b + 12) % 4 === 0) { tuoiPts = 4; notes.push('Ngày tam hợp với tuổi, thuận hòa.'); }

  // Tứ Hóa theo can ngày
  const hoaStars = SI_HUA_TABLE[info.dayStem];
  const hoa: DayScore['hoa'] = [];
  let hoaPts = 0;
  const domainHoa: Record<DomainKey, number> = { suNghiep: 0, taiLoc: 0, tinhCam: 0, sucKhoe: 0, giaDao: 0, diLai: 0 };
  hoaStars.forEach((star, i) => {
    const br = idx.starBranch[star];
    if (br === undefined) return;
    const p = idx.byBranch[br];
    hoa.push({ type: HOA_LABEL[i], star: vi(star), palace: vi(p.name) });
    if (trine.includes(br)) hoaPts += HOA_WEIGHT[i] * 0.5;
    if (p.name === '命宫') hoaPts += HOA_WEIGHT[i] * 0.4;
    for (const dm of DOMAINS) {
      if (dm.palaces.some(n => idx.byName[n]?.branch === br)) domainHoa[dm.key] += HOA_WEIGHT[i];
    }
  });

  // Nền tháng: cung ở chi của tháng âm
  const monthPts = (idx.quality[info.monthBranch] ?? 0) * 8;

  const base = 50 + q * 14 + monthPts + trucPts + thanPts + xiuPts + tuoiPts + hoaPts;
  const score = clamp(base);

  const domains = {} as Record<DomainKey, number>;
  for (const dm of DOMAINS) {
    const ps = dm.palaces.map(n => idx.byName[n]).filter(Boolean) as Palace[];
    const dq = ps.reduce((a, p) => a + idx.quality[p.branch], 0) / Math.max(1, ps.length);
    const inTrine = ps.some(p => trine.includes(p.branch)) ? q * 10 : 0;
    domains[dm.key] = clamp(50 + dq * 10 + monthPts * 0.6 + inTrine + domainHoa[dm.key] + (trucPts + thanPts) * 0.6 + tuoiPts * 0.5);
  }

  const kyHoa = hoa.find(h => h.type === 'Kỵ');
  const locHoa = hoa.find(h => h.type === 'Lộc');
  if (locHoa) notes.push(`Hóa Lộc (${locHoa.star}) vào cung ${locHoa.palace}: thuận lợi việc liên quan cung này.`);
  if (kyHoa) notes.push(`Hóa Kỵ (${kyHoa.star}) vào cung ${kyHoa.palace}: dễ vướng mắc, nên cẩn trọng.`);

  return {
    info, score, domains,
    palaceName: dayPalace ? vi(dayPalace.name) : '',
    palaceStars: majorNames(dayPalace),
    hoa, notes, xungTuoi,
  };
}

export function scoreMonth(idx: ChartIndex, y: number, m: number): DayScore[] {
  const n = daysInMonth(y, m);
  return Array.from({ length: n }, (_, i) => scoreDay(idx, y, m, i + 1));
}

export function scoreYear(idx: ChartIndex, y: number): DayScore[] {
  const out: DayScore[] = [];
  for (let m = 1; m <= 12; m++) out.push(...scoreMonth(idx, y, m));
  return out;
}

export function activityScore(ds: DayScore, act: Activity): number {
  const avg = act.domains.reduce((a, k) => a + ds.domains[k], 0) / act.domains.length;
  const trucBonus = act.trucTot.includes(ds.info.truc.name) ? 8 : ds.info.truc.quality === 'xau' ? -10 : 0;
  return clamp(avg + trucBonus + (ds.info.than.hoangDao ? 4 : -4) + (ds.xungTuoi ? -8 : 0));
}

export function scoreLabel(score: number): { text: string; tone: 'great' | 'good' | 'mid' | 'bad' | 'worst' } {
  if (score >= 72) return { text: 'Rất tốt', tone: 'great' };
  if (score >= 60) return { text: 'Tốt', tone: 'good' };
  if (score >= 45) return { text: 'Bình hòa', tone: 'mid' };
  if (score >= 33) return { text: 'Kém', tone: 'bad' };
  return { text: 'Xấu', tone: 'worst' };
}
