'use client';
import { useCallback, useEffect, useState } from 'react';
import type { BirthInfo } from '@/lib/ziwei/types';

const KEY_STORE = 'tuvi_anthropic_key_v1';
const KEY_EVENT = 'tuvi-ai-key-changed';

/** Khóa API người dùng tự dán — chỉ lưu trong trình duyệt của họ. */
export function getBrowserKey(): string {
  try { return localStorage.getItem(KEY_STORE) ?? ''; } catch { return ''; }
}

export function useApiKey() {
  const [key, setKeyState] = useState('');
  useEffect(() => {
    const sync = () => setKeyState(getBrowserKey());
    sync();
    window.addEventListener(KEY_EVENT, sync);
    return () => window.removeEventListener(KEY_EVENT, sync);
  }, []);
  const setKey = useCallback((k: string) => {
    try {
      if (k) localStorage.setItem(KEY_STORE, k.trim());
      else localStorage.removeItem(KEY_STORE);
    } catch { /* bộ nhớ trình duyệt bị chặn */ }
    window.dispatchEvent(new Event(KEY_EVENT));
  }, []);
  return { key, setKey };
}

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

function requestBody(opts: AskOptions) {
  return {
    birthInfo: opts.birthInfo,
    messages: opts.messages ?? [],
    report: opts.report,
    year: opts.year,
    month: opts.month,
    partnerBirthInfo: opts.partnerBirthInfo,
  };
}

/** Gọi thẳng Claude từ trình duyệt bằng khóa của người dùng. */
async function askDirect(opts: AskOptions, apiKey: string): Promise<string> {
  const [{ default: Anthropic }, { buildAiRequest }] = await Promise.all([
    import('@anthropic-ai/sdk'),
    import('@/lib/ai-prompt'),
  ]);
  const built = buildAiRequest(requestBody(opts));
  if ('error' in built) throw new Error(built.error);

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  let full = '';
  try {
    const stream = client.beta.messages.stream(built.params, { signal: opts.signal });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        full += event.delta.text;
        opts.onDelta(full);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new Error('Mô hình từ chối trả lời yêu cầu này. Bạn thử diễn đạt lại câu hỏi nhé.');
    return full;
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) throw Object.assign(new Error('Đã dừng.'), { name: 'AbortError' });
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Khóa API không hợp lệ. Kiểm tra lại khóa trong mục "Kết nối AI".');
    if (err instanceof Anthropic.PermissionDeniedError) throw new Error('Khóa API không có quyền dùng model này.');
    if (err instanceof Anthropic.RateLimitError) throw new Error('AI đang quá tải hoặc tài khoản hết hạn mức, thử lại sau.');
    if (err instanceof Anthropic.BadRequestError) throw new Error(`Yêu cầu bị từ chối: ${err.message}`);
    if (err instanceof Anthropic.APIConnectionError) throw new Error('Không kết nối được tới Anthropic, kiểm tra mạng.');
    if (err instanceof Anthropic.APIError) throw new Error(`Lỗi AI (${err.status ?? 'mạng'}).`);
    throw err;
  }
}

/**
 * Gọi AI luận giải. Có khóa trong trình duyệt → gọi thẳng Claude;
 * không có → dùng API máy chủ (/api/interpret). Ném lỗi kèm thông điệp tiếng Việt.
 */
export async function askAI(opts: AskOptions): Promise<string> {
  const browserKey = getBrowserKey();
  if (browserKey) return askDirect(opts, browserKey);
  if (process.env.NEXT_PUBLIC_STATIC_DEMO) {
    throw new Error('Chưa kết nối AI. Dán khóa API Anthropic của bạn vào mục "Kết nối AI" (trang AI luận giải) để bắt đầu.');
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify(requestBody(opts)),
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
