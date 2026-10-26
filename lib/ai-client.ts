'use client';
import type { BirthInfo } from '@/lib/ziwei/types';

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskOptions {
  birthInfo: BirthInfo;
  messages?: ChatMsg[];
  report?: string;
  year?: number;
  month?: number;
  partnerBirthInfo?: BirthInfo;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}

/** Gọi /api/interpret và đọc luồng SSE. Ném lỗi kèm thông điệp tiếng Việt. */
export async function askAI(opts: AskOptions): Promise<string> {
  if (process.env.NEXT_PUBLIC_STATIC_DEMO) {
    throw new Error('Bản xem thử trên GitHub Pages chưa có máy chủ AI. Hãy chạy app trên Vercel hoặc máy tính (có ANTHROPIC_API_KEY) để dùng AI luận giải.');
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      birthInfo: opts.birthInfo,
      messages: opts.messages ?? [],
      report: opts.report,
      year: opts.year,
      month: opts.month,
      partnerBirthInfo: opts.partnerBirthInfo,
    }),
  });
  if (!res.ok || !res.body) {
    let msg = 'Không kết nối được máy chủ AI.';
    try { msg = (await res.json()).error ?? msg; } catch { /* giữ thông điệp mặc định */ }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return full;
      const json = JSON.parse(data);
      if (json.error) throw new Error(json.error);
      if (json.delta?.text) {
        full += json.delta.text;
        opts.onDelta(full);
      }
    }
  }
  return full;
}
