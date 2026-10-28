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

export interface PalaceDay {
  name: string;
  canChi: string;
  stars: string;
  score: number;
  tags: string[];
  advice: string;
}

const HOA = ['Lộc', 'Quyền', 'Khoa', 'Kỵ'];
const HOA_W = [12, 8, 6, -14];

/** Gợi ý theo cung: [khi tốt, khi bình, khi xấu] */
const TIPS: Record<string, [string, string, string]> = {
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
    let s = 50 + q * 12 + calendarPts;

    if (p.branch === dayBr) { s += q >= 0 ? 6 : -6; tags.push('Cung ứng ngày'); }
    else if (trine.includes(p.branch) && p.branch !== xung) { s += q * 5; tags.push('Tam hợp với ngày'); }
    if (p.branch === xung) { s -= 6; tags.push('Bị ngày xung'); }

    for (const h of dayHoa) if (h.br === p.branch) { s += HOA_W[h.i]; tags.push(`Hóa ${HOA[h.i]} ngày (${vi(h.star)})`); }
    for (const h of monthHoa) if (h.br === p.branch) { s += HOA_W[h.i] * 0.6; tags.push(`${HOA[h.i]} tháng`); }
    for (const h of yearHoa) if (h.br === p.branch) { s += HOA_W[h.i] * 0.4; tags.push(`${HOA[h.i]} năm`); }
    if (p.branch === monthBr) tags.push('Cung của tháng');
    if (p.branch === yearBr) tags.push('Thái Tuế năm');

    const score = clamp(s);
    const key = p.name.replace(/宫$/, '') === '命' ? '命宫' : p.name.replace(/宫$/, '');
    const tip = TIPS[key] ?? TIPS[p.name] ?? ['', '', ''];
    const advice = score >= 60 ? tip[0] : score >= 45 ? tip[1] : tip[2];

    const majors = p.stars.filter(st => st.type === 'major').map(st => vi(st.name));
    const stars = majors.length ? majors.join(', ') : `Vô chính diệu${p.borrowedStars?.length ? ` (mượn ${p.borrowedStars.map(vi).join(', ')})` : ''}`;

    return { name: vi(p.name), canChi: canChi(p.stem, p.branch), stars, score, tags, advice };
  });
}
