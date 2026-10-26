'use client';
import { useState } from 'react';
import { useApiKey } from '@/lib/ai-client';

/** Ô dán khóa API Anthropic — khóa chỉ lưu trong trình duyệt của người dùng. */
export default function ApiKeyCard() {
  const { key, setKey } = useApiKey();
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const hasServer = !process.env.NEXT_PUBLIC_STATIC_DEMO;

  const save = () => {
    const k = draft.trim();
    if (!k.startsWith('sk-ant-')) return setErr('Khóa Anthropic thường bắt đầu bằng "sk-ant-". Kiểm tra lại nhé.');
    setErr('');
    setKey(k);
    setDraft('');
  };

  return (
    <div className="tv-card grid gap-2">
      <h2 className="tv-title">Kết nối AI</h2>
      {key ? (
        <>
          <p className="text-sm" style={{ color: 'var(--great)' }}>✓ Đã lưu khóa của bạn (…{key.slice(-4)})</p>
          <button className="tv-btn" onClick={() => setKey('')}>Ngắt kết nối (xóa khóa)</button>
        </>
      ) : (
        <>
          <p className="text-sm tv-muted">
            {hasServer
              ? 'App đang dùng khóa của máy chủ (nếu có). Bạn cũng có thể dán khóa riêng.'
              : 'Dán khóa API Anthropic của bạn để bật AI luận giải.'}
          </p>
          <input className="tv-input" type="password" autoComplete="off" placeholder="sk-ant-…" value={draft}
            onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} aria-label="Khóa API Anthropic" />
          {err && <p className="text-xs" style={{ color: 'var(--worst)' }}>{err}</p>}
          <button className="tv-btn tv-btn-primary" onClick={save} disabled={!draft.trim()}>Lưu & kết nối</button>
          <a className="text-xs tv-accent underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
            Lấy khóa tại console.anthropic.com →
          </a>
        </>
      )}
      <p className="text-xs tv-muted">
        Khóa chỉ lưu trên trình duyệt này và gửi thẳng tới Anthropic, không qua máy chủ nào khác. Chi phí tính vào tài khoản Anthropic của bạn.
        Không dùng tính năng này trên máy tính công cộng.
      </p>
    </div>
  );
}
