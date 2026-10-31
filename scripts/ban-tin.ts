/**
 * Bản tin Tử Vi hằng ngày (Markdown) — không dùng AI, không tốn phí.
 *
 * Cách chạy:
 *   npx tsx scripts/ban-tin.ts --ten "Huyền" --ngay 6/10/1990 --gio 8:18 --gioi-tinh nu --ngay-mai
 * Tùy chọn:
 *   --gio khong-ro          không rõ giờ sinh
 *   --ngay-xem 2026-10-28   tính từ ngày này thay cho hôm nay (giờ Việt Nam)
 *   --ngay-mai              dự báo cho ngày hôm sau (dùng khi gửi buổi tối)
 *   --chi-tiet              thêm bảng 12 cung
 *   --json                  in dữ liệu phân tích dạng JSON thay cho Markdown
 *   --web https://...       địa chỉ trang web (mặc định GitHub Pages của dự án)
 */
import { generateChart } from '@/lib/ziwei/algorithm';
import { profileToBirthInfo, type Profile } from '@/lib/profiles';
import { indexChart, scoreLabel } from '@/lib/lich/vanhan';
import { buildBrief, verdictOf, DOMAIN_DEFS } from '@/lib/lich/phan-tich';
import { suggestForPalace, pickDomainPalace } from '@/lib/lich/de-xuat';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const flag = (name: string) => process.argv.includes(`--${name}`);

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
const gt = (arg('gioi-tinh') ?? 'nam').toLowerCase();
const gender = ['nu', 'nữ', 'female'].includes(gt) ? 'female' : 'male';
const web = (arg('web') ?? 'https://huyen-haru.github.io/HuyencoAItuvi').replace(/\/$/, '');

const profile: Profile = {
  id: 'cli', name: ten, gender, year: y, month: m, day: d,
  hour: hh, minute: mm ?? 0, createdAt: 0,
};

// Ngày xem: mặc định hôm nay theo giờ Việt Nam, +1 nếu --ngay-mai
const todayVN = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const [ty, tm, td] = (arg('ngay-xem') ?? todayVN).split('-').map(Number);
const tomorrow = flag('ngay-mai');
const view = new Date(ty, tm - 1, td + (tomorrow ? 1 : 0));
const [vy, vm, vd] = [view.getFullYear(), view.getMonth() + 1, view.getDate()];

const idx = indexChart(generateChart(profileToBirthInfo(profile)));
const b = buildBrief(idx, vy, vm, vd);

const pad = (n: number) => String(n).padStart(2, '0');
const params = new URLSearchParams({
  ten, ns: `${y}-${pad(m)}-${pad(d)}`, gio: hh === null ? 'khong-ro' : `${pad(hh)}:${pad(mm ?? 0)}`,
  gt: gender === 'female' ? 'nu' : 'nam', ngay: `${vy}-${pad(vm)}-${pad(vd)}`,
});
const link = `${web}/ban-tin/?${params.toString()}`;

if (flag('json')) {
  const { ds, ...rest } = b;
  console.log(JSON.stringify({ ten, link, score: ds.score, label: scoreLabel(ds.score).text, ...rest }, null, 2));
  process.exit(0);
}

const dot = (s: number) => (s >= 66 ? '🟢' : s >= 58 ? '🟩' : s >= 48 ? '🟡' : s >= 40 ? '🟠' : '🔴');
const KP_ICON = { 'co-hoi': '✨', 'luu-y': '⚠️', 'nen-lam': '🎯' } as const;

const out: string[] = [];
out.push(`# ${tomorrow ? '🌙 Ngày mai' : '☀️ Hôm nay'} của ${ten}`);
out.push(`**${b.dateLabel}** · ${b.lunarLine}`);
out.push('');
out.push(`> ### ${dot(b.ds.score)} ${b.ds.score}/100 · ${scoreLabel(b.ds.score).text}`);
out.push(`> ${b.theme}`);
out.push('');
out.push('---');
out.push('### 🔑 3 điều cần biết');
b.keyPoints.forEach(k => {
  out.push(`${KP_ICON[k.kind]} **${k.title}**`);
  out.push(`${k.text}`);
  out.push('');
});
out.push('---');
out.push('### 📊 Từng lĩnh vực');
for (const dm of b.domains) {
  out.push(`${dot(dm.score)} **${dm.icon} ${dm.label} · ${dm.score} · ${dm.verdict}**`);
  out.push(`${dm.why}`);
  out.push(`👉 ${dm.action}`);
  // Đề xuất cụ thể theo lá số (2 ý đầu của nhóm "Đề xuất …")
  const keys = DOMAIN_DEFS.find(x => x.key === dm.key)!.palaces;
  const pd = pickDomainPalace(dm.score, keys.map(k => b.palaces.find(x => x.key === k)!).filter(Boolean));
  if (pd) {
    const groups = suggestForPalace(idx, pd.key, { score: pd.score, factors: pd.factors, scope: 'ngay', job: b.job });
    const g = groups.find(x => x.title.startsWith('Đề xuất')) ?? groups[0];
    for (const it of (g?.items ?? []).slice(0, 2)) out.push(`💡 ${it}`);
  }
  // Sức khỏe: luôn kèm bộ phận nên kiểm tra theo cung Tật Ách
  if (dm.key === 'suc-khoe') {
    const ta = b.palaces.find(x => x.key === '疾厄');
    const check = ta && suggestForPalace(idx, '疾厄', { score: ta.score, factors: ta.factors, scope: 'ngay' }).find(x => x.title.startsWith('Nên kiểm tra'));
    if (check) out.push(`🩺 ${check.items[0]}`);
  }
  out.push('');
}
out.push('---');
out.push('### ⏰ Giờ đẹp trong ngày');
for (const h of b.hours.filter(x => x.good)) out.push(`- **${h.range}** (giờ ${h.name}): ${h.suggestion}`);
out.push(`- ⛔ Tránh: ${b.calendar.kieng.join(', ').toLowerCase()}`);
out.push('');
out.push(`_Trực ${b.calendar.truc} (${b.calendar.trucQuality}) · ${b.calendar.than}, ${b.calendar.hoangDao ? 'Hoàng đạo' : 'Hắc đạo'} · Sao ${b.calendar.sao} (${b.calendar.saoTot ? 'tốt' : 'xấu'}) · Xung tuổi ${b.calendar.xung}_`);
out.push('');

if (flag('chi-tiet')) {
  out.push('---');
  out.push('### 🔮 12 cung hôm đó');
  const sorted = [...b.palaces].sort((a, c) => c.score - a.score);
  out.push(sorted.map(p => `${dot(p.score)} ${p.name} **${p.score}**`).join(' · '));
  out.push('');
}

out.push('---');
out.push(`### 💼 Công việc tháng ${b.job.lunarMonth} âm: ${b.job.label}`);
out.push(`Chủ động **${b.job.chuDong}** · Bị động **${b.job.biDong}**. ${b.job.reasons[0] ?? ''}`);
if (b.job.keyMonth) out.push(`📌 Tháng then chốt sắp tới: **tháng ${b.job.keyMonth.lunarMonth} âm**, ${b.job.keyMonth.label.toLowerCase()}.`);
out.push('');
out.push('### 📅 7 ngày tới');
out.push(b.week.map(w => `${w.short} ${dot(w.score)}${w.score}${w.isBest ? '⭐' : ''}`).join(' · '));
const best = b.week.find(w => w.isBest)!;
const worst = b.week.find(w => w.isWorst)!;
out.push(`Đẹp nhất **${best.label}** (${best.score}, ${verdictOf(best.score).toLowerCase()}) · Cẩn trọng **${worst.label}** (${worst.score}).`);
out.push('');
out.push(`👉 **[Mở bản tin đầy đủ: chi tiết từng cung, tổng quan tháng và năm](${link})**`);

console.log(out.join('\n'));
