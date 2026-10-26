/**
 * Dựng yêu cầu gửi Claude cho AI luận giải — dùng chung cho API máy chủ
 * và chế độ gọi trực tiếp từ trình duyệt bằng khóa của người dùng.
 */
import type Anthropic from '@anthropic-ai/sdk';
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { BirthInfo } from '@/lib/ziwei/types';
import { generateChart } from '@/lib/ziwei/algorithm';
import { describeChart } from '@/lib/ziwei/describe';

export const AI_MODEL = 'claude-opus-5-5';

export interface AiRequestBody {
  birthInfo?: BirthInfo;
  /** Tương thích client cũ: gửi cả lá số, chỉ lấy birthInfo */
  chart?: { birthInfo?: BirthInfo };
  messages?: { role: 'user' | 'assistant'; content: string }[];
  report?: string;
  year?: number;
  month?: number;
  partnerBirthInfo?: BirthInfo;
}

/** Các mẫu báo cáo sẵn — client chỉ gửi mã báo cáo. */
const REPORTS: Record<string, (ctx: { year: number; month?: number; partner?: string }) => string> = {
  'tong-quan': () =>
    'Hãy luận giải tổng quan lá số: tính cách và mệnh cách, sự nghiệp, tài lộc, tình duyên – hôn nhân, sức khỏe, gia đạo – con cái, cùng các cách cục nổi bật. Kết thúc bằng 3–5 lời khuyên thực tế.',
  'dai-han': () =>
    'Hãy luận Đại hạn 10 năm hiện tại: chủ đề chính, cơ hội, rủi ro, và nên tập trung vào điều gì. So sánh ngắn với đại hạn trước và đại hạn kế tiếp.',
  'nam': ({ year }) =>
    `Hãy luận vận hạn năm ${year}: tổng quan năm, sự nghiệp, tài lộc, tình cảm, sức khỏe, gia đạo. Sau đó điểm qua 12 tháng âm lịch, mỗi tháng 1–2 câu và đánh giá (tốt/bình/kém). Cuối cùng nêu các tháng nên chủ động và các tháng nên thận trọng.`,
  'thang': ({ year, month }) =>
    `Hãy luận chi tiết vận tháng ${month} âm lịch năm ${year}: tổng quan, sự nghiệp, tài lộc, tình cảm, sức khỏe, việc nên làm và nên tránh, các tuần cần lưu ý.`,
  'hop-tuoi': ({ partner }) =>
    `Hãy xem hợp tuổi/hợp lá số giữa đương số và người sau, phân tích điểm hòa hợp, điểm xung khắc, và cách dung hòa:\n${partner ?? ''}`,
};

function systemPrompt(chartText: string): string {
  return `Bạn là chuyên gia Tử Vi Đầu Số, luận giải bằng tiếng Việt cho người dùng Việt Nam.

Nguyên tắc:
- Dựa trên dữ liệu lá số bên dưới; nhắc tới sao, cung, Tứ Hóa, Tuần/Triệt cụ thể khi lập luận.
- Dùng thuật ngữ Tử Vi quen thuộc ở Việt Nam (Mệnh, Thân, Tài Bạch, Quan Lộc, Hóa Lộc, Hóa Kỵ, Đại hạn, Lưu niên…).
- Văn phong ấm áp, rõ ràng, thực tế; ưu tiên lời khuyên có thể áp dụng.
- Tiêu đề mục viết dạng **【Tên mục】**.
- Đây là tham khảo văn hóa và tự phản tỉnh. Không phán đoán chắc chắn về bệnh tật, tai nạn, tuổi thọ; không thay thế tư vấn y tế, pháp lý, tài chính.

Dữ liệu lá số:
${chartText}`;
}

function chartFrom(b: BirthInfo) {
  return generateChart({
    year: Number(b.year), month: Number(b.month), day: Number(b.day),
    hour: Number(b.hour), gender: b.gender === 'female' ? 'female' : 'male',
    lateZi: Boolean(b.lateZi), name: typeof b.name === 'string' ? b.name.slice(0, 60) : undefined,
  });
}

const validBirth = (b?: BirthInfo): b is BirthInfo =>
  Boolean(b && b.year && b.month && b.day && b.hour !== undefined && b.hour !== null);

export type AiParams = BetaMessageStreamParams;

/** Kiểm tra dữ liệu và dựng tham số gọi Claude. Trả về lỗi tiếng Việt nếu dữ liệu sai. */
export function buildAiRequest(body: AiRequestBody): { params: AiParams } | { error: string } {
  const b = body.birthInfo ?? body.chart?.birthInfo;
  if (!validBirth(b)) return { error: 'Thiếu thông tin ngày giờ sinh.' };

  const messages: Anthropic.Beta.BetaMessageParam[] = (body.messages ?? [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (body.report) {
    const tpl = REPORTS[body.report];
    if (!tpl) return { error: 'Loại báo cáo không tồn tại.' };
    const year = Number(body.year) || new Date().getFullYear();
    let partner: string | undefined;
    if (body.report === 'hop-tuoi') {
      if (!validBirth(body.partnerBirthInfo)) return { error: 'Thiếu thông tin người thứ hai.' };
      partner = describeChart(chartFrom(body.partnerBirthInfo));
    }
    messages.push({ role: 'user', content: tpl({ year, month: Number(body.month) || 1, partner }) });
  }

  if (!messages.length || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return { error: 'Cần có câu hỏi.' };
  }

  return {
    params: {
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: systemPrompt(describeChart(chartFrom(b))), cache_control: { type: 'ephemeral' } }],
      messages,
    },
  };
}
