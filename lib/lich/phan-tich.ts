/**
 * Bản tin phân tích một ngày theo lá số: gom điểm số thành nhận định có lý do,
 * dùng chung cho trang /ban-tin và bản tin gửi qua app Claude.
 */
import type { Palace } from '@/lib/ziwei/types';
import { vi, BRANCHES_VI, yearCanChi } from '@/lib/ziwei/vi';
import { scoreDay, scoreLabel, ACTIVITIES, activityScore, type ChartIndex, type DayScore } from './vanhan';
import { palaceDay, type PalaceDay } from './cung-ngay';
import { jobTrend, jobTrendYear, type JobTrend } from './cong-viec';
import { WEEKDAYS_VI, lunarLabel } from './ngay';

/** Nét tính cách của 14 chính tinh, dùng để giải thích "vì sao". */
const STAR_FLAVOR: Record<string, string> = {
  '紫微': 'uy quyền, được nể trọng', '天机': 'nhanh nhạy, nhiều ý tưởng nhưng dễ đổi ý',
  '太阳': 'cởi mở, hào phóng, hay lo cho người khác', '武曲': 'quyết đoán, thực tế về tiền bạc',
  '天同': 'ôn hòa, thích an nhàn', '廉贞': 'nguyên tắc, mạnh mẽ, dễ căng thẳng',
  '天府': 'ổn định, biết giữ của', '太阴': 'tinh tế, nhạy cảm, giỏi tích lũy',
  '贪狼': 'giao tiếp rộng, nhiều ham muốn', '巨门': 'lời nói sắc, dễ thị phi',
  '天相': 'chừng mực, công bằng, hợp hòa giải', '天梁': 'che chở, có quý nhân giải nguy',
  '七杀': 'dứt khoát, dám làm, dễ xung đột', '破军': 'muốn đổi mới, dễ hao tổn',
};

export interface DomainBrief {
  key: string;
  icon: string;
  label: string;
  short: string;
  /** Nền sao của cung chính */
  intro: string;
  /** Các tác động hôm nay, mỗi dòng một ý */
  reasons: string[];
  score: number;
  verdict: string;
  why: string;
  action: string;
}

export interface HourSlot {
  branch: number;
  name: string;
  range: string;
  good: boolean;
  suggestion?: string;
}

export interface Brief {
  ds: DayScore;
  dateLabel: string;
  lunarLine: string;
  theme: string;
  keyPoints: { kind: 'co-hoi' | 'luu-y' | 'nen-lam'; title: string; text: string }[];
  domains: DomainBrief[];
  palaces: PalaceDay[];
  hours: HourSlot[];
  week: { label: string; short: string; score: number; isBest: boolean; isWorst: boolean }[];
  job: JobTrend & { keyMonth?: JobTrend };
  calendar: { truc: string; trucQuality: string; than: string; hoangDao: boolean; sao: string; saoTot: boolean; xung: string; nen: string[]; kieng: string[] };
  bestActivities: { label: string; score: number }[];
}

const DOMAIN_DEFS = [
  { key: 'cong-viec', icon: '💼', label: 'Công việc', short: 'công việc', palaces: ['官禄'] },
  { key: 'tien-bac', icon: '💰', label: 'Tiền bạc', short: 'tiền bạc', palaces: ['财帛'] },
  { key: 'tinh-cam', icon: '❤️', label: 'Tình cảm', short: 'tình cảm', palaces: ['夫妻'] },
  { key: 'suc-khoe', icon: '🌿', label: 'Sức khỏe · Tinh thần', short: 'sức khỏe', palaces: ['疾厄', '福德'] },
  { key: 'gia-dinh', icon: '🏠', label: 'Gia đình', short: 'gia đình', palaces: ['田宅', '子女', '父母'] },
  { key: 'quan-he', icon: '🤝', label: 'Quan hệ · Đi lại', short: 'các mối quan hệ', palaces: ['迁移', '仆役', '兄弟'] },
];

export function verdictOf(score: number): string {
  if (score >= 66) return 'Rất thuận';
  if (score >= 58) return 'Thuận';
  if (score >= 48) return 'Bình thường';
  if (score >= 40) return 'Cần để ý';
  return 'Nên giữ gìn';
}

function starIntro(p: Palace | undefined): string {
  if (!p) return '';
  const majors = p.stars.filter(s => s.type === 'major');
  if (!majors.length) {
    return p.borrowedStars?.length ? `cung trống, mượn ${p.borrowedStars.map(vi).join(', ')}` : 'cung trống chính tinh';
  }
  return majors.map(s => {
    const flavor = STAR_FLAVOR[s.name];
    const bright = s.brightness === 'bright' ? ' sáng' : s.brightness === 'dim' ? ' hãm' : '';
    return `${vi(s.name)}${bright}${flavor ? ` (${flavor})` : ''}`;
  }).join(', ');
}

/** Viết thường chữ đầu câu, giữ nguyên tên sao/Hóa (Hóa Lộc, Thiên Lương…) */
function lowerFirst(t: string) {
  if (!t || /^(Hóa|Thái|Thiên|Tử|Vũ|Liêm|Tham|Cự|Thất|Phá)\s/.test(t)) return t;
  return t[0].toLowerCase() + t.slice(1);
}

export function buildBrief(idx: ChartIndex, y: number, m: number, d: number): Brief {
  const ds = scoreDay(idx, y, m, d);
  const { info } = ds;
  const palaces = palaceDay(idx, ds);
  const byKey = Object.fromEntries(palaces.map(p => [p.key, p]));

  // Lĩnh vực: lấy cung chính (đầu tiên) để giải thích, điểm = trung bình có trọng số cung chính
  const domains: DomainBrief[] = DOMAIN_DEFS.map(def => {
    const pds = def.palaces.map(k => byKey[k]).filter(Boolean) as PalaceDay[];
    const main = pds[0];
    const score = Math.round(pds.reduce((a, p, i) => a + p.score * (i === 0 ? 2 : 1), 0) / (pds.length + 1));
    const natal = idx.byName[main.key === '命宫' ? '命' : main.key];
    const strongest = pds.flatMap(p => p.factors.map(f => ({ ...f, palace: p.name }))).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
    const reasons = strongest.filter(f => !f.text.startsWith('Nền sao')).slice(0, 2)
      .map(f => `${f.palace !== main.name ? `${f.palace}: ` : ''}${lowerFirst(f.text.replace(': ', ' → '))}`);
    const intro = `${main.name}: ${starIntro(natal)}`;
    const why = `${intro}.${reasons.length ? ` Hôm nay: ${reasons.join('; ')}.` : ' Hôm nay không có tác động lớn.'}`;
    // Lời khuyên: cung chính yếu thì cảnh báo; nếu không, ưu tiên cung đang thuận nhất trong nhóm
    const ranked = [...pds].sort((a, b) => b.score - a.score);
    const action = score < 45 || main.score < 45
      ? (main.score < 45 ? main : ranked[ranked.length - 1]).advice
      : ranked[0].score >= 60 ? ranked[0].advice : main.advice;
    return { key: def.key, icon: def.icon, label: def.label, short: def.short, intro, reasons, score, verdict: verdictOf(score), why, action };
  });

  const sortedDomains = [...domains].sort((a, b) => b.score - a.score);
  const bestD = sortedDomains.slice(0, 2);
  const worstD = sortedDomains[sortedDomains.length - 1];

  // Chủ đề của ngày
  const mood = ds.score >= 68 ? 'Ngày thuận, nên chủ động làm việc quan trọng'
    : ds.score >= 56 ? 'Ngày khá, đẩy việc vừa sức'
    : ds.score >= 44 ? 'Ngày bình, nên giữ nhịp chậm và chắc'
    : 'Ngày nên phòng thủ, ưu tiên việc nhỏ';
  const theme = `${mood}. Thuận về ${bestD.map(x => x.short).join(' và ')}; cần giữ ${worstD.short}.`;

  // Việc hợp nhất
  const acts = ACTIVITIES.map(a => ({ label: a.label, score: activityScore(ds, a) })).sort((a, b) => b.score - a.score);

  // Giờ trong ngày (05h–23h), gợi ý theo giờ hoàng đạo
  const goodSet = new Set(info.gioHoangDao.map(g => g.branch));
  const dayOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11];  // Mão → Hợi
  const ideas = [
    `Việc quan trọng nhất: ${acts[0].label.toLowerCase()}`,
    bestD[0].key === 'tinh-cam' ? 'Hẹn gặp, trò chuyện với người thương' : `Việc liên quan ${bestD[0].short}`,
    'Gặp gỡ, trao đổi, gửi đề xuất',
    'Xử lý giấy tờ, thanh toán',
  ];
  let k = 0;
  const hours: HourSlot[] = dayOrder.map(b => {
    const start = (b * 2 + 23) % 24;
    const pad = (n: number) => String(n).padStart(2, '0');
    const good = goodSet.has(b);
    let suggestion: string | undefined;
    if (good) suggestion = start >= 19 ? 'Nghỉ ngơi, dành cho gia đình' : start < 7 ? 'Lên kế hoạch cho ngày' : ideas[k++ % ideas.length];
    return { branch: b, name: BRANCHES_VI[b], range: `${pad(start)}–${pad((start + 2) % 24)}h`, good, suggestion };
  });

  // 3 điều cần biết
  const topPalace = [...palaces].sort((a, b) => b.score - a.score)[0];
  const lowPalace = [...palaces].sort((a, b) => a.score - b.score)[0];
  const firstGood = hours.find(h => h.good && h.suggestion && !h.suggestion.startsWith('Lên kế hoạch'));
  const keyPoints: Brief['keyPoints'] = [
    {
      kind: 'co-hoi',
      title: `Cơ hội: ${topPalace.name}`,
      text: `${topPalace.factors[0] ? `${topPalace.factors[0].text.replace(': ', ' → ')}. ` : ''}${topPalace.advice}`,
    },
    {
      kind: 'luu-y',
      title: ds.xungTuoi ? `Lưu ý: ngày xung tuổi ${BRANCHES_VI[idx.birthBranch]}` : `Lưu ý: ${lowPalace.name}`,
      text: ds.xungTuoi
        ? `Ngày ${info.canChiNgay} xung tuổi: tránh quyết định lớn, ký kết quan trọng; ${lowerFirst(lowPalace.advice)}`
        : `${lowPalace.factors[0] ? `${lowPalace.factors[0].text.replace(': ', ' → ')}. ` : ''}${lowPalace.advice}`,
    },
    {
      kind: 'nen-lam',
      title: `Nên làm: ${acts[0].label}`,
      text: firstGood
        ? `Chọn giờ ${firstGood.name} (${firstGood.range}) là giờ hoàng đạo. Trực ${info.truc.name} hợp: ${info.truc.nen.slice(0, 3).join(', ').toLowerCase()}.`
        : `Trực ${info.truc.name} hợp: ${info.truc.nen.slice(0, 3).join(', ').toLowerCase()}.`,
    },
  ];

  // 7 ngày tới
  const next = Array.from({ length: 7 }, (_, i) => {
    const t = new Date(y, m - 1, d + 1 + i);
    return scoreDay(idx, t.getFullYear(), t.getMonth() + 1, t.getDate());
  });
  const maxS = Math.max(...next.map(n => n.score));
  const minS = Math.min(...next.map(n => n.score));
  const short = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const week = next.map(n => ({
    label: `${WEEKDAYS_VI[n.info.weekday]} ${n.info.d}/${n.info.m}`,
    short: `${short[n.info.weekday]} ${n.info.d}/${n.info.m}`,
    score: n.score, isBest: n.score === maxS, isWorst: n.score === minS,
  }));

  // Công việc
  const job = jobTrend(idx, info.lunar.year, info.lunar.month);
  const rest = jobTrendYear(idx, info.lunar.year).filter(j => j.lunarMonth > info.lunar.month);
  const keyMonth = [...rest].sort((a, b) => b.chuDong + b.biDong - (a.chuDong + a.biDong))[0];

  return {
    ds,
    dateLabel: `${WEEKDAYS_VI[info.weekday]}, ${info.d}/${info.m}/${info.y}`,
    lunarLine: `Âm lịch ${lunarLabel(info.lunar)} năm ${yearCanChi(info.lunar.year)} · Ngày ${info.canChiNgay} · Tháng ${info.canChiThang}${info.tietKhi ? ` · Tiết ${info.tietKhi}` : ''}`,
    theme,
    keyPoints,
    domains,
    palaces,
    hours,
    week,
    job: { ...job, keyMonth: keyMonth && keyMonth.chuDong + keyMonth.biDong > job.chuDong + job.biDong ? keyMonth : undefined },
    calendar: {
      truc: info.truc.name,
      trucQuality: info.truc.quality === 'tot' ? 'tốt' : info.truc.quality === 'xau' ? 'xấu' : 'bình',
      than: info.than.name, hoangDao: info.than.hoangDao,
      sao: info.sao28.name, saoTot: info.sao28.tot,
      xung: BRANCHES_VI[info.xungBranch],
      nen: info.truc.nen, kieng: info.truc.kieng,
    },
    bestActivities: acts.slice(0, 3),
  };
}

export { scoreLabel };
