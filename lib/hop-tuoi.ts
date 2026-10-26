/**
 * Xem hợp tuổi theo năm sinh âm lịch (nạp âm, thiên can, địa chi)
 * và đối chiếu lá số (Mệnh người này với Phu Thê người kia).
 */
import type { ZiweiChart } from '@/lib/ziwei/types';
import { STEMS_VI, BRANCHES_VI, vi } from '@/lib/ziwei/vi';
import { solarToLunar } from '@/lib/lich/amlich';

const NAPAM = [
  'Hải Trung Kim', 'Lô Trung Hỏa', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Kiếm Phong Kim', 'Sơn Đầu Hỏa',
  'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Bạch Lạp Kim', 'Dương Liễu Mộc', 'Tuyền Trung Thủy', 'Ốc Thượng Thổ',
  'Tích Lịch Hỏa', 'Tùng Bách Mộc', 'Trường Lưu Thủy', 'Sa Trung Kim', 'Sơn Hạ Hỏa', 'Bình Địa Mộc',
  'Bích Thượng Thổ', 'Kim Bạch Kim', 'Phú Đăng Hỏa', 'Thiên Hà Thủy', 'Đại Trạch Thổ', 'Thoa Xuyến Kim',
  'Tang Đố Mộc', 'Đại Khê Thủy', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thạch Lựu Mộc', 'Đại Hải Thủy',
];
const ELEMENTS = ['Kim', 'Thủy', 'Mộc', 'Hỏa', 'Thổ'];  // thứ tự tương sinh

function element(napam: string): string {
  return ELEMENTS.find(e => napam.endsWith(e)) ?? 'Thổ';
}

export interface YearPillar {
  lunarYear: number;
  stem: number;
  branch: number;
  label: string;
  napam: string;
  element: string;
}

export function yearPillar(y: number, m: number, d: number): YearPillar {
  const ly = solarToLunar(d, m, y).year;
  const stem = ((ly - 4) % 10 + 10) % 10;
  const branch = ((ly - 4) % 12 + 12) % 12;
  const jiazi = ((6 * stem - 5 * branch) % 60 + 60) % 60;
  const napam = NAPAM[Math.floor(jiazi / 2)];
  return { lunarYear: ly, stem, branch, label: `${STEMS_VI[stem]} ${BRANCHES_VI[branch]}`, napam, element: element(napam) };
}

export interface MatchItem {
  label: string;
  detail: string;
  points: number;   // −2..+2
}

export function elementRelation(a: string, b: string): { points: number; text: string } {
  if (a === b) return { points: 1, text: `Cùng hành ${a}: bình hòa, dễ đồng cảm.` };
  const ia = ELEMENTS.indexOf(a), ib = ELEMENTS.indexOf(b);
  if ((ia + 1) % 5 === ib) return { points: 2, text: `${a} sinh ${b}: tương sinh, người trước nâng đỡ người sau.` };
  if ((ib + 1) % 5 === ia) return { points: 2, text: `${b} sinh ${a}: tương sinh, người sau nâng đỡ người trước.` };
  // khắc: Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim
  if ((ia + 2) % 5 === ib) return { points: -2, text: `${a} khắc ${b}: tương khắc, cần nhường nhịn.` };
  return { points: -2, text: `${b} khắc ${a}: tương khắc, cần nhường nhịn.` };
}

const STEM_HOP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];
const STEM_XUNG = [[0, 6], [1, 7], [2, 8], [3, 9]];

export function compare(a: YearPillar, b: YearPillar, ca?: ZiweiChart, cb?: ZiweiChart) {
  const items: MatchItem[] = [];
  const el = elementRelation(a.element, b.element);
  items.push({ label: 'Ngũ hành nạp âm', detail: `${a.napam} – ${b.napam}. ${el.text}`, points: el.points });

  const pairIn = (list: number[][], x: number, y: number) => list.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
  if (pairIn(STEM_HOP, a.stem, b.stem)) items.push({ label: 'Thiên can', detail: `${STEMS_VI[a.stem]} – ${STEMS_VI[b.stem]} tương hợp.`, points: 2 });
  else if (pairIn(STEM_XUNG, a.stem, b.stem)) items.push({ label: 'Thiên can', detail: `${STEMS_VI[a.stem]} – ${STEMS_VI[b.stem]} tương xung.`, points: -1 });
  else items.push({ label: 'Thiên can', detail: `${STEMS_VI[a.stem]} – ${STEMS_VI[b.stem]} bình thường.`, points: 0 });

  const x = a.branch, y = b.branch;
  const ba = BRANCHES_VI[x], bb = BRANCHES_VI[y];
  if (x !== y && (x - y + 12) % 4 === 0) items.push({ label: 'Địa chi', detail: `${ba} – ${bb} tam hợp: rất hợp nhau.`, points: 2 });
  else if ((x + y) % 12 === 1) items.push({ label: 'Địa chi', detail: `${ba} – ${bb} lục hợp: gắn bó, hỗ trợ.`, points: 2 });
  else if ((x - y + 12) % 12 === 6) items.push({ label: 'Địa chi', detail: `${ba} – ${bb} lục xung: dễ va chạm.`, points: -2 });
  else if ((x + y) % 12 === 7) items.push({ label: 'Địa chi', detail: `${ba} – ${bb} lục hại: dễ hiểu lầm.`, points: -1 });
  else if (x === y) items.push({ label: 'Địa chi', detail: `Cùng tuổi ${ba}: hiểu nhau nhưng dễ cố chấp như nhau.`, points: 0 });
  else items.push({ label: 'Địa chi', detail: `${ba} – ${bb} không xung không hợp.`, points: 0 });

  if (ca && cb) {
    const majors = (c: ZiweiChart, name: string) =>
      c.palaces.find(p => p.name === name)?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
    const menhA = majors(ca, '命宫'), menhB = majors(cb, '命宫');
    const ptA = majors(ca, '夫妻'), ptB = majors(cb, '夫妻');
    const ab = menhB.filter(s => ptA.includes(s));
    const ba2 = menhA.filter(s => ptB.includes(s));
    const pts = (ab.length ? 1 : 0) + (ba2.length ? 1 : 0);
    const fmt = (l: string[]) => (l.length ? l.map(vi).join(', ') : 'vô chính diệu');
    items.push({
      label: 'Đối chiếu lá số',
      detail: `Mệnh A: ${fmt(menhA)}; Phu Thê A: ${fmt(ptA)}. Mệnh B: ${fmt(menhB)}; Phu Thê B: ${fmt(ptB)}.`
        + (pts ? ' Chính tinh Mệnh người này xuất hiện ở Phu Thê người kia — có duyên tiền định.' : ''),
      points: pts,
    });
  }

  const total = items.reduce((s, i) => s + i.points, 0);
  const score = Math.max(10, Math.min(98, Math.round(55 + total * 7)));
  return { items, score };
}
