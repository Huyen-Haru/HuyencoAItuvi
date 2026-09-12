# KẾ HOẠCH TRIỂN KHAI 10 TÍNH NĂNG — tuvi-lich-2026.html
## File target: /Users/phamhuyen/Cá nhân /AI Agent/Tử vi Mr Hoàng/tuvi-lich-2026.html
## Deploy: https://huyen-haru.github.io/Tuvi-Mr-Hoang-2026/tuvi-lich-2026.html
## GitHub token: đã xóa khỏi tài liệu; không lưu token trong repository
## Repo: Huyen-Haru/Tuvi-Mr-Hoang-2026

---

## THÔNG TIN LÁ SỐ MR. HOÀNG
- Nam, sinh 03/06/1990 DL, giờ Tỵ (9h30)
- Mệnh Cung: Sửu | Đại Vận: Bính Tuất (31-40) | Hạn: La Hầu | Mệnh Cục: Hỏa Lục Cục
- Tết Bính Ngọ 2026 = 17/02/2026 DL (ĐÃ XÁC NHẬN)
- 13/05/2026 DL = 27/3 âm (ĐÃ XÁC NHẬN)
- BASE_DATE can-chi: new Date(2026,0,29) = Mậu Thân

## THÔNG TIN GIA ĐÌNH (CẦN HỎI)
- Vợ: sinh năm 1990 — CẦN: ngày/tháng/năm DL chính xác
- Con trai: sinh năm 2016 — CẦN: ngày/tháng/năm DL chính xác
- Con gái: sinh năm 2022 — CẦN: ngày/tháng/năm DL chính xác

---

## LỊCH ÂM 2026 (ĐÃ SỬA ĐÚNG)
T1:  17/02 – 18/03 (30 ngày) | LN=Dần
T2:  19/03 – 16/04 (29 ngày) | LN=Mão
T3:  17/04 – 16/05 (30 ngày) | LN=Thìn ← xác nhận 13/5=27/3âm ✓
T4:  17/05 – 14/06 (29 ngày) | LN=Tị
T5:  15/06 – 14/07 (30 ngày) | LN=Ngọ
T6:  15/07 – 12/08 (29 ngày) | LN=Mùi
T7:  13/08 – 10/09 (29 ngày) | LN=Thân
T8:  11/09 – 10/10 (30 ngày) | LN=Dậu
T9:  11/10 – 08/11 (29 ngày) | LN=Tuất
T10: 09/11 – 08/12 (30 ngày) | LN=Hợi
T11: 09/12 – 06/01/2027 (29 ngày) | LN=Tý
T12: 07/01/2027 – ... (30 ngày) | LN=Sửu

---

## 10 TÍNH NĂNG — CHI TIẾT TRIỂN KHAI

### ✅ PHASE 1 — HIGH IMPACT, NHANH
#### #4 — Today Dashboard Card (STICKY)
- Vị trí: Ngay dưới breadcrumb, luôn hiển thị
- Nội dung: Ngày DL + AL, Can-Chi, Đánh giá tổng, 3 cung sáng, 1 cảnh báo, Nên/Không nên hôm nay
- Logic: Auto detect TODAY from ALL[], gọi getDay(m,d) với m/d của hôm nay
- Thêm nút "Xem chi tiết →" → goDay(today)
- CSS class: .today-card
- Đặt: Sau div.bc, trước div.view-tabs
  
#### #7 — Sao Ngày / 12 Trực
- Công thức: Trực = (chi_index_ngày - chi_index_tháng_âm + 12) % 12
- 12 Trực: ['Kiến','Trừ','Mãn','Bình','Định','Chấp','Phá','Nguy','Thành','Thu','Khai','Bế']
- Good/Bad: Kiến✓ Trừ✓ Mãn✓ Bình✓ Định✓ Thành✓ Khai✓ | Chấp~ Phá✗ Nguy✗ Thu~ Bế✗
- 12 Thần (Hoàng/Hắc Đạo):
  - Formula: (chi_ngày + offset_tháng) % 12
  - Offset by tháng: T1+T7=0, T2+T8=6, T3+T9=2, T4+T10=8, T5+T11=4, T6+T12=10
  - Thần: ['Thanh Long','Minh Đường','Thiên Hình','Chu Tước','Kim Quỹ','Bảo Quang',
           'Bạch Hổ','Ngọc Đường','Thiên Lao','Huyền Vũ','Tư Mệnh','Câu Trận']
  - Hoàng Đạo: Thanh Long, Minh Đường, Kim Quỹ, Bảo Quang, Ngọc Đường, Tư Mệnh
  - Hắc Đạo: Thiên Hình, Chu Tước, Bạch Hổ, Thiên Lao, Huyền Vũ, Câu Trận
- Hiển thị: trong renderDay() — thêm badge Trực + Thần + Hoàng/Hắc

### ✅ PHASE 2 — MEDIUM COMPLEXITY
#### #3 — Activity Smart Filter
- 8 loại việc: Ký HĐ | Gặp đối tác | Đi công tác | Họp nội bộ | Sức khỏe | Gia đình | Ra quyết định | Thu tiền
- Logic: Mỗi loại việc map sang cung cần tốt:
  - Ký HĐ → Quan Lộc(Tý) + Tài Bạch(Tuất) cần good/great
  - Gặp đối tác → Quan Lộc + Thiên Di(Mùi)
  - Đi công tác → Thiên Di + Tật Ách(Thân)
  - Họp nội bộ → Nô Bộc(Ngọ) cần mid trở lên (không bad)
  - Sức khỏe → Tật Ách + Phúc Đức(Mão)
  - Gia đình → Phu Thê(Hợi) + Tử Tức(Dậu) + Phúc Đức
  - Ra quyết định → Mệnh(Sửu) + Quan Lộc
  - Thu tiền → Tài Bạch(Tuất) cần great/good
- UI: Filter bar trên calendar, highlight days that match
- Function: filterByActivity(type) → returns set of day IDs that qualify

#### #2 — Fortune Timeline (Wave Chart)
- Vị trí: Trong year view, thay thế/bổ sung heatmap
- Type: SVG line chart, x=ngày (0-354), y=score (-8 đến +8)
- Tính score: sum of rateC() scores across all 12 cungs for each day
- Smooth: Moving average 3 days
- Interactive: hover → tooltip với ngày DL+AL+rating
- Colors: Đường gradient green/red theo giá trị
- Click trên chart → goDay()
- Kích thước: 100% width, height 120px

### ✅ PHASE 3 — COMPLEX FEATURES  
#### #6 — CEO Mode Tab
- Thêm tab mới "💼 CEO" trong view-tabs
- Nội dung:
  a) Bảng 4 quý: Q1(T1-T3) Q2(T4-T6) Q3(T7-T9) Q4(T10-T12) — với điểm và color
  b) Radar chart 6 chiều: Tài Lộc, Quyền Lực, Nhân Sự, Gia Đình, Sức Khỏe, Sự Nghiệp
     - Dùng SVG polygon
     - Dữ liệu từ M_SCORE của các cung liên quan theo từng tháng
  c) "Tháng nào tốt nhất để:" — bảng theo loại việc CEO
  d) Top 10 ngày vàng cả năm (best rateDay scores)
  e) Cảnh báo: Top 5 ngày xấu nhất cần tránh

#### #9 — Mini Q&A Bot
- UI: Floating button "💬 Hỏi" bottom-right corner
- Panel slide-up khi click
- Input: type question → Enter/button
- Câu hỏi mẫu được nhận dạng:
  - "ngày nào tốt để ký hợp đồng [tháng X]" → tìm best days với Quan Lộc+Tài Bạch
  - "tuần này thế nào" → summary tuần hiện tại
  - "tháng [X] có tốt không" → M_SCORE[X-1] + M_OV[X-1]
  - "ngày tốt nhất tháng này" → top 3 days in currentMonth
  - "hôm nay" → today's full summary
- Function: parseQuery(text) → answer string
- Hiển thị: typewriter effect khi trả lời

### ✅ PHASE 4 — VISUAL/ADVANCED
#### #1 — Natal Chart Wheel (SVG)
- Vị trí: Tab riêng "🔮 Lá Số" hoặc panel trong sidebar/year view
- SVG circle, radius 150px
- 12 cung xếp theo chiều 12 địa chi
  - Thứ tự từ trên xuống theo chiều ngược kim: Tý(12h), Sửu(1h), Dần(2h)...
  - Mệnh cung Sửu ở vị trí highlight đặc biệt
- Mỗi cung: hiển thị icon + tên + can-chi khi ngày được chọn highlight color
- Khi hover/click cung → show detail panel bên phải
- Vẽ tam phương bằng đường kẻ tam giác (3 nhóm màu)
- Vẽ tứ chính bằng đường kẻ đứt (4 cặp màu)
- Animation: slow rotation khi load

#### #8 — Share Card Generator
- Nút "📤 Chia sẻ" trong day view header
- Dùng html2canvas (CDN) để capture .day-panel
- Download file PNG tên: "TuVi_DD-MM-2026.png"
- Thêm watermark "tuvi-mr-hoang.github.io"
- Fallback nếu không có html2canvas: CSS print @media print với layout đẹp

#### #10 — Personal Journal
- Storage: localStorage key = "tuvi_journal_2026"
- Structure: { "2026-05-13": { note: "...", outcome: "good|bad|neutral", tags: ["ky-hd","hop"] } }
- UI trong day view: Textarea "Ghi chú ngày này..." + outcome selector + tag chips
- Nút Save → lưu vào localStorage
- Trong calendar view: nếu ngày có note → hiển thị dot/indicator đặc biệt (bút chì icon)
- Export: nút "Xuất nhật ký" → download JSON
- Stats: Trong year view thêm section "Thực tế vs Dự báo" — so sánh outcome ghi chú với dự báo

### ✅ PHASE 5 — (CẦN NGÀY SINH GIA ĐÌNH)
#### #5 — Family Synastry
- Cần: ngày sinh vợ, con trai, con gái
- Logic: Tính BaZi (Tứ Trụ) cơ bản cho từng thành viên
  - Can năm sinh → Mệnh ngũ hành
  - Xem ngày chọn có thuận/xung với can-chi năm sinh của từng người
- UI: Row nhỏ bên dưới day detail: "Vận khí gia đình hôm nay"
  - Avatar icon mỗi người + màu green/yellow/red
  - Tooltip chi tiết khi hover

---

## THỨ TỰ TRIỂN KHAI (tối ưu cho token budget)

1. Save plan (file này)
2. Phase 1: #4 Today Card + #7 Sao Ngày → DEPLOY
3. Phase 2: #3 Activity Filter + #2 Timeline → DEPLOY  
4. Phase 3: #6 CEO Mode + #9 Q&A Bot → DEPLOY
5. Phase 4: #1 Natal Wheel + #8 Share + #10 Journal → DEPLOY
6. Phase 5: #5 Family (sau khi có ngày sinh) → DEPLOY

## STATUS TRACKING
- [ ] Plan saved
- [ ] Family dates received
- [ ] #4 Today Card ✓
- [ ] #7 Sao Ngày/12 Trực ✓
- [ ] #3 Activity Filter ✓
- [ ] #2 Fortune Timeline ✓
- [ ] #6 CEO Mode ✓
- [ ] #9 Mini Q&A Bot ✓
- [ ] #1 Natal Wheel ✓
- [ ] #8 Share Card ✓
- [ ] #10 Journal ✓
- [ ] #5 Family Synastry ✓
- [ ] Final deploy ✓
