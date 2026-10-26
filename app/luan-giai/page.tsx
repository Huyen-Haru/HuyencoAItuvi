'use client';
import { useEffect, useRef, useState } from 'react';
import Shell from '@/components/tuvi/Shell';
import RequireProfile from '@/components/tuvi/RequireProfile';
import Markdown from '@/components/tuvi/Markdown';
import ApiKeyCard from '@/components/tuvi/ApiKeyCard';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { profileToBirthInfo, type Profile } from '@/lib/profiles';
import { askAI, type ChatMsg } from '@/lib/ai-client';
import { solarToLunar } from '@/lib/lich/amlich';
import { yearCanChi } from '@/lib/ziwei/vi';

const SUGGESTIONS = [
  'Năm nay tôi có nên đổi việc không?',
  'Tình duyên của tôi khi nào thuận lợi?',
  'Tôi hợp làm nghề gì nhất?',
  'Sức khỏe cần chú ý điều gì?',
  'Tháng nào trong năm nay tốt để đầu tư?',
  'Điểm mạnh và điểm yếu lớn nhất trong lá số của tôi?',
];

const storeKey = (id: string) => `tuvi_ai_v1_${id}`;

function AiView({ profile }: { profile: Profile; chart: ZiweiChart }) {
  const now = new Date();
  const lunarNow = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(lunarNow.month);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey(profile.id));
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* bỏ qua */ }
  }, [profile.id]);

  useEffect(() => {
    if (busy) return;
    try { localStorage.setItem(storeKey(profile.id), JSON.stringify(messages.slice(-40))); } catch { /* bỏ qua */ }
  }, [messages, busy, profile.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]);

  const run = async (userText: string, report?: { key: string; year?: number; month?: number }) => {
    if (busy) return;
    setError('');
    const history = [...messages, { role: 'user' as const, content: userText }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await askAI({
        birthInfo: profileToBirthInfo(profile),
        // Báo cáo: server tự thêm yêu cầu chi tiết, chỉ gửi lịch sử trước đó
        messages: report ? messages : history,
        report: report?.key,
        year: report?.year,
        month: report?.month,
        signal: ctrl.signal,
        onDelta: text => setMessages([...history, { role: 'assistant', content: text }]),
      });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setMessages(history.slice(0, -1));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    run(q);
  };

  const download = () => {
    const text = messages.map(m => (m.role === 'user' ? `## ❓ ${m.content}` : m.content)).join('\n\n');
    const blob = new Blob([`# Luận giải Tử Vi – ${profile.name}\n\n${text}\n`], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `LuanGiai_${profile.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
      <aside className="grid gap-4 no-print">
        <ApiKeyCard />
        <div className="tv-card grid gap-3">
          <h2 className="tv-title">Báo cáo một chạm</h2>
          <button className="tv-btn justify-start" disabled={busy} onClick={() => run('Luận tổng quan lá số của tôi', { key: 'tong-quan' })}>🔮 Tổng quan lá số</button>
          <button className="tv-btn justify-start" disabled={busy} onClick={() => run('Luận đại hạn 10 năm hiện tại', { key: 'dai-han' })}>🧭 Đại hạn hiện tại</button>
          <div className="flex gap-2">
            <select className="tv-input !py-1.5" value={reportYear} onChange={e => setReportYear(Number(e.target.value))} aria-label="Năm">
              {[0, 1, 2].map(i => now.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y} · {yearCanChi(y)}</option>)}
            </select>
          </div>
          <button className="tv-btn justify-start" disabled={busy} onClick={() => run(`Luận vận hạn năm ${reportYear}`, { key: 'nam', year: reportYear })}>📅 Vận hạn năm {reportYear}</button>
          <div className="flex gap-2 items-center">
            <select className="tv-input !py-1.5" value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} aria-label="Tháng âm">
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1} âm</option>)}
            </select>
          </div>
          <button className="tv-btn justify-start" disabled={busy} onClick={() => run(`Luận tháng ${reportMonth} âm lịch năm ${reportYear}`, { key: 'thang', year: reportYear, month: reportMonth })}>🌙 Vận tháng {reportMonth} âm</button>
        </div>
        <div className="tv-card grid gap-2">
          <h2 className="tv-title">Lưu & chia sẻ</h2>
          <button className="tv-btn" disabled={!messages.length || busy} onClick={() => window.print()}>In / Lưu PDF</button>
          <button className="tv-btn" disabled={!messages.length || busy} onClick={download}>Tải file văn bản (.md)</button>
          <button className="tv-btn" disabled={!messages.length || busy} onClick={() => setMessages([])}>Xóa cuộc trò chuyện</button>
        </div>
      </aside>

      <section className="grid gap-4">
        <div>
          <h1 className="tv-title text-2xl">AI luận giải cho {profile.name}</h1>
          <p className="tv-muted text-sm no-print">AI đọc toàn bộ lá số (14 chính tinh, phụ tinh, Tứ Hóa, Tuần/Triệt, đại hạn, lưu niên) rồi trả lời bằng tiếng Việt.</p>
        </div>

        {messages.length === 0 && (
          <div className="tv-card no-print">
            <p className="mb-3">Chọn một báo cáo bên trái, hoặc hỏi bất cứ điều gì:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => <button key={s} className="tv-chip" onClick={() => run(s)}>{s}</button>)}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            {m.role === 'user'
              ? <div className="rounded-2xl px-4 py-2 max-w-[85%] tone-mid">{m.content}</div>
              : <div className="tv-card">{m.content ? <Markdown text={m.content} /> : <span className="tv-muted">Đang luận giải…</span>}</div>}
          </div>
        ))}
        {error && <div className="tv-card tone-worst text-sm">{error}</div>}
        <div ref={endRef} />

        <div className="tv-card !p-3 flex gap-2 sticky bottom-3 no-print">
          <textarea className="tv-input resize-none" rows={2} value={input} placeholder="Đặt câu hỏi về lá số của bạn…"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} maxLength={1500} />
          {busy
            ? <button className="tv-btn" onClick={() => abortRef.current?.abort()}>Dừng</button>
            : <button className="tv-btn tv-btn-primary" onClick={send} disabled={!input.trim()}>Gửi</button>}
        </div>
      </section>
    </div>
  );
}

export default function LuanGiaiPage() {
  return (
    <Shell>
      <RequireProfile title="AI luận giải lá số">
        {ctx => <AiView key={ctx.profile.id} {...ctx} />}
      </RequireProfile>
    </Shell>
  );
}
