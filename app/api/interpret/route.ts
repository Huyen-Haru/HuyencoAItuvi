import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { buildAiRequest, type AiRequestBody } from '@/lib/ai-prompt';

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Chưa cấu hình ANTHROPIC_API_KEY trên máy chủ. Thêm khóa vào .env.local (xem .env.example), hoặc dán khóa của bạn trong mục "Kết nối AI".' },
      { status: 503 },
    );
  }

  let body: AiRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const built = buildAiRequest(body);
  if ('error' in built) return Response.json({ error: built.error }, { status: 400 });

  const client = new Anthropic();
  const stream = client.beta.messages.stream(built.params);

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
