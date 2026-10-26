/**
 * Mô tả lá số bằng tiếng Việt dạng văn bản — dùng cho AI luận giải và báo cáo.
 */
import type { ZiweiChart, Palace } from './types';
import { SI_HUA_TABLE } from './constants';
import { vi, viPattern, canChi, yearCanChi, BRANCHES_VI, SIHUA_VI } from './vi';
import { detectPatterns } from './patterns';
import { solarToLunar } from '@/lib/lich/amlich';

const BR_LABEL: Record<string, string> = {
  '庙': 'miếu', '旺': 'vượng', '得': 'đắc', '利': 'lợi', '平': 'bình', '不': 'bất', '陷': 'hãm',
};

export function tuanTriet(p: Palace): string[] {
  const out: string[] = [];
  if (p.stars.some(s => s.name === '旬空')) out.push('Tuần');
  if (p.stars.some(s => s.name === '截路' || s.name === '空亡')) out.push('Triệt');
  return out;
}

function starLine(p: Palace): string {
  const fmt = (type: string) => p.stars
    .filter(s => s.type === type && !['旬空', '截路', '空亡'].includes(s.name))
    .map(s => {
      const parts = [vi(s.name)];
      if (s.brightnessLabel && BR_LABEL[s.brightnessLabel]) parts.push(`(${BR_LABEL[s.brightnessLabel]})`);
      if (s.siHua) parts.push(`[${SIHUA_VI[s.siHua]}]`);
      return parts.join(' ');
    });
  const major = fmt('major');
  const lucky = fmt('lucky');
  const sha = fmt('sha');
  const segs = [
    `Chính tinh: ${major.length ? major.join(', ') : `vô chính diệu${p.borrowedStars?.length ? ` (mượn ${p.borrowedStars.map(vi).join(', ')} từ ${vi(p.borrowedFromName)})` : ''}`}`,
  ];
  if (lucky.length) segs.push(`Cát tinh: ${lucky.join(', ')}`);
  if (sha.length) segs.push(`Sát tinh: ${sha.join(', ')}`);
  const tt = tuanTriet(p);
  if (tt.length) segs.push(`Gặp ${tt.join(', ')}`);
  return segs.join('; ');
}

export function describeChart(chart: ZiweiChart, now = new Date()): string {
  const b = chart.birthInfo;
  const l = solarToLunar(b.day, b.month, b.year);
  const ordered = [...chart.palaces].sort((a, c) => {
    const start = chart.mingGongBranch;
    return ((start - a.branch + 12) % 12) - ((start - c.branch + 12) % 12);
  });
  const year = now.getFullYear();
  const yStem = ((year - 4) % 10 + 10) % 10;
  const yBranch = ((year - 4) % 12 + 12) % 12;
  const taiTue = chart.palaces.find(p => p.branch === yBranch);
  const hoa = SI_HUA_TABLE[yStem];
  const hoaLines = hoa.map((star, i) => {
    const p = chart.palaces.find(pp => pp.stars.some(s => s.name === star));
    return `${['Lộc', 'Quyền', 'Khoa', 'Kỵ'][i]}: ${vi(star)}${p ? ` → cung ${vi(p.name)}` : ''}`;
  });
  const dx = chart.daXians[chart.currentDaXianIndex];
  const patterns = detectPatterns(chart).slice(0, 6).map(p => viPattern(p.name));

  const lines = [
    `Họ tên: ${b.name || '(không ghi)'} · Giới tính: ${b.gender === 'male' ? 'Nam' : 'Nữ'}`,
    `Sinh dương lịch ${b.day}/${b.month}/${b.year}, âm lịch ${l.day}/${l.month}${l.leap ? ' nhuận' : ''} năm ${yearCanChi(l.year)}, giờ ${BRANCHES_VI[b.hour]}${b.lateZi ? ' (Tý muộn)' : ''}`,
    `Cục: ${vi(chart.wuxingJuName)} · Mệnh cung tại ${BRANCHES_VI[chart.mingGongBranch]} · Thân cư ${vi(chart.palaces.find(p => p.branch === chart.shenGongBranch)?.name)} (${BRANCHES_VI[chart.shenGongBranch]})`,
    `Tuổi mụ năm ${year}: ${year - l.year + 1}${dx ? ` · Đại hạn hiện tại ${dx.startAge}–${dx.endAge} tuổi tại cung ${vi(dx.palaceName)}` : ''}`,
    `Năm xem ${year} (${yearCanChi(year)}): Lưu Thái Tuế ở cung ${vi(taiTue?.name)} (${BRANCHES_VI[yBranch]}); Tứ Hóa năm — ${hoaLines.join('; ')}`,
    patterns.length ? `Cách cục nhận diện: ${patterns.join(', ')}` : '',
    '',
    '12 cung (bắt đầu từ Mệnh):',
    ...ordered.map(p => `- ${vi(p.name)} (${canChi(p.stem, p.branch)})${p.isShenGong ? ' [Thân]' : ''}${p.daXianAge ? ` · đại hạn ${p.daXianAge[0]}–${p.daXianAge[1]}` : ''}: ${starLine(p)}`),
  ];
  return lines.filter(x => x !== undefined).join('\n');
}
