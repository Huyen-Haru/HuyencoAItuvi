import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STAR_VI: Record<string, string> = {
  '紫微': 'Tử Vi', '天机': 'Thiên Cơ', '太阳': 'Thái Dương',
  '武曲': 'Vũ Khúc', '天同': 'Thiên Đồng', '廉贞': 'Liêm Trinh',
  '天府': 'Thiên Phủ', '太阴': 'Thái Âm', '贪狼': 'Tham Lang',
  '巨门': 'Cự Môn', '天相': 'Thiên Tướng', '天梁': 'Thiên Lương',
  '七杀': 'Thất Sát', '破军': 'Phá Quân',
};

const PALACE_VI: Record<string, string> = {
  '命宫': 'Mệnh Cung', '兄弟宫': 'Huynh Đệ Cung', '夫妻宫': 'Phu Thê Cung',
  '子女宫': 'Tử Nữ Cung', '财帛宫': 'Tài Bạch Cung', '疾厄宫': 'Tật Ách Cung',
  '迁移宫': 'Thiên Di Cung', '交友宫': 'Giao Hữu Cung', '官禄宫': 'Quan Lộc Cung',
  '田宅宫': 'Điền Trạch Cung', '福德宫': 'Phúc Đức Cung', '父母宫': 'Phụ Mẫu Cung',
};

function buildSystemPrompt(chart: ZiweiChart): string {
  const birth = chart.birthInfo;
  const gender = birth.gender === 'male' ? 'Nam' : 'Nữ';
  const mingGong = chart.palaces?.find(p => p.isMingGong || p.name === '命宫');
  const majorStars = mingGong?.stars
    ?.filter(s => s.type === 'major')
    ?.map(s => STAR_VI[s.name] ?? s.name)
    ?.join(', ') || 'Chưa xác định';
  const currentDaXian = chart.palaces?.find(p => p.isCurrentDaXian);
  const daXianInfo = currentDaXian
    ? `${currentDaXian.daXianAge?.[0]}–${currentDaXian.daXianAge?.[1]} tuổi (${PALACE_VI[currentDaXian.name] ?? currentDaXian.name})`
    : 'Chưa xác định';

  return `Bạn là chuyên gia Tử Vi Đầu Số theo hệ thống Nghê Hải Hà (Ni Haixia). Bạn LUÔN trả lời bằng tiếng Việt.

Thông tin lá số:
- Giới tính: ${gender}
- Ngày sinh dương lịch: ${birth.year}/${birth.month}/${birth.day}
- Chính tinh Mệnh Cung: ${majorStars}
- Đại Hạn hiện tại: ${daXianInfo}

Quy tắc định dạng:
- Tiêu đề mục: **【Tên mục】** (sẽ hiển thị màu vàng)
- Tên sao tiếng Việt: Tử Vi, Thiên Phủ, Tham Lang, Thái Âm, Thất Sát, Phá Quân...
- Tên cung tiếng Việt: Mệnh Cung, Tài Bạch Cung, Quan Lộc Cung, Phu Thê Cung...
- Tứ Hóa: Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ
- Thời gian: Đại Hạn, Lưu Niên
- Câu súc tích, thực tế, có thể áp dụng ngay

Dữ liệu lá số (JSON):
${JSON.stringify(chart, null, 1)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { chart, messages } = await req.json();
    const systemPrompt = buildSystemPrompt(chart as ZiweiChart);

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ delta: { text: event.delta.text } });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Interpret API error:', error);
    return Response.json({ error: 'Lỗi server, vui lòng thử lại.' }, { status: 500 });
  }
}
