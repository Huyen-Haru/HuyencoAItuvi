'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Shell from '@/components/tuvi/Shell';
import { ScorePill } from '@/components/tuvi/DayDetail';
import { useProfiles, profileToBirthInfo } from '@/lib/profiles';
import { generateChart } from '@/lib/ziwei/algorithm';
import { indexChart, scoreDay, DOMAINS } from '@/lib/lich/vanhan';
import { getDayInfo, WEEKDAYS_VI, lunarLabel } from '@/lib/lich/ngay';

const FEATURES = [
  { href: '/la-so', icon: '☯', title: 'Lá số Tử Vi đầy đủ', text: '14 chính tinh, phụ tinh, miếu/vượng/hãm, Tứ Hóa, Tuần/Triệt, Tràng Sinh, đại hạn 10 năm, lưu niên. Bấm cung để xem tam phương tứ chính.' },
  { href: '/lich', icon: '📅', title: 'Lịch vận hạn cá nhân', text: 'Điểm từng ngày theo lá số riêng, 12 Trực, Hoàng/Hắc đạo, giờ tốt, lọc ngày ký hợp đồng, khai trương, cưới hỏi…' },
  { href: '/luan-giai', icon: '✦', title: 'AI luận giải', text: 'Báo cáo tổng quan, đại hạn, năm, tháng chỉ với một chạm. Hỏi đáp tự do bằng tiếng Việt, in hoặc lưu PDF.' },
  { href: '/hop-tuoi', icon: '⚭', title: 'Hợp tuổi · hợp lá số', text: 'Nạp âm, thiên can, địa chi, đối chiếu Mệnh – Phu Thê, kèm AI phân tích cho vợ chồng, đối tác.' },
  { href: '/ho-so', icon: '👪', title: 'Hồ sơ gia đình & khách hàng', text: 'Lưu nhiều lá số, chuyển nhanh giữa các thành viên, sao lưu và nhập lại bằng một file.' },
  { href: '/nhat-ky', icon: '📝', title: 'Nhật ký dự báo vs thực tế', text: 'Ghi lại điều xảy ra mỗi ngày, xem tỉ lệ dự báo khớp với thực tế của chính bạn.' },
];

function TodaySnapshot() {
  const { active, ready } = useProfiles();
  const now = new Date();
  // Ngày giờ lấy theo máy người dùng: chỉ hiển thị sau khi tải xong ở trình duyệt
  if (!ready) return <div className="tv-card min-h-[220px]" />;
  return <TodayCard active={active} now={now} />;
}

function TodayCard({ active, now }: { active: ReturnType<typeof useProfiles>['active']; now: Date }) {
  const info = getDayInfo(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const ds = useMemo(() => {
    if (!active) return null;
    const idx = indexChart(generateChart(profileToBirthInfo(active)));
    return scoreDay(idx, now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tv-card grid gap-3">
      <div className="text-xs uppercase tracking-wider tv-accent font-semibold">Hôm nay</div>
      <div className="tv-title text-xl">{WEEKDAYS_VI[info.weekday]}, {info.d}/{info.m}/{info.y}</div>
      <div className="text-sm tv-muted">Âm lịch {lunarLabel(info.lunar)} · Ngày {info.canChiNgay} · Trực {info.truc.name} · {info.than.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'}</div>
      {ds && active && (
        <>
          <div className="flex items-center gap-2 text-sm">Vận ngày của <b>{active.name}</b>: <ScorePill score={ds.score} /></div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {DOMAINS.map(d => (
              <div key={d.key} className="rounded-md p-1.5 text-center" style={{ background: 'var(--bg-1)' }}>
                {d.icon} {d.label}<div className="font-bold text-sm">{ds.domains[d.key]}</div>
              </div>
            ))}
          </div>
          <Link href="/lich" className="tv-btn self-start">Xem chi tiết →</Link>
        </>
      )}
      {!active && (
        <>
          <p className="text-sm">Nhập ngày giờ sinh để xem vận ngày theo lá số riêng của bạn.</p>
          <Link href="/la-so" className="tv-btn tv-btn-primary self-start">Lập lá số miễn phí</Link>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Shell>
      <section className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-center py-6 lg:py-12">
        <div>
          <p className="tv-accent font-semibold text-sm tracking-wider uppercase mb-3">Tử Vi Đầu Số · AI tiếng Việt</p>
          <h1 className="tv-title text-4xl sm:text-5xl leading-tight mb-4">Hiểu lá số của mình,<br />chọn đúng thời điểm.</h1>
          <p className="text-lg tv-muted mb-6 max-w-xl">
            Lập lá số chuẩn, xem vận hạn từng ngày theo chính lá số của bạn, hỏi AI mọi điều về sự nghiệp, tài lộc, tình duyên và gia đạo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/la-so" className="tv-btn tv-btn-primary !px-6 !py-3 text-base">Lập lá số ngay</Link>
            <Link href="/lich" className="tv-btn !px-6 !py-3 text-base">Xem lịch vận hạn</Link>
          </div>
        </div>
        <TodaySnapshot />
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
        {FEATURES.map(f => (
          <Link key={f.href} href={f.href} className="tv-card hover:border-[color:var(--ac)] transition-colors grid gap-2">
            <div className="text-2xl" aria-hidden>{f.icon}</div>
            <div className="tv-title text-lg">{f.title}</div>
            <p className="text-sm tv-muted">{f.text}</p>
          </Link>
        ))}
      </section>

      <section className="tv-card my-6 grid gap-2">
        <h2 className="tv-title text-lg">Cách app tính vận ngày</h2>
        <p className="text-sm tv-muted">
          Mỗi ngày ứng với một cung trên lá số (theo địa chi của ngày). App đánh giá độ sáng của chính tinh, cát tinh, sát tinh và Tứ Hóa gốc trong cung đó,
          cộng thêm Tứ Hóa theo can ngày rơi vào cung nào, thêm nền vận của tháng âm, rồi kết hợp lịch vạn niên (12 Trực, Hoàng/Hắc đạo, Nhị thập bát tú) và quan hệ xung hợp với tuổi.
          Điểm số mang tính tham khảo, giúp bạn chủ động sắp xếp việc, không thay thế quyết định của chính bạn.
        </p>
      </section>
    </Shell>
  );
}
