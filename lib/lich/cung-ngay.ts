/**
 * Vận 12 cung trong một ngày — dùng cho bản tin chi tiết.
 *
 * Mỗi cung được chấm theo: chất lượng sao gốc, có phải cung ứng ngày / tam phương
 * của cung ứng ngày / bị ngày xung, Tứ Hóa của ngày (mạnh), tháng và năm (nhẹ hơn)
 * rơi vào cung, cùng nền lịch ngày (Trực, Hoàng/Hắc đạo).
 */
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { vi, canChi } from '@/lib/ziwei/vi';
import type { ChartIndex, DayScore } from './vanhan';

export interface Factor {
  text: string;
  pts: number;
}

export interface PalaceDay {
  /** Tên Hán gốc (ví dụ '官禄') để tra cứu */
  key: string;
  branch: number;
  name: string;
  canChi: string;
  stars: string;
  score: number;
  tags: string[];
  /** Các yếu tố làm tăng/giảm điểm, có giải thích */
  factors: Factor[];
  advice: string;
}

export const HOA_EFFECT = [
  'thêm may mắn, thuận lợi, dễ có lợi lộc',
  'thêm quyết đoán, nắm thế chủ động',
  'có quý nhân, được ghi nhận, giấy tờ thuận',
  'dễ vướng mắc, hiểu lầm, trục trặc',
];
const SHA = ['擎羊', '陀罗', '地空', '地劫', '火星', '铃星'];

const HOA = ['Lộc', 'Quyền', 'Khoa', 'Kỵ'];
const HOA_W = [12, 8, 6, -14];

/** Gợi ý theo cung: [khi tốt, khi bình, khi xấu] */
export const PALACE_TIPS: Record<string, [string, string, string]> = {
  '命宫': ['Tinh thần tốt, tự tin quyết định việc của mình.', 'Giữ nhịp bình thường, làm việc theo kế hoạch.', 'Dễ mệt và nóng vội; hạn chế quyết định lớn, nghỉ ngơi đủ.'],
  '兄弟': ['Anh chị em, bạn thân, đồng nghiệp ngang hàng hỗ trợ tốt.', 'Quan hệ anh em, bạn bè yên ổn.', 'Tránh vay mượn, góp vốn với người thân; dễ hiểu lầm.'],
  '夫妻': ['Tình cảm vợ chồng/người yêu hòa hợp, hợp hẹn hò, nói chuyện cởi mở.', 'Quan hệ đôi lứa bình thường, quan tâm nhỏ là đủ.', 'Dễ bất đồng với người thương; nhường nhịn, tránh tranh luận chuyện cũ.'],
  '子女': ['Con cái ngoan, vui; hợp việc sáng tạo, dạy dỗ.', 'Chuyện con cái bình thường.', 'Để ý sức khỏe, học hành của con; kiên nhẫn hơn với trẻ.'],
  '财帛': ['Tiền vào thuận, hợp thu tiền, chốt đơn, đàm phán giá.', 'Thu chi bình thường, giữ đúng ngân sách.', 'Dễ hao tài; tránh chi lớn, cho vay, đầu tư mạo hiểm.'],
  '疾厄': ['Sức khỏe tốt, hợp tập luyện, khám định kỳ.', 'Sức khỏe ổn, ngủ đủ giấc.', 'Cơ thể dễ mệt; ăn uống nhẹ, tránh thức khuya, đi lại cẩn thận.'],
  '迁移': ['Ra ngoài gặp may, hợp đi lại, gặp khách, mở rộng quan hệ.', 'Đi lại bình thường.', 'Hạn chế đi xa, chú ý an toàn giao thông, giữ lời ăn tiếng nói nơi đông người.'],
  '仆役': ['Bạn bè, khách hàng, cấp dưới giúp sức; hợp làm việc nhóm.', 'Quan hệ xã hội yên ổn.', 'Cẩn thận người ngoài, tránh tin lời hứa suông, giữ bí mật công việc.'],
  '官禄': ['Công việc hanh thông, hợp trình bày ý tưởng, ký kết, nhận việc mới.', 'Công việc đều đặn, hoàn thành phần việc đã định.', 'Dễ áp lực, va chạm nơi làm việc; làm chắc, kiểm tra kỹ giấy tờ.'],
  '田宅': ['Nhà cửa êm ấm, hợp dọn dẹp, sửa sang, xem nhà.', 'Việc nhà bình thường.', 'Tránh động thổ, mua bán nhà đất hôm nay; để ý đồ đạc, điện nước.'],
  '福德': ['Tinh thần thư thái, hợp nghỉ ngơi, thiền, làm điều mình thích.', 'Tâm trạng ổn định.', 'Dễ lo nghĩ, khó ngủ; giảm suy nghĩ tiêu cực, dành thời gian thư giãn.'],
  '父母': ['Được bề trên, cha mẹ, sếp ủng hộ; giấy tờ thuận lợi.', 'Quan hệ với bề trên bình thường.', 'Tránh cãi lời bề trên; giấy tờ, hợp đồng cần đọc kỹ.'],
};

/** Yếu tố nền của cung trong lá số gốc (độ sáng chính tinh, cát/sát tinh). */
export function natalFactor(idx: ChartIndex, branch: number): Factor | null {
  const p = idx.byBranch[branch];
  const q = idx.quality[branch] ?? 0;
  if (!p) return null;
  const majorStars = p.stars.filter(st => st.type === 'major');
  const bright = majorStars.filter(st => st.brightness === 'bright').map(st => vi(st.name));
  const dim = majorStars.filter(st => st.brightness === 'dim').map(st => vi(st.name));
  if (q >= 0.3) return { text: `Nền sao tốt${bright.length ? ` (${bright.join(', ')} sáng)` : ''}`, pts: q * 12 };
  if (q <= -0.2) return { text: `Nền sao yếu${dim.length ? ` (${dim.join(', ')} hãm)` : majorStars.length ? '' : ' (vô chính diệu)'}`, pts: q * 12 };
  return { text: 'Nền sao trung bình, không quá mạnh cũng không yếu', pts: 0 };
}

const clamp = (n: number) => Math.max(5, Math.min(95, Math.round(n)));

export function palaceDay(idx: ChartIndex, ds: DayScore): PalaceDay[] {
  const { info } = ds;
  const dayBr = info.dayBranch;
  const trine = [(dayBr + 4) % 12, (dayBr + 8) % 12, (dayBr + 6) % 12];
  const xung = (dayBr + 6) % 12;
  const yearBr = info.yearBranch;
  const monthBr = info.monthBranch;
  const calendarPts = (info.truc.quality === 'tot' ? 3 : info.truc.quality === 'xau' ? -4 : 0) + (info.than.hoangDao ? 3 : -3);

  const hoaOf = (stem: number) => SI_HUA_TABLE[stem].map((star, i) => ({ i, star, br: idx.starBranch[star] }));
  const dayHoa = hoaOf(info.dayStem);
  const monthHoa = hoaOf(info.monthStem);
  const yearHoa = hoaOf(info.yearStem);

  const start = idx.chart.mingGongBranch;
  const ordered = [...idx.chart.palaces].sort((a, b) => ((start - a.branch + 12) % 12) - ((start - b.branch + 12) % 12));

  return ordered.map(p => {
    const q = idx.quality[p.branch] ?? 0;
    const tags: string[] = [];
    const factors: Factor[] = [];
    const add = (text: string, pts: number) => { factors.push({ text, pts }); return pts; };
    let s = 50 + calendarPts;

    const natal = natalFactor(idx, p.branch);
    if (natal) factors.push(natal);
    s += q * 12;

    if (p.branch === dayBr) { tags.push('Cung ứng ngày'); s += add('Là cung ứng ngày: chuyện của cung này nổi lên rõ nhất', q >= 0 ? 6 : -6); }
    else if (trine.includes(p.branch) && p.branch !== xung) { tags.push('Tam hợp với ngày'); s += add('Được ngày tam hợp chiếu', q * 5); }
    if (p.branch === xung) { tags.push('Bị ngày xung'); s += add('Bị ngày xung: dễ biến động, thay đổi đột ngột', -6); }

    for (const h of dayHoa) if (h.br === p.branch) {
      tags.push(`Hóa ${HOA[h.i]} ngày (${vi(h.star)})`);
      s += add(`Hóa ${HOA[h.i]} của ngày nhập vào (${vi(h.star)}): ${HOA_EFFECT[h.i]}`, HOA_W[h.i]);
    }
    for (const h of monthHoa) if (h.br === p.branch) {
      tags.push(`${HOA[h.i]} tháng`);
      s += add(`Nền tháng có Hóa ${HOA[h.i]} (${vi(h.star)})`, HOA_W[h.i] * 0.6);
    }
    for (const h of yearHoa) if (h.br === p.branch) {
      tags.push(`${HOA[h.i]} năm`);
      s += add(`Nền năm có Hóa ${HOA[h.i]} (${vi(h.star)})`, HOA_W[h.i] * 0.4);
    }
    const sha = p.stars.filter(st => SHA.includes(st.name)).map(st => vi(st.name));
    if (sha.length) factors.push({ text: `Có sát tinh ${sha.join(', ')}: dễ va chạm, nóng vội`, pts: 0 });
    if (p.branch === monthBr) tags.push('Cung của tháng');
    if (p.branch === yearBr) tags.push('Thái Tuế năm');

    const score = clamp(s);
    const key = p.name.replace(/宫$/, '') === '命' ? '命宫' : p.name.replace(/宫$/, '');
    const tip = PALACE_TIPS[key] ?? PALACE_TIPS[p.name] ?? ['', '', ''];
    const advice = score >= 60 ? tip[0] : score >= 45 ? tip[1] : tip[2];

    const majors = p.stars.filter(st => st.type === 'major').map(st => vi(st.name));
    const stars = majors.length ? majors.join(', ') : `Vô chính diệu${p.borrowedStars?.length ? ` (mượn ${p.borrowedStars.map(vi).join(', ')})` : ''}`;

    factors.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
    return { key, branch: p.branch, name: vi(p.name), canChi: canChi(p.stem, p.branch), stars, score, tags, factors, advice };
  });
}
