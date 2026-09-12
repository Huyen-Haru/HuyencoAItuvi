from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Tử vi Mr Hoàng" / "THANG-09-12-AM-BINH-NGO-2026.md"

CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
BASE_DATE = date(2026, 1, 29)
MONTHS = [
    (9, "Tuất", date(2026, 10, 11), 29, "Tử Tức", "Vũ Khúc miếu, Hóa Quyền, Long Trì, Thanh Long, Hoa Cái"),
    (10, "Hợi", date(2026, 11, 9), 30, "Phu Thê", "Thái Dương hãm, Hóa Lộc, Nguyệt Đức, Tiểu Hao"),
    (11, "Tý", date(2026, 12, 9), 29, "Huynh Đệ", "Phá Quân miếu, Thiên Khốc, Thiên Hư, Thiên Giải, Tướng Quân"),
    (12, "Sửu", date(2027, 1, 7), 30, "Mệnh", "Thiên Cơ đắc, Thiên Hình, Hóa Quyền, Lưu Hóa Quyền, Long Đức"),
]


def day_gan_chi(day):
    offset = (day - BASE_DATE).days
    return CAN[(4 + offset + 600) % 10], CHI[(8 + offset + 600) % 12]


def daily_advice(month_branch, day_branch):
    if day_branch == month_branch:
        return "Rất tốt", f"Chi {day_branch} kích hoạt trực tiếp cung {month_branch}; ưu tiên việc chính của tháng, nhưng chốt bằng văn bản."
    if day_branch in {"Tỵ", "Dậu", "Sửu"} and month_branch in {"Tỵ", "Dậu", "Sửu"}:
        return "Tốt", f"Tam hợp Kim hỗ trợ trục Mệnh–Quan–Tài; hợp đàm phán, thu tiền và hoàn thiện kế hoạch."
    if day_branch in {"Dần", "Ngọ", "Tuất"} and month_branch in {"Dần", "Ngọ", "Tuất"}:
        return "Khá", "Tam hợp Hỏa làm việc nhanh hơn; hợp thúc tiến độ nhưng không nên nóng vội về tiền."
    if day_branch == CHI[(CHI.index(month_branch) + 6) % 12]:
        return "Cẩn trọng", f"Chi {day_branch} xung cung lưu nguyệt {month_branch}; giảm ký việc lớn và kiểm tra tiền, người, giấy tờ."
    if day_branch == CHI[(CHI.index(month_branch) + 3) % 12] or day_branch == CHI[(CHI.index(month_branch) - 3) % 12]:
        return "Khá", "Có động lực xử lý việc tồn; nên đi từng bước, tránh phản ứng theo tin chưa kiểm chứng."
    return "Khá", "Làm việc thường nhật, rà soát tiến độ và giữ nhịp sức khỏe; chưa cần quyết định mạo hiểm."


MONTH_TEXT = {
    9: ("Tử Tức Tuất", "Tháng của dự án tâm huyết, con cái và quyết định dài hạn. Vũ Khúc miếu cùng Hóa Quyền giúp Hoàng quyết đoán, quản trị tốt và đưa việc đã chuẩn bị đến mốc rõ ràng.", "Tuất tam hợp Dần–Ngọ, kéo Phụ Mẫu và Nô Bộc vào việc tiền; có người nâng đỡ nhưng vẫn phải kiểm soát nhân sự. Tuất xung Điền Trạch Thìn, không nên buông lỏng tài sản, mặt bằng và nhà cửa.", "Ưu tiên nghiệm thu, đặt KPI, xin hỗ trợ từ người có vị thế. Tránh mua bán bất động sản vội và tránh giao dự án cho người không có trách nhiệm rõ."),
    10: ("Phu Thê Hợi", "Tháng tốt cho hôn nhân, gia đình, hòa giải và chia sẻ thành quả. Thái Dương, Hóa Lộc và Nguyệt Đức làm mềm các căng thẳng, thích hợp sắp xếp lại lịch sống và ngân sách gia đình.", "Hợi tam hợp Mão–Mùi, hội Phúc Đức và Thiên Di; đi xa, nghỉ ngơi và gặp quý nhân có lợi. Hợi xung Quan Lộc Tỵ, nên tách việc công khỏi chuyện nhà, tránh để khẩu thiệt công việc làm hỏng không khí gia đình.", "Ưu tiên thời gian với vợ con, du lịch ngắn, thống nhất kế hoạch tiền. Tránh tranh luận hợp đồng hoặc nhân sự vào giờ nghỉ và không dùng im lặng để xử lý bất đồng."),
    11: ("Huynh Đệ Tý", "Tháng tái cấu trúc nhóm cộng sự, quan hệ bạn bè và cách phân quyền. Phá Quân miếu cho sức phá cũ lập mới, nhưng Thiên Khốc và Thiên Hư báo sự hụt hẫng nếu kỳ vọng vào người khác quá nhiều.", "Tý tam hợp Thân–Thìn, kéo Tật Ách và Điền Trạch vào việc thay đổi; Tý xung Nô Bộc Ngọ, nên nhân sự và đối tác là trọng điểm rủi ro. Tý lục hợp Mệnh Sửu giúp Hoàng đủ bản lĩnh cầm trịch.", "Ưu tiên chốt lại vai trò, dữ liệu, quyền truy cập và hợp đồng. Tránh cho vay, bảo lãnh hoặc giữ quan hệ bằng cách bỏ qua sai phạm lặp lại."),
    12: ("Mệnh Sửu", "Tháng Hoàng lấy lại thế chủ động, tổng kết năm và thiết kế kế hoạch mới. Thiên Cơ đắc cùng Song Quyền hỗ trợ tư duy chiến lược, tối ưu hệ thống và ra quyết định có tính dẫn đường.", "Sửu tam hợp Tỵ–Dậu, hội Quan Lộc và Tài Bạch; công việc và tiền có thể khép năm tốt. Sửu xung Thiên Di Mùi, không cần đi quá nhiều; tập trung xây nền trong nhà và doanh nghiệp.", "Ưu tiên tổng kết, ký việc cho năm sau, khóa sổ và lập ngân sách. Tránh ôm quá nhiều mục tiêu cùng lúc hoặc mở rộng trước khi kiểm tra năng lực vận hành."),
}


def build():
    lines = [
        "# TỬ VI THÁNG 09–12 ÂM LỊCH NĂM BÍNH NGỌ 2026",
        "",
        "## Bản gửi Hoàng",
        "",
        "**Đương số:** Hoàng, nam Canh Ngọ, sinh 03/06/1990 dương lịch, 09:30 giờ Tỵ, Hải Dương cũ  ",
        "**Đại vận:** Bính Tuất, tuổi 31–40  ",
        "**Cấu trúc dùng trong bản này:** Mệnh Sửu, Quan Lộc Tỵ, Tài Bạch Dậu, Tử Tức Tuất  ",
        "",
        "> Bản này nối tiếp bản tháng 8, tập trung vào lưu nguyệt tháng 9, 10, 11 và 12 âm lịch; ngày dương được ghi theo mùng 1 từng tháng đã đối chiếu với lịch năm 2026.",
        "",
        "## 1. Tổng quan cuối năm",
        "",
        "Cuối năm đi qua bốn nhịp: tháng 9 xử lý dự án và tài sản, tháng 10 vun gia đình, tháng 11 tái cấu trúc cộng sự, tháng 12 quay về Mệnh để tổng kết và điều khiển hướng đi. Trục cần giữ xuyên suốt là minh bạch tiền–người–hợp đồng và không đánh đổi sức khỏe để chạy doanh thu.",
        "",
        "## 2. Luận từng tháng",
        "",
    ]
    for number, branch, start, days, palace, stars in MONTHS:
        headline, overview, tamhop, action = MONTH_TEXT[number]
        end = start + timedelta(days=days - 1)
        lines += [
            f"### Tháng {number} âm – {headline} – {start.strftime('%d/%m/%Y')} đến {end.strftime('%d/%m/%Y')}",
            "",
            f"**Lưu Nguyệt:** {branch} an tại **{palace}**.  ",
            f"**Sao trọng điểm:** {stars}.",
            "",
            f"**Tổng luận:** {overview}",
            "",
            f"**Tam phương tứ chính:** {tamhop}",
            "",
            f"**Việc nên làm và rủi ro:** {action}",
            "",
            "**Công việc và tiền:** Ưu tiên việc có doanh thu, nghiệm thu, đối soát và trách nhiệm đo được. Không dùng cảm giác hưng phấn của tháng tốt để vay hoặc bảo lãnh.  ",
            "**Gia đình và sức khỏe:** Giữ lịch nghỉ, nói rõ áp lực với người thân, không để việc kinh doanh chiếm toàn bộ thời gian gia đình.  ",
            "**Mức tháng:** Xem là chỉ báo tham khảo theo lá số, không phải cam kết sự kiện chắc chắn.",
            "",
            f"#### Lịch từng ngày tháng {number}",
            "",
            "| Âm lịch | Dương lịch | Can chi ngày | Mức | Luận nhanh |",
            "|---:|---|---|---|---|",
        ]
        for lunar_day in range(1, days + 1):
            solar = start + timedelta(days=lunar_day - 1)
            can, day_branch = day_gan_chi(solar)
            rating, advice = daily_advice(branch, day_branch)
            lines.append(f"| {lunar_day:02d}/{number:02d} | {solar.strftime('%d/%m/%Y')} | {can} {day_branch} | {rating} | {advice} |")
        lines += ["", "---", ""]
    lines += [
        "## 3. Kết luận hành động",
        "",
        "- **Tháng 9:** hoàn thiện dự án, kiểm soát tài sản và không buông lỏng nhân sự.",
        "- **Tháng 10:** ưu tiên hôn nhân, gia đình và tách việc khỏi nhà.",
        "- **Tháng 11:** tái cấu trúc cộng sự, mọi thay đổi phải có giấy tờ.",
        "- **Tháng 12:** tổng kết, khóa sổ, lập kế hoạch 2027 và chỉ mở rộng khi hệ thống chịu được.",
        "",
        "*Bản luận mang tính tham khảo văn hóa và tự phản tỉnh; không thay thế tư vấn y tế, pháp lý, tài chính hoặc quyết định đầu tư chuyên nghiệp.*",
    ]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    build()