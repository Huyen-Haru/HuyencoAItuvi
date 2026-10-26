'use client';
import { useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/tuvi/Shell';
import ProfileForm from '@/components/tuvi/ProfileForm';
import { useProfiles, formatBirth, type Profile } from '@/lib/profiles';
import { yearPillar } from '@/lib/hop-tuoi';

export default function HoSoPage() {
  const { profiles, active, ready, save, remove, select } = useProfiles();
  const [editing, setEditing] = useState<Profile | 'new' | null>(null);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tuvi-ho-so.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importAll = async (file: File) => {
    try {
      const list = JSON.parse(await file.text()) as Profile[];
      const existing = new Set(profiles.map(p => p.id));
      list.filter(p => p && p.name && p.year && p.month && p.day)
        .forEach(p => save({ ...p, id: existing.has(p.id) ? undefined : p.id }, false));
    } catch {
      alert('File không hợp lệ.');
    }
  };

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="tv-title text-2xl">Hồ sơ lá số</h1>
            <p className="tv-muted text-sm">Lưu lá số của bản thân, gia đình và khách hàng. Dữ liệu chỉ nằm trên trình duyệt này.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="tv-btn tv-btn-primary" onClick={() => setEditing('new')}>+ Thêm hồ sơ</button>
            <button className="tv-btn" onClick={exportAll} disabled={!profiles.length}>Xuất file sao lưu</button>
            <label className="tv-btn cursor-pointer">
              Nhập file
              <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && importAll(e.target.files[0])} />
            </label>
          </div>
        </div>

        {editing && (
          <div className="tv-card max-w-2xl">
            <h2 className="tv-title mb-4">{editing === 'new' ? 'Hồ sơ mới' : `Sửa: ${editing.name}`}</h2>
            <ProfileForm initial={editing === 'new' ? null : editing} submitLabel="Lưu hồ sơ"
              onCancel={() => setEditing(null)}
              onSubmit={p => { save(p, editing === 'new' || p.id === active?.id); setEditing(null); }} />
          </div>
        )}

        {ready && !profiles.length && !editing && (
          <div className="tv-card text-center py-10">
            <p className="mb-4">Chưa có hồ sơ nào.</p>
            <button className="tv-btn tv-btn-primary" onClick={() => setEditing('new')}>Tạo hồ sơ đầu tiên</button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => {
            const y = yearPillar(p.year, p.month, p.day);
            const isActive = p.id === active?.id;
            return (
              <div key={p.id} className="tv-card grid gap-2" style={isActive ? { borderColor: 'var(--ac)' } : undefined}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="tv-title text-lg">{p.name}</div>
                    <div className="text-xs tv-muted">{p.relation ?? 'Khác'} · {p.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                  </div>
                  {isActive && <span className="text-xs px-2 py-0.5 rounded-full tone-mid">Đang xem</span>}
                </div>
                <div className="text-sm">{formatBirth(p)}</div>
                <div className="text-sm tv-muted">Tuổi {y.label} · Mệnh {y.napam}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {!isActive && <button className="tv-btn !py-1 !text-xs" onClick={() => select(p.id)}>Chọn xem</button>}
                  <Link className="tv-btn !py-1 !text-xs" href="/la-so" onClick={() => select(p.id)}>Lá số</Link>
                  <Link className="tv-btn !py-1 !text-xs" href="/lich" onClick={() => select(p.id)}>Lịch</Link>
                  <button className="tv-btn !py-1 !text-xs" onClick={() => setEditing(p)}>Sửa</button>
                  <button className="tv-btn !py-1 !text-xs" onClick={() => confirm(`Xóa hồ sơ ${p.name}?`) && remove(p.id)}>Xóa</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
