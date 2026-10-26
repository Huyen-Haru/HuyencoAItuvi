'use client';
import { useMemo } from 'react';
import { useProfiles, profileToBirthInfo, type Profile } from '@/lib/profiles';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { ZiweiChart } from '@/lib/ziwei/types';
import ProfileForm from './ProfileForm';

/** Hiển thị form tạo hồ sơ nếu chưa có; có rồi thì render children với lá số của hồ sơ đang chọn. */
export default function RequireProfile({
  title,
  children,
}: {
  title: string;
  children: (ctx: { profile: Profile; chart: ZiweiChart }) => React.ReactNode;
}) {
  const { active, ready, save } = useProfiles();
  const chart = useMemo(() => (active ? generateChart(profileToBirthInfo(active)) : null), [active]);

  if (!ready) return <div className="tv-muted py-20 text-center">Đang tải…</div>;

  if (!active || !chart) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="tv-title text-2xl mb-1">{title}</h1>
        <p className="tv-muted mb-6">Nhập ngày giờ sinh để bắt đầu. Hồ sơ được lưu ngay trên trình duyệt của bạn.</p>
        <div className="tv-card"><ProfileForm onSubmit={p => save(p)} /></div>
      </div>
    );
  }
  return <>{children({ profile: active, chart })}</>;
}
