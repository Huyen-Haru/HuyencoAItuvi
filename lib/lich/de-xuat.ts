/**
 * Đề xuất cụ thể theo từng cung, cá nhân hóa theo sao trong lá số
 * và theo vận của kỳ đang xem (ngày / tháng / năm).
 *
 * Các gợi ý mang tính tham khảo văn hóa; phần sức khỏe và tài chính
 * không thay thế tư vấn của bác sĩ hay chuyên gia tài chính.
 */
import type { Palace } from '@/lib/ziwei/types';
import { vi } from '@/lib/ziwei/vi';
import type { ChartIndex } from './vanhan';
import type { Factor } from './cung-ngay';
import type { JobTrend } from './cong-viec';
import { yearPillar } from '@/lib/hop-tuoi';

export interface SuggestionGroup {
  icon: string;
  title: string;
  items: string[];
  note?: string;
}

export type Scope = 'ngay' | 'thang' | 'nam';

const SCOPE_WORD: Record<Scope, string> = { ngay: 'hôm nay', thang: 'tháng này', nam: 'năm nay' };

/* ───────── Dữ liệu theo sao ───────── */

/** Ngành nghề / vai trò hợp với chính tinh ở Quan Lộc */
const CAREER: Record<string, string> = {
  '紫微': 'vị trí quản lý, lãnh đạo nhóm, hành chính, công việc cần uy tín',
  '天机': 'lập kế hoạch, phân tích, công nghệ, tư vấn chiến lược, marketing',
  '太阳': 'giáo dục, truyền thông, ngoại giao, công việc giao tiếp đông người',
  '武曲': 'tài chính, ngân hàng, kế toán, kinh doanh, kỹ thuật cơ khí',
  '天同': 'dịch vụ, chăm sóc khách hàng, nhân sự, ẩm thực, giải trí',
  '廉贞': 'pháp chế, quản lý quy trình, kỹ thuật, điện tử, công việc cần kỷ luật',
  '天府': 'quản lý tài sản, kho vận, hành chính, ngân hàng, bất động sản',
  '太阴': 'tài chính, bất động sản, thiết kế, viết nội dung, công việc tỉ mỉ',
  '贪狼': 'kinh doanh, bán hàng, quan hệ công chúng, làm đẹp, nghệ thuật',
  '巨门': 'luật, giảng dạy, tư vấn, nghiên cứu, bán hàng bằng lời nói',
  '天相': 'trợ lý điều hành, hành chính, nhân sự, công việc phối hợp nhiều bên',
  '天梁': 'y tế, giáo dục, bảo hiểm, tư vấn, công tác xã hội',
  '七杀': 'khởi nghiệp, quản lý dự án khó, kỹ thuật, bán hàng thử thách cao',
  '破军': 'đổi mới, khởi nghiệp, công nghệ mới, mở thị trường, cải tổ',
};

/** Phong cách và lĩnh vực đầu tư theo chính tinh ở Tài Bạch */
const MONEY: Record<string, { style: string; fields: string }> = {
  '紫微': { style: 'đầu tư bài bản, có người cố vấn', fields: 'cổ phiếu doanh nghiệp đầu ngành, bất động sản trung tâm' },
  '天机': { style: 'linh hoạt, lướt sóng ngắn nhưng dễ đổi ý', fields: 'công nghệ, giáo dục, dịch vụ tư vấn' },
  '太阳': { style: 'kiếm tiền nhờ danh tiếng, dễ chi cho người khác', fields: 'năng lượng, truyền thông, giáo dục' },
  '武曲': { style: 'quyết đoán, giỏi giữ tiền', fields: 'vàng, kim loại, ngân hàng, tài chính' },
  '天同': { style: 'tiền đến từ từ, thích an toàn', fields: 'tiết kiệm có kỳ hạn, ẩm thực, dịch vụ giải trí' },
  '廉贞': { style: 'kiếm tiền bằng kỹ năng chuyên môn', fields: 'điện tử, công nghệ, sản xuất' },
  '天府': { style: 'tích lũy bền vững, kho lộc', fields: 'tiết kiệm, trái phiếu, bất động sản cho thuê' },
  '太阴': { style: 'tích sản dài hạn, ổn định', fields: 'bất động sản, quỹ đầu tư, sản phẩm cho phụ nữ và gia đình' },
  '贪狼': { style: 'nhiều nguồn thu, dễ bị cám dỗ đầu cơ', fields: 'dịch vụ, giải trí, làm đẹp, ăn uống (chỉ dùng phần vốn nhỏ để thử)' },
  '巨门': { style: 'kiếm tiền bằng lời nói, chuyên môn', fields: 'đào tạo, tư vấn, nội dung số' },
  '天相': { style: 'tiền đến từ hợp tác, cộng sự', fields: 'góp vốn có hợp đồng rõ ràng, dịch vụ chuyên nghiệp' },
  '天梁': { style: 'thận trọng, có quý nhân về tiền', fields: 'bảo hiểm, y tế, giáo dục' },
  '七杀': { style: 'dám mạo hiểm, thắng thua rõ', fields: 'khởi nghiệp, cổ phiếu tăng trưởng (giới hạn tỷ trọng)' },
  '破军': { style: 'thu chi lớn, dễ hao', fields: 'chỉ đầu tư phần nhỏ vào lĩnh vực mới; ưu tiên giữ tiền mặt' },
};

/** Ngành hợp theo ngũ hành bản mệnh (nạp âm năm sinh) */
const ELEMENT_FIELDS: Record<string, string> = {
  'Kim': 'tài chính, kim loại, ô tô, máy móc, trang sức',
  'Mộc': 'giáo dục, nội thất gỗ, nông nghiệp, dược, xuất bản',
  'Thủy': 'logistics, du lịch, đồ uống, thủy sản, thương mại',
  'Hỏa': 'năng lượng, công nghệ, ẩm thực, truyền thông, làm đẹp',
  'Thổ': 'bất động sản, xây dựng, vật liệu, nông sản, kho bãi',
};

/** Bộ phận cơ thể cần để ý theo sao ở Tật Ách (theo sách Tử Vi truyền thống) */
const HEALTH: Record<string, string> = {
  '紫微': 'dạ dày, tỳ vị, tiêu hóa', '天机': 'gan, thần kinh, tay chân',
  '太阳': 'mắt, tim, huyết áp, đầu', '武曲': 'phổi, đường hô hấp, răng',
  '天同': 'thận, bàng quang, tiết niệu, tai', '廉贞': 'máu, tim mạch, da',
  '天府': 'dạ dày, tỳ vị', '太阴': 'thận, mắt, nội tiết',
  '贪狼': 'gan, mật, thận', '巨门': 'dạ dày, miệng, đường tiêu hóa',
  '天相': 'da, đường tiết niệu', '天梁': 'dạ dày, tim, vùng ngực',
  '七杀': 'phổi, hô hấp, chấn thương do va chạm', '破军': 'thận, máu, chấn thương',
  '擎羊': 'chấn thương, vết thương, phẫu thuật', '陀罗': 'xương khớp, răng, cột sống',
  '火星': 'viêm nhiễm, sốt, nóng trong', '铃星': 'viêm âm ỉ, căng thẳng thần kinh',
  '地空': 'suy nhược thần kinh, mất ngủ', '地劫': 'suy nhược, mệt mỏi kéo dài',
};

/** Cách yêu / phong cách tình cảm theo sao ở Phu Thê */
const LOVE: Record<string, string> = {
  '紫微': 'cần được tôn trọng, hợp người có chí hướng', '天机': 'thích trò chuyện, đổi mới, dễ nghĩ nhiều',
  '太阳': 'nhiệt tình, hay lo cho người kia', '武曲': 'thực tế, ít lời, thể hiện bằng hành động',
  '天同': 'ngọt ngào, thích bình yên', '廉贞': 'mãnh liệt, dễ ghen, cần sự chung thủy',
  '天府': 'ổn định, chu đáo', '太阴': 'tinh tế, giàu cảm xúc, cần được quan tâm',
  '贪狼': 'nhiều duyên, cần giữ ranh giới', '巨门': 'dễ hiểu lầm vì lời nói',
  '天相': 'công bằng, coi trọng cam kết', '天梁': 'che chở, như người đi trước',
  '七杀': 'mạnh mẽ, dễ va chạm', '破军': 'nhiều thay đổi, cần kiên nhẫn',
};

/* ───────── Tiện ích ───────── */

function majors(p: Palace | undefined) {
  return p ? p.stars.filter(s => s.type === 'major').map(s => s.name) : [];
}

/** Chính tinh của cung, nếu vô chính diệu thì mượn cung đối. */
function keyStars(p: Palace | undefined): string[] {
  if (!p) return [];
  const m = majors(p);
  if (m.length) return m;
  return p.borrowedStars ?? [];
}

const SHA = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

function has(factors: Factor[], word: string) {
  return factors.some(f => f.text.includes(word));
}

/** Hóa này đến từ ngày, tháng hay năm (để ghi đúng "hôm nay / tháng này / năm nay"). */
function hoaWhen(factors: Factor[], word: string, fallback: string): string {
  const f = factors.find(x => x.text.includes(word));
  if (!f) return fallback;
  if (f.text.includes('ngày')) return 'hôm nay';
  if (f.text.includes('tháng')) return 'tháng này';
  if (f.text.includes('năm')) return 'năm nay';
  return fallback;
}

function level(score: number): 'tot' | 'binh' | 'xau' {
  return score >= 58 ? 'tot' : score >= 46 ? 'binh' : 'xau';
}

/* ───────── Đề xuất theo cung ───────── */

export function suggestForPalace(
  idx: ChartIndex,
  key: string,
  ctx: { score: number; factors: Factor[]; scope: Scope; job?: JobTrend },
): SuggestionGroup[] {
  const nameKey = key === '命宫' ? '命' : key;
  const p = idx.byName[nameKey];
  const stars = keyStars(p);
  const starNames = stars.map(vi).join(', ') || 'cung này';
  const when = SCOPE_WORD[ctx.scope];
  const lv = level(ctx.score);
  const loc = has(ctx.factors, 'Hóa Lộc');
  const quyen = has(ctx.factors, 'Hóa Quyền');
  const khoa = has(ctx.factors, 'Hóa Khoa');
  const ky = has(ctx.factors, 'Hóa Kỵ');
  const xung = has(ctx.factors, 'xung');
  const female = idx.chart.birthInfo.gender === 'female';
  const b = idx.chart.birthInfo;
  const element = yearPillar(b.year, b.month, b.day).element;
  const out: SuggestionGroup[] = [];

  switch (key) {
    case '官禄': {
      const fit = stars.map(s => CAREER[s]).filter(Boolean);
      if (fit.length) out.push({ icon: '🧭', title: `Hợp với bạn (Quan Lộc có ${starNames})`, items: fit.map(f => `Hướng phát triển: ${f}.`) });
      const job = ctx.job;
      const items: string[] = [];
      if (job && job.label === 'Thiên về chủ động') {
        items.push('Có tín hiệu tự muốn đổi mới: cập nhật CV và hồ sơ LinkedIn, liên hệ lại mạng lưới cũ.');
        items.push('Nên nhận lời các buổi phỏng vấn hoặc trao đổi cơ hội mới, kể cả khi chưa chắc sẽ đổi.');
        items.push('Nếu ở lại: chủ động đề xuất dự án mới, xin thêm trách nhiệm hoặc đàm phán tăng lương.');
      } else if (job && job.label === 'Thiên về bị động') {
        items.push('Có dấu hiệu thay đổi ngoài ý muốn: lưu lại email, kết quả công việc, hợp đồng quan trọng.');
        items.push('Giữ quan hệ tốt với cấp trên, tránh tranh luận công khai; chuẩn bị sẵn phương án dự phòng (CV, khoản tiết kiệm 3–6 tháng).');
        items.push('Chưa nên tự ý nghỉ việc khi chưa có nơi mới chắc chắn.');
      } else if (job && job.label === 'Biến động cả hai chiều') {
        items.push('Vừa có cơ hội vừa có áp lực: tìm hiểu cơ hội mới nhưng đừng quyết vội; so sánh kỹ trước khi nhận lời.');
      }
      if (quyen) items.push(`Có Hóa Quyền ${hoaWhen(ctx.factors, 'Hóa Quyền', when)}: hợp nhận vai trò dẫn dắt, trình bày ý tưởng trước lãnh đạo.`);
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: hợp ký hợp đồng, chốt dự án, đề nghị thưởng hoặc tăng thu nhập.`);
      if (khoa) items.push(`Có Hóa Khoa ${hoaWhen(ctx.factors, 'Hóa Khoa', when)}: hợp thi chứng chỉ, nộp hồ sơ, xây dựng uy tín chuyên môn.`);
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: kiểm tra kỹ giấy tờ và số liệu, tránh hứa hẹn quá sức, giữ lời nói chừng mực.`);
      if (xung) items.push('Bị xung: dễ có thay đổi đột ngột trong công việc; chuẩn bị phương án B.');
      {
        items.push(lv === 'tot' ? `Vận công việc ${when} thuận: đẩy nhanh việc đang làm, mạnh dạn đề xuất.`
          : lv === 'binh' ? `Vận công việc ${when} bình ổn: hoàn thành tốt phần việc, học thêm kỹ năng mới.`
          : `Vận công việc ${when} trầm: làm chắc, tránh xung đột, chưa nên nhảy việc.`);
        if (lv === 'tot' && fit.length) items.push(`Nếu đang tìm việc hoặc muốn chuyển hướng: ưu tiên ${fit[0]}.`);
      }
      out.push({ icon: '💡', title: `Đề xuất công việc ${when}`, items });
      break;
    }
    case '财帛': {
      const money = stars.map(s => MONEY[s]).filter(Boolean);
      const fields = [...money.map(m => m.fields), ELEMENT_FIELDS[element]].filter(Boolean);
      out.push({
        icon: '🧭', title: `Hợp với bạn (Tài Bạch có ${starNames}, mệnh ${element})`,
        items: [
          ...money.map(m => `Phong cách tiền bạc: ${m.style}.`),
          `Lĩnh vực đầu tư/kinh doanh hợp: ${fields.join('; ')}.`,
        ],
      });
      const items: string[] = [];
      if (lv === 'tot' && !ky) {
        items.push(`Vận tài ${when} thuận: có thể giải ngân từng phần (ví dụ 20–30% số vốn dự định) vào ${fields.slice(0, 2).join('; ')}.`);
        items.push('Hợp thu hồi công nợ, chốt đơn hàng, đàm phán giá.');
      } else if (lv === 'binh') {
        items.push(`Vận tài ${when} bình: giữ đúng ngân sách, ưu tiên kênh an toàn (tiết kiệm, vàng tích lũy nhỏ).`);
      } else {
        items.push(`Vận tài ${when} yếu: chưa nên đầu tư mới, giữ tiền mặt, không cho vay hay bảo lãnh.`);
      }
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: dễ có khoản thu thêm, nên mở thêm nguồn thu phụ.`);
      if (khoa) items.push(`Có Hóa Khoa ${hoaWhen(ctx.factors, 'Hóa Khoa', when)}: hợp làm giấy tờ tài chính, vay vốn ngân hàng, hồ sơ thuế.`);
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: dễ hao tài vì sai sót, kiểm tra kỹ hợp đồng và chuyển khoản; tránh đầu cơ.`);
      if (stars.includes('破军') || stars.includes('贪狼')) items.push('Lá số dễ chi tiêu theo cảm hứng: đặt hạn mức chi tiêu tháng và tự động chuyển tiền tiết kiệm.');
      out.push({ icon: '💡', title: `Đề xuất tiền bạc ${when}`, items, note: 'Tham khảo theo lá số, không phải lời khuyên tài chính.' });
      break;
    }
    case '夫妻': {
      const style = stars.map(s => LOVE[s]).filter(Boolean);
      if (style.length) out.push({ icon: '🧭', title: `Kiểu tình cảm hợp với bạn (Phu Thê có ${starNames})`, items: style.map(s => `Bạn và người ấy: ${s}.`) });
      const items: string[] = [];
      if (lv === 'tot') {
        items.push(`Vận tình cảm ${when} tốt: hẹn hò, đi chơi xa hoặc nói chuyện về kế hoạch chung.`);
        items.push('Nếu đang độc thân: nhận lời các buổi gặp gỡ, tham gia sự kiện đông người, mở lòng với người mới.');
      } else if (lv === 'binh') {
        items.push('Giữ sự quan tâm nhỏ mỗi ngày: một tin nhắn hỏi han, bữa cơm cùng nhau.');
      } else {
        items.push('Khi có bất đồng: nói chuyện trực tiếp, không nhắn tin lúc đang nóng giận.');
        items.push('Lắng nghe trước khi giải thích, tránh nhắc lại chuyện cũ.');
        items.push('Dành thời gian riêng để mỗi người bình tĩnh; nếu căng thẳng kéo dài, nhờ người tin cậy hoặc chuyên gia tư vấn.');
      }
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: dễ hiểu lầm vì lời nói hoặc chuyện tiền bạc chung; nói rõ ràng, minh bạch.`);
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: nền tình cảm có phúc; một món quà nhỏ hay lời cảm ơn sẽ được đón nhận.`);
      if (stars.includes('贪狼') || stars.includes('廉贞')) items.push('Lá số dễ có người thứ ba để ý: giữ ranh giới rõ với người khác giới.');
      out.push({ icon: '💡', title: `Đề xuất tình cảm ${when}`, items });
      break;
    }
    case '疾厄': {
      const parts = [...new Set([...stars, ...(p?.stars.filter(s => SHA.includes(s.name)).map(s => s.name) ?? [])]
        .map(s => HEALTH[s]).filter(Boolean).join(', ').split(', '))];
      const items: string[] = [];
      if (parts.length) items.push(`Bộ phận nên để ý theo lá số: ${parts.join(', ')}.`);
      if (female) items.push('Là nữ: nên khám phụ khoa và tầm soát vú định kỳ mỗi năm.');
      items.push('Nên kiểm tra định kỳ: công thức máu, đường huyết, mỡ máu, chức năng gan thận.');
      out.push({ icon: '🩺', title: `Nên kiểm tra (Tật Ách có ${starNames})`, items, note: 'Gợi ý theo lá số, không thay thế chẩn đoán của bác sĩ.' });
      const now: string[] = [];
      if (lv === 'xau' || ky) {
        now.push(`Sức khỏe ${when} cần giữ: ngủ trước 23h, ăn nhẹ, hạn chế rượu bia và đồ cay nóng.`);
        if (parts.length) now.push(`Nếu thấy khó chịu ở ${parts.slice(0, 3).join(', ')} thì nên đi khám sớm, đừng tự chữa.`);
        now.push('Đi lại cẩn thận, tránh làm việc quá sức.');
      } else if (lv === 'binh') {
        now.push('Duy trì vận động nhẹ 30 phút mỗi ngày, uống đủ nước.');
      } else {
        now.push(`Thể lực ${when} tốt: hợp bắt đầu thói quen tập luyện mới hoặc đặt lịch khám tổng quát.`);
      }
      out.push({ icon: '💡', title: `Đề xuất sức khỏe ${when}`, items: now });
      break;
    }
    case '福德': {
      out.push({
        icon: '💡', title: `Đề xuất tinh thần ${when}`,
        items: lv === 'xau' || ky
          ? ['Dễ lo nghĩ: viết ra giấy điều đang lo và việc có thể làm ngay.', 'Thiền, đi bộ, nghe nhạc nhẹ 15–20 phút trước khi ngủ.', 'Hạn chế lướt mạng xã hội buổi tối.']
          : ['Tinh thần ổn định: dành thời gian cho sở thích, đọc sách, gặp bạn bè thân.', 'Hợp đi lễ chùa, làm việc thiện, tĩnh tâm.'],
      });
      break;
    }
    case '田宅':
      out.push({
        icon: '💡', title: `Đề xuất nhà cửa ${when}`,
        items: lv === 'tot' && !ky
          ? ['Hợp xem nhà, ký giấy tờ nhà đất, sửa sang, mua sắm đồ gia dụng lớn.', 'Dọn dẹp, sắp xếp lại không gian sống để đón năng lượng mới.']
          : ['Chưa nên mua bán, động thổ hay chuyển nhà; nếu bắt buộc thì đọc kỹ giấy tờ pháp lý.', 'Kiểm tra điện nước, khóa cửa, đồ đạc dễ hỏng.'],
      });
      break;
    case '子女':
      out.push({
        icon: '💡', title: `Đề xuất con cái ${when}`,
        items: lv === 'xau' || ky
          ? ['Để ý sức khỏe và việc học của con, hỏi han nhẹ nhàng thay vì trách mắng.', 'Hạn chế cho con đi xa, chơi thể thao mạo hiểm.']
          : ['Hợp đưa con đi chơi, cho con học thêm kỹ năng mới.', 'Khen ngợi và ghi nhận cố gắng của con.'],
      });
      break;
    case '父母':
      out.push({
        icon: '💡', title: `Đề xuất với bề trên, cha mẹ ${when}`,
        items: lv === 'xau' || ky || xung
          ? ['Gọi điện hỏi thăm cha mẹ; nhắc bố mẹ đi khám sức khỏe định kỳ.', 'Với cấp trên: báo cáo rõ ràng, tránh tranh luận.', 'Giấy tờ, hợp đồng cần đọc kỹ trước khi ký.']
          : ['Hợp xin ý kiến, nhờ cấp trên hoặc người lớn hỗ trợ.', 'Hợp nộp hồ sơ, làm thủ tục hành chính.'],
      });
      break;
    case '迁移':
      out.push({
        icon: '💡', title: `Đề xuất đi lại, ra ngoài ${when}`,
        items: lv === 'tot'
          ? ['Hợp đi công tác, gặp khách hàng ở xa, tham gia sự kiện, du lịch.', 'Mở rộng quan hệ ngoài môi trường quen thuộc.']
          : lv === 'binh'
            ? ['Đi lại bình thường; ưu tiên gặp gỡ trong thành phố, lịch trình gọn.', 'Giữ lời ăn tiếng nói ở nơi đông người.']
            : ['Hạn chế đi xa; nếu đi thì kiểm tra xe, giấy tờ, mua bảo hiểm du lịch.', 'Giữ lời ăn tiếng nói ở nơi đông người.'],
      });
      break;
    case '仆役':
      out.push({
        icon: '💡', title: `Đề xuất bạn bè, đồng nghiệp ${when}`,
        items: lv === 'tot' && !ky
          ? ['Hợp làm việc nhóm, nhờ bạn bè giới thiệu cơ hội, tuyển người.', 'Mời cà phê một người bạn lâu chưa gặp.']
          : ['Cẩn thận lời hứa của người ngoài; không cho vay, không góp vốn khi chưa rõ ràng.', 'Giữ bí mật công việc.'],
      });
      break;
    case '兄弟':
      out.push({
        icon: '💡', title: `Đề xuất anh chị em, cộng sự ${when}`,
        items: lv === 'tot'
          ? ['Hợp bàn chuyện hợp tác với người thân, cộng sự ngang hàng.', 'Họp mặt gia đình, kết nối anh chị em.']
          : ['Tránh vay mượn, góp vốn với người thân lúc này.', 'Nếu có hiểu lầm, chủ động nói chuyện thẳng thắn.'],
      });
      break;
    case '命宫':
      out.push({
        icon: '💡', title: `Đề xuất cho bản thân ${when}`,
        items: lv === 'tot'
          ? ['Tinh thần và sức bật tốt: hợp đặt mục tiêu mới, ra quyết định quan trọng.', `Phát huy điểm mạnh của ${starNames}.`]
          : lv === 'binh'
            ? ['Giữ nhịp đều, làm theo kế hoạch đã định.', 'Dành 10 phút cuối ngày nhìn lại việc đã làm.']
            : ['Dễ mệt và nóng vội: nghỉ ngơi đủ, hoãn quyết định lớn.', 'Làm từng việc nhỏ, tránh ôm đồm.'],
      });
      break;
  }
  return out;
}

/** Một gợi ý ngắn gọn nhất cho thẻ lĩnh vực / bản tin. */
export function topSuggestion(groups: SuggestionGroup[]): string | undefined {
  const g = groups.find(x => x.title.startsWith('Đề xuất')) ?? groups[0];
  return g?.items[0];
}

/**
 * Chọn cung để đề xuất cho một lĩnh vực gồm nhiều cung: lĩnh vực đang tốt thì lấy
 * cung tốt nhất (cơ hội), đang xấu thì lấy cung yếu nhất (cảnh báo), còn lại lấy cung chính.
 */
export function pickDomainPalace<T extends { key: string; score: number }>(domainScore: number, palaces: T[]): T | undefined {
  if (!palaces.length) return undefined;
  const ranked = [...palaces].sort((a, b) => b.score - a.score);
  if (domainScore >= 58) return ranked[0];
  if (domainScore < 46) return ranked[ranked.length - 1];
  return palaces[0];
}
