/**
 * Thông tin lịch vạn niên cho một ngày: âm lịch Việt, can chi, 12 Trực,
 * 12 thần Hoàng/Hắc đạo, Nhị thập bát tú, giờ hoàng đạo, tiết khí.
 */
import { Solar } from 'lunar-javascript';
import { solarToLunar, julianDay, type LunarDate } from './amlich';
import { BRANCHES_VI, STEMS_VI, canChi } from '@/lib/ziwei/vi';

export type Quality = 'tot' | 'binh' | 'xau';

export interface TrucInfo {
  name: string;
  quality: Quality;
  nen: string[];
  kieng: string[];
}

const TRUC: Record<string, TrucInfo> = {
  '建': { name: 'Kiến', quality: 'tot', nen: ['Xuất hành', 'Khai trương', 'Nhậm chức', 'Gặp gỡ đối tác'], kieng: ['Động thổ', 'Đào giếng', 'An táng'] },
  '除': { name: 'Trừ', quality: 'tot', nen: ['Chữa bệnh', 'Cúng giải hạn', 'Dọn dẹp, tẩy uế', 'Cắt bỏ việc cũ'], kieng: ['Cưới hỏi', 'Xuất vốn lớn', 'Đi xa'] },
  '满': { name: 'Mãn', quality: 'tot', nen: ['Cầu tài', 'Cúng tế', 'Mở kho, nhập hàng', 'Thu nợ'], kieng: ['Kiện tụng', 'Nhậm chức', 'Chữa bệnh'] },
  '平': { name: 'Bình', quality: 'binh', nen: ['Sửa sang nhà cửa', 'Trang trí', 'Việc thường ngày'], kieng: ['Khởi sự việc lớn', 'Ký hợp đồng lớn'] },
  '定': { name: 'Định', quality: 'tot', nen: ['Cưới hỏi', 'Ký kết', 'Mua bán', 'Nhập học', 'Nhận người làm'], kieng: ['Kiện tụng', 'Đi xa', 'Chữa bệnh'] },
  '执': { name: 'Chấp', quality: 'binh', nen: ['Xây dựng', 'Tuyển người', 'Trồng cây', 'Lập kế hoạch'], kieng: ['Xuất kho', 'Chuyển nhà', 'Đi xa'] },
  '破': { name: 'Phá', quality: 'xau', nen: ['Phá dỡ nhà cũ', 'Chữa bệnh'], kieng: ['Cưới hỏi', 'Khai trương', 'Ký hợp đồng', 'Xuất hành'] },
  '危': { name: 'Nguy', quality: 'xau', nen: ['Cúng bái', 'Tĩnh tâm'], kieng: ['Đi xa', 'Leo cao, đi sông nước', 'Đầu tư mạo hiểm'] },
  '成': { name: 'Thành', quality: 'tot', nen: ['Khai trương', 'Cưới hỏi', 'Ký hợp đồng', 'Nhập học', 'Xuất hành'], kieng: ['Kiện tụng', 'Tranh cãi'] },
  '收': { name: 'Thu', quality: 'binh', nen: ['Thu nợ', 'Mua hàng, tích trữ', 'Thu hoạch'], kieng: ['An táng', 'Khai trương', 'Đi xa'] },
  '开': { name: 'Khai', quality: 'tot', nen: ['Khai trương', 'Nhậm chức', 'Động thổ', 'Học hành', 'Xuất hành'], kieng: ['An táng', 'Chặt cây'] },
  '闭': { name: 'Bế', quality: 'xau', nen: ['Đắp đê, lấp hố', 'Nghỉ ngơi, tu dưỡng'], kieng: ['Khai trương', 'Xuất hành', 'Chữa mắt', 'Khởi sự mới'] },
};

const THAN_VI: Record<string, string> = {
  '青龙': 'Thanh Long', '明堂': 'Minh Đường', '天刑': 'Thiên Hình', '朱雀': 'Chu Tước',
  '金匮': 'Kim Quỹ', '天德': 'Kim Đường (Bảo Quang)', '白虎': 'Bạch Hổ', '玉堂': 'Ngọc Đường',
  '天牢': 'Thiên Lao', '玄武': 'Nguyên Vũ', '司命': 'Tư Mệnh', '勾陈': 'Câu Trận',
};

const XIU_VI: Record<string, string> = {
  '角': 'Giác', '亢': 'Cang', '氐': 'Đê', '房': 'Phòng', '心': 'Tâm', '尾': 'Vĩ', '箕': 'Cơ',
  '斗': 'Đẩu', '牛': 'Ngưu', '女': 'Nữ', '虚': 'Hư', '危': 'Nguy', '室': 'Thất', '壁': 'Bích',
  '奎': 'Khuê', '娄': 'Lâu', '胃': 'Vị', '昴': 'Mão', '毕': 'Tất', '觜': 'Chủy', '参': 'Sâm',
  '井': 'Tỉnh', '鬼': 'Quỷ', '柳': 'Liễu', '星': 'Tinh', '张': 'Trương', '翼': 'Dực', '轸': 'Chẩn',
};

const TIETKHI_VI: Record<string, string> = {
  '小寒': 'Tiểu Hàn', '大寒': 'Đại Hàn', '立春': 'Lập Xuân', '雨水': 'Vũ Thủy', '惊蛰': 'Kinh Trập',
  '春分': 'Xuân Phân', '清明': 'Thanh Minh', '谷雨': 'Cốc Vũ', '立夏': 'Lập Hạ', '小满': 'Tiểu Mãn',
  '芒种': 'Mang Chủng', '夏至': 'Hạ Chí', '小暑': 'Tiểu Thử', '大暑': 'Đại Thử', '立秋': 'Lập Thu',
  '处暑': 'Xử Thử', '白露': 'Bạch Lộ', '秋分': 'Thu Phân', '寒露': 'Hàn Lộ', '霜降': 'Sương Giáng',
  '立冬': 'Lập Đông', '小雪': 'Tiểu Tuyết', '大雪': 'Đại Tuyết', '冬至': 'Đông Chí',
  'DONG_ZHI': 'Đông Chí', 'XIAO_HAN': 'Tiểu Hàn', 'DA_HAN': 'Đại Hàn', 'LI_CHUN': 'Lập Xuân',
  'YU_SHUI': 'Vũ Thủy', 'JING_ZHE': 'Kinh Trập',
};

const BRANCH_ZH = '子丑寅卯辰巳午未申酉戌亥';

export interface GioInfo {
  branch: number;
  name: string;
  range: string;
}

export interface DayInfo {
  key: string;            // yyyy-mm-dd
  y: number; m: number; d: number;
  weekday: number;        // 0 = Chủ nhật
  lunar: LunarDate;
  dayStem: number; dayBranch: number;
  monthStem: number; monthBranch: number;
  yearStem: number; yearBranch: number;
  canChiNgay: string; canChiThang: string; canChiNam: string;
  truc: TrucInfo;
  than: { name: string; hoangDao: boolean };
  sao28: { name: string; tot: boolean };
  gioHoangDao: GioInfo[];
  tietKhi?: string;
  /** Chi bị xung với ngày (tuổi kỵ) */
  xungBranch: number;
}

export const WEEKDAYS_VI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function hourRange(branch: number): string {
  const start = (branch * 2 + 23) % 24;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(start)}h–${pad((start + 2) % 24)}h`;
}

const cache = new Map<string, DayInfo>();

export function getDayInfo(y: number, m: number, d: number): DayInfo {
  const key = dateKey(y, m, d);
  const hit = cache.get(key);
  if (hit) return hit;

  const jd = julianDay(d, m, y);
  const dayStem = (jd + 9) % 10;
  const dayBranch = (jd + 1) % 12;

  const lunar = solarToLunar(d, m, y);
  // Can chi năm/tháng theo âm lịch Việt (tháng Giêng = Dần, can tháng theo can năm)
  const yearStem = (((lunar.year - 4) % 10) + 10) % 10;
  const yearBranch = (((lunar.year - 4) % 12) + 12) % 12;
  const monthBranch = (lunar.month + 1) % 12;
  const monthStem = (yearStem * 2 + lunar.month + 1) % 10;

  const ln = Solar.fromYmd(y, m, d).getLunar();
  const truc = TRUC[ln.getZhiXing()] ?? TRUC['平'];
  const thanZh = ln.getDayTianShen();
  const xiuZh = ln.getXiu();
  const jq = ln.getJieQi();

  const gioHoangDao = ln.getTimes().slice(0, 12)
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.getTianShenType() === '黄道')
    .map(({ t }) => {
      const b = BRANCH_ZH.indexOf(t.getZhi());
      return { branch: b, name: BRANCHES_VI[b], range: hourRange(b) };
    });

  const info: DayInfo = {
    key, y, m, d,
    weekday: new Date(y, m - 1, d).getDay(),
    lunar,
    dayStem, dayBranch, monthStem, monthBranch, yearStem, yearBranch,
    canChiNgay: canChi(dayStem, dayBranch),
    canChiThang: canChi(monthStem, monthBranch),
    canChiNam: canChi(yearStem, yearBranch),
    truc,
    than: { name: THAN_VI[thanZh] ?? thanZh, hoangDao: ln.getDayTianShenType() === '黄道' },
    sao28: { name: XIU_VI[xiuZh] ?? xiuZh, tot: ln.getXiuLuck() === '吉' },
    gioHoangDao,
    tietKhi: jq ? (TIETKHI_VI[jq] ?? jq) : undefined,
    xungBranch: (dayBranch + 6) % 12,
  };
  cache.set(key, info);
  return info;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function lunarLabel(l: LunarDate): string {
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''}`;
}

export { STEMS_VI, BRANCHES_VI };
