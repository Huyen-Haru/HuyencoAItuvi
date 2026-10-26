'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/tuvi/Shell';
import ProfileForm from '@/components/tuvi/ProfileForm';
import Markdown from '@/components/tuvi/Markdown';
import { ScorePill } from '@/components/tuvi/DayDetail';
import { useProfiles, profileToBirthInfo, formatBirth } from '@/lib/profiles';
import { generateChart } from '@/lib/ziwei/algorithm';
import { yearPillar, compare } from '@/lib/hop-tuoi';
import { askAI } from '@/lib/ai-client';
import { indexChart, scoreDay } from '@/lib/lich/vanhan';

export default function HopTuoiPage() {
  const { profiles, active, ready, save } = useProfiles();
  const [aId, setAId] = useState<string>('');
  const [bId, setBId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [ai, setAi] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const a = profiles.find(p => p.id === (aId || active?.id)) ?? null;
  const b = profiles.find(p => p.id === bId) ?? profiles.find(p => p.id !== a?.id) ?? null;

  const result = useMemo(() => {
    if (!a || !b || a.id === b.id) return null;
    const ca = generateChart(profileToBirthInfo(a));
    const cb = generateChart(profileToBirthInfo(b));
    const pa = yearPillar(a.year, a.month, a.day);
    const pb = yearPillar(b.year, b.month, b.day);
    const now = new Date();
    const today = [ca, cb].map(c => scoreDay(indexChart(c), now.getFullYear(), now.getMonth() + 1, now.getDate()).score);
    return { pa, pb, today, ...compare(pa, pb, ca, cb) };
  }, [a, b]);

  const deep = async () => {
    if (!a || !b) return;
    setErr(''); setAi(''); setBusy(true);
    try {
      await askAI({ birthInfo: profileToBirthInfo(a), partnerBirthInfo: profileToBirthInfo(b), report: 'hop-tuoi', onDelta: setAi });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="grid gap-6">
        <div>
          <h1 className="tv-title text-2xl">Xem hợp tuổi · hợp lá số</h1>
          <p className="tv-muted text-sm">Dùng cho vợ chồng, người yêu, đối tác làm ăn hoặc các thành viên trong gia đình.</p>
        </div>

        {ready && profiles.length < 2 && !adding && (
          <div className="tv-card">
            <p className="mb-3">Cần ít nhất 2 hồ sơ để so sánh. Bạn đang có {profiles.length} hồ sơ.</p>
            <button className="tv-btn tv-btn-primary" onClick={() => setAdding(true)}>+ Thêm người</button>
          </div>
        )}
        {adding && (
          <div className="tv-card max-w-xl">
            <ProfileForm submitLabel="Lưu hồ sơ" onCancel={() => setAdding(false)}
              onSubmit={p => { const saved = save({ ...p, relation: p.relation === 'Bản thân' && profiles.length ? 'Vợ/Chồng' : p.relation }, profiles.length === 0); setBId(saved.id); setAdding(false); }} />
          </div>
        )}

        {profiles.length >= 2 && (
          <div className="tv-card grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="tv-label">Người thứ nhất (A)</label>
              <select className="tv-input" value={a?.id ?? ''} onChange={e => { setAId(e.target.value); setAi(''); }}>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.relation ?? ''}</option>)}
              </select>
            </div>
            <div className="text-2xl text-center pb-1" aria-hidden>⚭</div>
            <div>
              <label className="tv-label">Người thứ hai (B)</label>
              <select className="tv-input" value={b?.id ?? ''} onChange={e => { setBId(e.target.value); setAi(''); }}>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.relation ?? ''}</option>)}
              </select>
            </div>
            <button className="tv-btn sm:col-span-3 justify-self-start" onClick={() => setAdding(true)}>+ Thêm người khác</button>
          </div>
        )}

        {a && b && a.id === b.id && <p className="tv-muted">Hãy chọn hai người khác nhau.</p>}

        {result && a && b && (
          <div className="grid md:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
            <div className="tv-card text-center grid gap-3">
              <div className="text-sm tv-muted">Mức độ hòa hợp</div>
              <div className="text-5xl font-bold tv-accent">{result.score}<span className="text-xl">/100</span></div>
              <ScorePill score={result.score} big />
              <div className="grid grid-cols-2 gap-2 text-sm text-left mt-2">
                {[{ p: a, y: result.pa, t: result.today[0] }, { p: b, y: result.pb, t: result.today[1] }].map(({ p, y, t }) => (
                  <div key={p.id} className="rounded-lg p-2" style={{ background: 'var(--bg-1)' }}>
                    <div className="font-semibold">{p.name}</div>
                    <div className="tv-muted text-xs">{formatBirth(p)}</div>
                    <div className="text-xs mt-1">Tuổi {y.label}</div>
                    <div className="text-xs">Mệnh {y.napam}</div>
                    <div className="text-xs mt-1">Vận hôm nay: <b>{t}</b></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="tv-card">
                <h2 className="tv-title mb-3">Chi tiết</h2>
                <ul className="grid gap-3">
                  {result.items.map(it => (
                    <li key={it.label} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                      <div><b>{it.label}.</b> <span className="tv-muted">{it.detail}</span></div>
                      <span className={`self-start px-2 py-0.5 rounded-full text-xs font-semibold ${it.points > 0 ? 'tone-good' : it.points < 0 ? 'tone-worst' : 'tone-mid'}`}>
                        {it.points > 0 ? `+${it.points}` : it.points}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs tv-muted mt-3">Hợp tuổi chỉ là một góc nhìn; sự thấu hiểu và cách cư xử mới là điều quyết định.</p>
              </div>
              <div className="tv-card">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="tv-title">AI phân tích sâu hai lá số</h2>
                  <button className="tv-btn tv-btn-primary" onClick={deep} disabled={busy}>{busy ? 'Đang phân tích…' : '✦ Phân tích'}</button>
                </div>
                {err && <p className="text-sm" style={{ color: 'var(--worst)' }}>{err}</p>}
                {ai ? <Markdown text={ai} /> : !busy && <p className="text-sm tv-muted">AI sẽ đọc cả hai lá số (Mệnh, Phu Thê, Tứ Hóa…) để chỉ ra điểm hòa hợp, điểm cần dung hòa.</p>}
              </div>
            </div>
          </div>
        )}
        {ready && profiles.length === 0 && <p className="text-sm tv-muted">Hoặc tạo hồ sơ trong mục <Link className="tv-accent" href="/ho-so">Hồ sơ</Link>.</p>}
      </div>
    </Shell>
  );
}
