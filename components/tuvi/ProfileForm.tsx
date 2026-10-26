'use client';
import { useMemo, useState } from 'react';
import type { Profile } from '@/lib/profiles';
import { clockToBranch } from '@/lib/profiles';
import { lunarToSolar, solarToLunar } from '@/lib/lich/amlich';
import { BRANCHES_VI, yearCanChi } from '@/lib/ziwei/vi';

export const RELATIONS = ['Bản thân', 'Vợ/Chồng', 'Con', 'Bố/Mẹ', 'Anh/Chị/Em', 'Người yêu', 'Đối tác', 'Khách hàng', 'Khác'];

type Draft = Omit<Profile, 'id' | 'createdAt'> & { id?: string };

interface Props {
  initial?: Profile | null;
  submitLabel?: string;
  onSubmit: (p: Draft) => void;
  onCancel?: () => void;
}

export default function ProfileForm({ initial, submitLabel = 'Lập lá số', onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(initial?.gender ?? 'male');
  const [calendar, setCalendar] = useState<'duong' | 'am'>('duong');
  const [day, setDay] = useState(initial ? String(initial.day) : '');
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [leap, setLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(initial ? initial.hour === null : false);
  const [hour, setHour] = useState(initial?.hour != null ? String(initial.hour) : '8');
  const [minute, setMinute] = useState(initial ? String(initial.minute) : '0');
  const [relation, setRelation] = useState(initial?.relation ?? 'Bản thân');
  const [place, setPlace] = useState(initial?.place ?? '');
  const [error, setError] = useState('');

  const solar = useMemo<[number, number, number] | null>(() => {
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!d || !m || !y || y < 1900 || y > 2100) return null;
    if (calendar === 'duong') {
      const dt = new Date(y, m - 1, d);
      return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? [d, m, y] : null;
    }
    if (d > 30 || m > 12) return null;
    const r = lunarToSolar(d, m, y, leap);
    if (!r) return null;
    // Ngày 30 không tồn tại ở tháng thiếu → kiểm tra lại
    const back = solarToLunar(r[0], r[1], r[2]);
    return back.day === d && back.month === m ? r : null;
  }, [day, month, year, calendar, leap]);

  const preview = useMemo(() => {
    if (!solar) return '';
    const [d, m, y] = solar;
    const l = solarToLunar(d, m, y);
    const h = unknownTime ? null : parseInt(hour);
    const gio = h === null || Number.isNaN(h) ? 'không rõ giờ' : `giờ ${BRANCHES_VI[clockToBranch(h)]}`;
    return `Dương lịch ${d}/${m}/${y} · Âm lịch ${l.day}/${l.month}${l.leap ? ' nhuận' : ''} năm ${yearCanChi(l.year)} · ${gio}`;
  }, [solar, hour, unknownTime]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Vui lòng nhập tên.');
    if (!solar) return setError(calendar === 'am' ? 'Ngày âm lịch không hợp lệ (kiểm tra tháng nhuận/tháng thiếu).' : 'Ngày sinh không hợp lệ.');
    const h = parseInt(hour), mi = parseInt(minute) || 0;
    if (!unknownTime && (Number.isNaN(h) || h < 0 || h > 23 || mi < 0 || mi > 59)) return setError('Giờ sinh không hợp lệ.');
    setError('');
    onSubmit({
      id: initial?.id,
      name: name.trim(),
      gender,
      day: solar[0], month: solar[1], year: solar[2],
      hour: unknownTime ? null : h,
      minute: unknownTime ? 0 : mi,
      relation,
      place: place.trim() || undefined,
      note: initial?.note,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="tv-label" htmlFor="pf-name">Họ tên</label>
          <input id="pf-name" className="tv-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn Hoàng" maxLength={60} />
        </div>
        <div>
          <span className="tv-label">Giới tính</span>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map(g => (
              <button type="button" key={g} className="tv-chip flex-1 justify-center !py-2" data-on={gender === g} onClick={() => setGender(g)}>
                {g === 'male' ? 'Nam' : 'Nữ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="tv-label !mb-0">Ngày sinh</span>
          <button type="button" className="tv-chip" data-on={calendar === 'duong'} onClick={() => setCalendar('duong')}>Dương lịch</button>
          <button type="button" className="tv-chip" data-on={calendar === 'am'} onClick={() => setCalendar('am')}>Âm lịch</button>
          {calendar === 'am' && (
            <label className="text-sm tv-muted flex items-center gap-1 ml-1">
              <input type="checkbox" checked={leap} onChange={e => setLeap(e.target.checked)} /> tháng nhuận
            </label>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="tv-input" inputMode="numeric" placeholder="Ngày" value={day} onChange={e => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Ngày" />
          <input className="tv-input" inputMode="numeric" placeholder="Tháng" value={month} onChange={e => setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Tháng" />
          <input className="tv-input" inputMode="numeric" placeholder="Năm" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} aria-label="Năm" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="tv-label !mb-0">Giờ sinh</span>
          <label className="text-sm tv-muted flex items-center gap-1">
            <input type="checkbox" checked={unknownTime} onChange={e => setUnknownTime(e.target.checked)} /> Không rõ giờ
          </label>
        </div>
        {!unknownTime && (
          <div className="grid grid-cols-2 gap-2">
            <select className="tv-input" value={hour} onChange={e => setHour(e.target.value)} aria-label="Giờ">
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')} giờ · {BRANCHES_VI[clockToBranch(h)]}</option>
              ))}
            </select>
            <select className="tv-input" value={minute} onChange={e => setMinute(e.target.value)} aria-label="Phút">
              {Array.from({ length: 12 }, (_, i) => i * 5).map(m => <option key={m} value={m}>{String(m).padStart(2, '0')} phút</option>)}
            </select>
          </div>
        )}
        {unknownTime && <p className="text-sm tv-muted">Khi không rõ giờ, lá số tạm an theo giờ Tý; phần cung và đại hạn có thể chưa chính xác.</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="tv-label" htmlFor="pf-rel">Quan hệ</label>
          <select id="pf-rel" className="tv-input" value={relation} onChange={e => setRelation(e.target.value)}>
            {RELATIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="tv-label" htmlFor="pf-place">Nơi sinh (tùy chọn)</label>
          <input id="pf-place" className="tv-input" value={place} onChange={e => setPlace(e.target.value)} placeholder="Ví dụ: Hải Dương" maxLength={60} />
        </div>
      </div>

      {preview && <p className="text-sm tv-accent">{preview}</p>}
      {error && <p className="text-sm" style={{ color: 'var(--worst)' }}>{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="tv-btn tv-btn-primary">{submitLabel}</button>
        {onCancel && <button type="button" className="tv-btn" onClick={onCancel}>Hủy</button>}
      </div>
    </form>
  );
}
