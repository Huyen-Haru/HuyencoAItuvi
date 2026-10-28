/**
 * Bản tin Tử Vi hằng ngày (Markdown) — không dùng AI, không tốn phí.
 *
 * Cách chạy:
 *   npx tsx scripts/ban-tin.ts --ten "Hoàng" --ngay 3/6/1990 --gio 9:30 --gioi-tinh nam
 * Tùy chọn:
 *   --gio khong-ro          không rõ giờ sinh
 *   --ngay-xem 2026-10-28   xem cho ngày khác (mặc định: hôm nay theo giờ Việt Nam)
 *   --link https://...      link mở trang web chi tiết
 */
import { generateChart } from '@/lib/ziwei/algorithm';
import { profileToBirthInfo, type Profile } from '@/lib/profiles';
import { indexChart, scoreDay, scoreLabel, DOMAINS, ACTIVITIES, activityScore } from '@/lib/lich/vanhan';
import { WEEKDAYS_VI, lunarLabel } from '@/lib/lich/ngay';
import { jobTrend, jobTrendYear } from '@/lib/lich/cong-viec';
import { BRANCHES_VI, yearCanChi } from '@/lib/ziwei/vi';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const ten = arg('ten') ?? 'Bạn';
const ngay = arg('ngay') ?? fail('Thiếu --ngay (ngày sinh dương lịch, dạng d/m/yyyy).');
const [d, m, y] = ngay.split('/').map(Number);
if (!d || !m || !y) fail('--ngay phải có dạng d/m/yyyy.');
const gio = arg('gio') ?? 'khong-ro';
const [hh, mm] = gio === 'khong-ro' ? [null, 0] : gio.split(':').map(Number);
const gender = ['nu', 'nữ', 'female'].includes((arg('gioi-tinh') ?? 'nam').toLowerCase()) ? 'female' : 'male';
const link = arg('link') ?? 'https://huyen-haru.github.io/HuyencoAItuvi/lich/';

const profile: Profile = {
  id: 'cli', name: ten, gender, year: y, month: m, day: d,
  hour: hh, minute: mm ?? 0, createdAt: 0,
};

// Ngày xem: mặc định hôm nay theo giờ Việt Nam
const viewArg = arg('ngay-xem');
const todayVN = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const [vy, vm, vd] = (viewArg ?? todayVN).split('-').map(Number);

const idx = indexChart(generateChart(profileToBirthInfo(profile)));
const ds = scoreDay(idx, vy, vm, vd);
const { info } = ds;
const lab = scoreLabel(ds.score);

const dot = (s: number) => (s >= 72 ? '🟢' : s >= 60 ? '🟩' : s >= 45 ? '🟨' : s >= 33 ? '🟧' : '🟥');
const bar = (s: number) => '█'.repeat(Math.round(s / 10)) + '░'.repeat(10 - Math.round(s / 10));

// 7 ngày tới
const next7 = Array.from({ length: 7 }, (_, i) => {
  const t = new Date(vy, vm - 1, vd + 1 + i);
  return scoreDay(idx, t.getFullYear(), t.getMonth() + 1, t.getDate());
});
const best = [...next7].sort((a, b) => b.score - a.score).slice(0, 3);
const worst = [...next7].sort((a, b) => a.score - b.score)[0];

// Việc hợp nhất hôm nay
const acts = ACTIVITIES.map(a => ({ a, s: activityScore(ds, a) })).sort((p, q) => q.s - p.s);

// Công việc: tháng âm hiện tại + tháng then chốt còn lại trong năm âm
const job = jobTrend(idx, info.lunar.year, info.lunar.month);
const yearJobs = jobTrendYear(idx, info.lunar.year).filter(j => j.lunarMonth >= info.lunar.month);
const keyMonth = [...yearJobs].sort((a, b) => b.chuDong + b.biDong - (a.chuDong + a.biDong))[0];

const fmtDay = (x: typeof ds) => `${WEEKDAYS_VI[x.info.weekday]} ${x.info.d}/${x.info.m} (ÂL ${lunarLabel(x.info.lunar)})`;

const out: string[] = [];
out.push(`# ☯ Bản tin Tử Vi · ${WEEKDAYS_VI[info.weekday]} ${info.d}/${info.m}/${info.y}`);
out.push(`**${ten}** · Âm lịch ${lunarLabel(info.lunar)} năm ${yearCanChi(info.lunar.year)} · Ngày ${info.canChiNgay} · Tháng ${info.canChiThang}${info.tietKhi ? ` · Tiết ${info.tietKhi}` : ''}`);
out.push('');
out.push(`## ${dot(ds.score)} Vận ngày: ${ds.score}/100 — ${lab.text}`);
out.push('');
for (const dm of DOMAINS) out.push(`- ${dm.icon} ${dm.label}: \`${bar(ds.domains[dm.key])}\` ${ds.domains[dm.key]}`);
out.push('');
out.push(`**Lịch ngày:** Trực ${info.truc.name} (${info.truc.quality === 'tot' ? 'tốt' : info.truc.quality === 'xau' ? 'xấu' : 'bình'}) · ${info.than.name} ${info.than.hoangDao ? '— Hoàng đạo' : '— Hắc đạo'} · Sao ${info.sao28.name} (${info.sao28.tot ? 'tốt' : 'xấu'}) · Xung tuổi ${BRANCHES_VI[info.xungBranch]}`);
out.push(`**✅ Nên:** ${info.truc.nen.join(', ')}`);
out.push(`**⛔ Tránh:** ${info.truc.kieng.join(', ')}`);
out.push(`**🕐 Giờ hoàng đạo:** ${info.gioHoangDao.map(g => `${g.name} ${g.range}`).join(', ')}`);
out.push(`**🎯 Hợp nhất hôm nay:** ${acts.slice(0, 2).map(x => `${x.a.label} (${x.s})`).join(', ')} · **Kém nhất:** ${acts[acts.length - 1].a.label} (${acts[acts.length - 1].s})`);
out.push('');
out.push(`**Cung ứng ngày:** ${ds.palaceName} — ${ds.palaceStars}.`);
for (const n of ds.notes) out.push(`- ${n}`);
out.push('');
out.push(`## 💼 Công việc tháng ${job.lunarMonth} âm (${job.monthCanChi}): ${job.label}`);
out.push(`Chủ động ${job.chuDong} điểm · Bị động ${job.biDong} điểm`);
for (const r of job.reasons) out.push(`- ${r}`);
if (keyMonth && keyMonth.lunarMonth !== job.lunarMonth && keyMonth.chuDong + keyMonth.biDong > job.chuDong + job.biDong) {
  out.push(`- 📌 Tháng then chốt sắp tới: **tháng ${keyMonth.lunarMonth} âm** — ${keyMonth.label.toLowerCase()} (chủ động ${keyMonth.chuDong} · bị động ${keyMonth.biDong}).`);
}
out.push('');
out.push('## 📅 7 ngày tới');
out.push(`- Đẹp nhất: ${best.map(b => `${fmtDay(b)} ${dot(b.score)} ${b.score}`).join(' · ')}`);
out.push(`- Cần cẩn trọng: ${fmtDay(worst)} ${dot(worst.score)} ${worst.score}`);
out.push('');
out.push(`[Mở lịch chi tiết](${link})`);
out.push('');
out.push('_Bản tin tính tự động theo lá số và lịch vạn niên, mang tính tham khảo._');

console.log(out.join('\n'));
