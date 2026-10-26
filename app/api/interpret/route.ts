import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { BirthInfo } from '@/lib/ziwei/types';
import { generateChart } from '@/lib/ziwei/algorithm';
import { describeChart } from '@/lib/ziwei/describe';

const MODEL = 'claude-opus-5-5';

/** Các mẫu báo cáo sẵn — client chỉ gửi mã, nội dung yêu cầu nằm ở server. */
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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Chưa cấu hình ANTHROPIC_API_KEY trên máy chủ. Thêm khóa vào .env.local (xem .env.example).' },
      { status: 503 },
    );
  }

  let body: {
    birthInfo?: BirthInfo;
    /** Tương thích client cũ: gửi cả lá số, server chỉ lấy birthInfo */
    chart?: { birthInfo?: BirthInfo };
    messages?: { role: 'user' | 'assistant'; content: string }[];
    report?: string;
    year?: number;
    month?: number;
    partnerBirthInfo?: BirthInfo;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const b = body.birthInfo ?? body.chart?.birthInfo;
  if (!b || !b.year || !b.month || !b.day || b.hour === undefined || !b.gender) {
    return Response.json({ error: 'Thiếu thông tin ngày giờ sinh.' }, { status: 400 });
  }

  const chart = generateChart({
    year: Number(b.year), month: Number(b.month), day: Number(b.day),
    hour: Number(b.hour), gender: b.gender === 'female' ? 'female' : 'male',
    lateZi: Boolean(b.lateZi), name: typeof b.name === 'string' ? b.name.slice(0, 60) : undefined,
  });

  const messages: Anthropic.Beta.BetaMessageParam[] = (body.messages ?? [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (body.report) {
    const tpl = REPORTS[body.report];
    if (!tpl) return Response.json({ error: 'Loại báo cáo không tồn tại.' }, { status: 400 });
    const year = Number(body.year) || new Date().getFullYear();
    let partner: string | undefined;
    const pb = body.partnerBirthInfo;
    if (body.report === 'hop-tuoi') {
      if (!pb || !pb.year || !pb.month || !pb.day || pb.hour === undefined) {
        return Response.json({ error: 'Thiếu thông tin người thứ hai.' }, { status: 400 });
      }
      partner = describeChart(generateChart({
        year: Number(pb.year), month: Number(pb.month), day: Number(pb.day),
        hour: Number(pb.hour), gender: pb.gender === 'female' ? 'female' : 'male',
        lateZi: Boolean(pb.lateZi), name: typeof pb.name === 'string' ? pb.name.slice(0, 60) : undefined,
      }));
    }
    messages.push({ role: 'user', content: tpl({ year, month: Number(body.month) || 1, partner }) });
  }

  if (!messages.length || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'Cần có câu hỏi.' }, { status: 400 });
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: [{ type: 'text', text: systemPrompt(describeChart(chart)), cache_control: { type: 'ephemeral' } }],
    messages,
  });

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            send(controller, { delta: { text: event.delta.text } });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          send(controller, { error: 'Mô hình từ chối trả lời yêu cầu này. Bạn thử diễn đạt lại câu hỏi nhé.' });
        } else if (final.stop_reason === 'max_tokens') {
          send(controller, { notice: 'Câu trả lời dài, đã bị cắt bớt.' });
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        let msg = 'Lỗi khi gọi AI, vui lòng thử lại.';
        if (err instanceof Anthropic.AuthenticationError) msg = 'Khóa API không hợp lệ.';
        else if (err instanceof Anthropic.RateLimitError) msg = 'AI đang quá tải, thử lại sau ít phút.';
        else if (err instanceof Anthropic.APIError) msg = `Lỗi AI (${err.status ?? 'mạng'}).`;
        send(controller, { error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
