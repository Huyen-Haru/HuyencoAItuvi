'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: 'Mệnh Cách' },
  { key: 'love',        label: 'Tình Duyên' },
  { key: 'career',      label: 'Sự Nghiệp' },
  { key: 'wealth',      label: 'Tài Lộc' },
  { key: 'health',      label: 'Sức Khỏe' },
  { key: 'personality', label: 'Tính Cách' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy tổng quan mệnh cách theo cấu trúc sau:

**【Định Tính Mệnh Cách】**
Một câu tóm tắt cách cục cốt lõi và khí chất của người xem.

**【Luận Giải Chính Tinh】**
Đặc trưng cốt lõi của chính tinh Mệnh Cung, dẫn quan điểm Nghê Hải Hà.

**【Tam Phương Tứ Chính】**
Phân tích liên động Tài Bạch — Quan Lộc — Thiên Di và cách cục tổng thể.

**【Đại Hạn Hiện Tại】**
Hướng vận Đại Hạn hiện tại và điều cần quan tâm nhất.

**【Ưu Thế & Lưu Ý】**
Thiên phú của lá số và những rủi ro hoặc bài học cần chú ý.`,

  love: `Hãy phân tích sâu tình duyên hôn nhân theo cấu trúc sau:

**【Cách Cục Tình Duyên】**
Một câu định tính mệnh cách tình cảm.

**【Phân Tích Phu Thê Cung】**
Chính tinh, Tứ Hóa trong Phu Thê Cung theo hệ thống Nghê Hải Hà.

**【Tam Phương Liên Động】**
Ảnh hưởng của các cung liên quan đến tình cảm.

**【Tình Duyên Đại Hạn Hiện Tại】**
Xu hướng tình cảm 10 năm hiện tại và các mốc quan trọng.

**【Lời Khuyên Thực Tế】**
Gợi ý cụ thể, có thể áp dụng ngay.`,

  career: `Hãy phân tích sâu sự nghiệp theo cấu trúc sau:

**【Cách Cục Sự Nghiệp】**
Một câu định tính: phù hợp làm thuê hay khởi nghiệp.

**【Phân Tích Quan Lộc Cung】**
Chính tinh, Tứ Hóa trong Quan Lộc Cung theo Nghê Hải Hà.

**【Tài Bạch Cung Liên Động】**
Mối quan hệ tài vận — sự nghiệp, phân tích nguồn thu nhập.

**【Sự Nghiệp Đại Hạn Hiện Tại】**
Xu hướng sự nghiệp 10 năm hiện tại.

**【Lời Khuyên Thực Tế】**
Hướng đi, ngành nghề và chiến lược phù hợp.`,

  wealth: `Hãy phân tích sâu tài lộc theo cấu trúc sau:

**【Cách Cục Tài Vận】**
Một câu định tính: tài chủ động hay bị động.

**【Phân Tích Tài Bạch Cung】**
Chính tinh, Tứ Hóa trong Tài Bạch Cung, nguồn và dòng chảy tài phú.

**【Điền Trạch Cung (Tài Khố)】**
Khả năng tích lũy và vận bất động sản.

**【Tài Lộc Đại Hạn Hiện Tại】**
Xu hướng tài vận hiện tại và những điều cần lưu ý.

**【Lời Khuyên Tài Chính】**
Gợi ý quản lý tài chính cụ thể.`,

  health: `Hãy phân tích sức khỏe theo cấu trúc sau:

**【Chính Tinh Tật Ách Cung】**
Sao và ý nghĩa sức khỏe trong Tật Ách Cung.

**【Rủi Ro Chính】**
Dựa theo lý thuyết Tý Ngọ Lưu Chú của Nghê Hải Hà, phân tích ẩn họa sức khỏe và bộ phận cần chú ý.

**【Xu Hướng Sức Khỏe Đại Hạn】**
Chiều hướng sức khỏe hiện tại và thời điểm then chốt.

**【Lời Khuyên Phòng Ngừa】**
Điều cần chú ý và hướng dưỡng sinh cụ thể.`,

  personality: `Hãy phân tích sâu tính cách theo cấu trúc sau:

**【Chính Tinh Mệnh Cung & Tính Cách】**
Đặc trưng tính cách cốt lõi của chính tinh Mệnh Cung, dẫn lời Nghê Sư.

**【Tổng Hợp Tam Phương】**
Ảnh hưởng của Tài Bạch — Quan Lộc — Thiên Di đến tính cách toàn diện.

**【Mô Thức Quan Hệ】**
Cách tương tác với người khác, phong cách đối nhân xử thế.

**【Ưu Thế & Bài Học Cuộc Đời】**
Thiên phú trời cho và những bài học cần đối mặt.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   'bản thân, tính cách, tiên thiên cách cục',
  '兄弟宫': 'anh chị em, đối tác hợp tác',
  '夫妻宫': 'tình cảm, hôn nhân',
  '子女宫': 'con cái, thuộc cấp',
  '财帛宫': 'tài vận, nguồn thu nhập',
  '疾厄宫': 'sức khỏe, tai nạn',
  '迁移宫': 'cơ hội bên ngoài, giao tiếp',
  '交友宫': 'bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'sự nghiệp, địa vị xã hội',
  '田宅宫': 'bất động sản, môi trường gia đình',
  '福德宫': 'hưởng thụ tinh thần, phúc phận nội tâm',
  '父母宫': 'quan hệ cha mẹ, văn thư, hợp đồng',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : '空宫（借对宫）';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `Hãy phân tích trọng tâm【${selectedPalace.name}】(chủ quản: ${role}), chính tinh cung này là ${starDesc}, theo cấu trúc sau:

**【Định Tính Cung Vị】**
Ý nghĩa của ${selectedPalace.name} trong lá số và nhận định tổng thể về cấu hình sao này.

**【Luận Giải Chính Tinh】**
Phân tích chính tinh tại cung này theo hệ thống Nghê Hải Hà, dẫn quan điểm cụ thể.

**【Tam Phương Tứ Chính Liên Động】**
Ảnh hưởng của tam phương tứ chính lên cung này.

**【Lời Khuyên Thực Tế】**
Gợi ý cụ thể dựa trên cung vị này.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? '未知宫位';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại Hạn' : 'Lưu Niên';

    const prompt = `Hãy phân tích ảnh hưởng của【${viewLabel} ${selectedSiHua.starName} Hóa ${selectedSiHua.siHua}】theo cấu trúc sau:

**【Ý Nghĩa Hóa ${selectedSiHua.siHua}】**
Ý nghĩa cốt lõi của Hóa ${selectedSiHua.siHua} trong hệ thống Nghê Hải Hà và ý nghĩa đặc biệt của ${selectedSiHua.starName} Hóa ${selectedSiHua.siHua}.

**【Ảnh Hưởng Lạc Cung】**
${selectedSiHua.starName} Hóa ${selectedSiHua.siHua} rơi vào【${palaceName}】, lĩnh vực cung này bị ảnh hưởng thế nào theo Nghê Sư.

**【Đường Bay Tam Phương Tứ Chính】**
Sau khi Hóa ${selectedSiHua.siHua} nhập ${palaceName}, ảnh hưởng liên động đến đối cung và hai cung tam hợp.

**【Ảnh Hưởng Vận Thế Hiện Tại】**
Trong chiều thời gian ${viewLabel}, Hóa ${selectedSiHua.siHua} này ảnh hưởng cụ thể thế nào đến vận thế gần đây.

**【Lời Khuyên Thực Tế】**
Gợi ý có thể áp dụng ngay dựa trên tứ hóa này.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (!res.ok) throw new Error('请求失败');
      if (!res.body) throw new Error('无响应流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Luận giải thất bại, vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>命格解读生成中…</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  命理解读
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="继续追问，如：今年适合换工作吗？"
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : '追问'}
          </button>
        </div>
      </div>

    </div>
  );
}
