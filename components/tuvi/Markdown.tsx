/** Hiển thị markdown tối giản (tiêu đề, in đậm, gạch đầu dòng) — đủ cho văn bản AI luận giải. */
function inline(text: string, keyBase: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={`${keyBase}-${i}`}>{seg.slice(2, -2)}</strong>
      : <span key={`${keyBase}-${i}`}>{seg}</span>,
  );
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="grid gap-1.5 leading-relaxed text-[15px]" style={{ color: 'var(--tx-1)' }}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-1" />;
        const h = line.match(/^(#{1,4})\s+(.*)$/);
        if (h) {
          return <div key={i} className="tv-title mt-3" style={{ fontSize: h[1].length <= 2 ? 18 : 16, color: 'var(--ac)' }}>{inline(h[2], `h${i}`)}</div>;
        }
        const li = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        if (li) return <div key={i} className="pl-4 relative"><span className="absolute left-0 tv-accent">•</span>{inline(li[1], `l${i}`)}</div>;
        return <p key={i} className="[&_strong]:text-[color:var(--ac)]">{inline(line, `p${i}`)}</p>;
      })}
    </div>
  );
}
