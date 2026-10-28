/**
 * Xu hướng thay đổi công việc theo tháng âm: chủ động hay bị động.
 *
 * Quy tắc (tham khảo):
 *  - Tứ Hóa của năm (trọng số 2) và của tháng âm (trọng số 1) rơi vào nhóm cung
 *    Mệnh – Tài Bạch – Quan Lộc – Thiên Di:
 *      Hóa Lộc / Hóa Quyền vào Quan Lộc, Mệnh, Thiên Di → chủ động (cơ hội, tự muốn đổi)
 *      Hóa Kỵ vào Quan Lộc (mạnh), Mệnh, Thiên Di/Tài Bạch → bị động (áp lực, bị thay đổi)
 *  - Năm/tháng có chi xung cung Quan Lộc → bị động.
 *  - Tháng đi vào cung có Thiên Mã thuộc nhóm cung trên → chủ động (dịch chuyển).
 *  - Nền bản mệnh: Sát Phá Tham ở Quan Lộc dễ đổi việc; sát tinh ở Quan Lộc dễ bị động.
 */
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { vi, canChi } from '@/lib/ziwei/vi';
import type { ChartIndex } from './vanhan';

export interface JobTrend {
  lunarYear: number;
  lunarMonth: number;
  monthCanChi: string;
  chuDong: number;
  biDong: number;
  label: 'Ổn định' | 'Thiên về chủ động' | 'Thiên về bị động' | 'Biến động cả hai chiều';
  reasons: string[];
}

const HOA = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
const SHA = ['擎羊', '陀罗', '地空', '地劫', '火星', '铃星'];

export function jobTrend(idx: ChartIndex, lunarYear: number, lunarMonth: number): JobTrend {
  const quan = idx.byName['官禄'];
  const menh = idx.byName['命'];
  const di = idx.byName['迁移'];
  const tai = idx.byName['财帛'];
  const reasons: string[] = [];
  let cd = 0;
  let bd = 0;

  const yearStem = ((lunarYear - 4) % 10 + 10) % 10;
  const yearBranch = ((lunarYear - 4) % 12 + 12) % 12;
  const monthStem = (yearStem * 2 + lunarMonth + 1) % 10;
  const monthBranch = (lunarMonth + 1) % 12;

  const where = (branch: number) =>
    branch === quan?.branch ? 'quan' : branch === menh?.branch ? 'menh' : branch === di?.branch ? 'di' : branch === tai?.branch ? 'tai' : null;

  const applyHoa = (stem: number, weight: number, scope: string) => {
    SI_HUA_TABLE[stem].forEach((star, i) => {
      const br = idx.starBranch[star];
      if (br === undefined) return;
      const w = where(br);
      if (!w) return;
      const palace = vi(idx.byBranch[br].name);
      if ((i === 0 || i === 1) && w !== 'tai') {
        cd += 2 * weight;
        reasons.push(`${HOA[i]} ${scope} (${vi(star)}) vào ${palace}: có cơ hội, dễ chủ động thay đổi.`);
      } else if (i === 3) {
        const pts = w === 'quan' ? 3 : w === 'menh' ? 2 : 1;
        bd += pts * weight;
        reasons.push(`Hóa Kỵ ${scope} (${vi(star)}) vào ${palace}: áp lực, dễ bị thay đổi ngoài ý muốn.`);
      }
    });
  };
  applyHoa(yearStem, 2, 'năm');
  applyHoa(monthStem, 1, 'tháng');

  if (quan) {
    const xung = (quan.branch + 6) % 12;
    if (yearBranch === xung) { bd += 2; reasons.push('Thái Tuế năm xung cung Quan Lộc: công việc dễ xáo trộn.'); }
    if (monthBranch === xung) { bd += 1; reasons.push('Tháng này xung cung Quan Lộc: dễ có va chạm nơi làm việc.'); }
    if (monthBranch === quan.branch) { cd += 1; bd += 1; reasons.push('Tháng đi vào cung Quan Lộc: chuyện công việc được kích hoạt mạnh.'); }

    const majors = quan.stars.filter(s => s.type === 'major').map(s => s.name);
    if (majors.some(n => ['破军', '七杀', '贪狼'].includes(n))) { cd += 1; reasons.push('Quan Lộc có Sát Phá Tham: bản tính thích đổi mới công việc.'); }
    const sha = quan.stars.filter(s => SHA.includes(s.name)).map(s => vi(s.name));
    if (sha.length) { bd += 1; reasons.push(`Quan Lộc gặp ${sha.join(', ')}: công việc hay gặp trở ngại khách quan.`); }
  }

  const ma = idx.starBranch['天马'];
  if (ma !== undefined && ma === monthBranch && where(ma)) {
    cd += 1;
    reasons.push('Tháng kích hoạt Thiên Mã ở nhóm cung Mệnh – Quan – Di: dễ dịch chuyển, đổi môi trường.');
  }

  const total = cd + bd;
  let label: JobTrend['label'] = 'Ổn định';
  if (total >= 4) {
    if (cd >= bd * 2) label = 'Thiên về chủ động';
    else if (bd >= cd * 2) label = 'Thiên về bị động';
    else label = 'Biến động cả hai chiều';
  }

  return {
    lunarYear, lunarMonth,
    monthCanChi: canChi(monthStem, monthBranch),
    chuDong: cd, biDong: bd, label, reasons,
  };
}

/** 12 tháng âm của năm, đánh dấu tháng then chốt (biến động lớn nhất). */
export function jobTrendYear(idx: ChartIndex, lunarYear: number): JobTrend[] {
  return Array.from({ length: 12 }, (_, i) => jobTrend(idx, lunarYear, i + 1));
}
