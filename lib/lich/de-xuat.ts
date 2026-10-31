/**
 * Đề xuất cụ thể theo từng cung, cá nhân hóa theo sao trong lá số
 * và theo vận của kỳ đang xem (ngày / tháng / năm).
 *
 * Các gợi ý mang tính tham khảo văn hóa; phần sức khỏe và tài chính
 * không thay thế tư vấn của bác sĩ hay chuyên gia tài chính.
 */
import type { Palace } from '@/lib/ziwei/types';
import { vi } from '@/lib/ziwei/vi';
import type { ChartIndex } from './vanhan';
import type { Factor } from './cung-ngay';
import type { JobTrend } from './cong-viec';
import { yearPillar } from '@/lib/hop-tuoi';

export interface SuggestionGroup {
  icon: string;
  title: string;
  items: string[];
  note?: string;
}

export type Scope = 'ngay' | 'thang' | 'nam';

const SCOPE_WORD: Record<Scope, string> = { ngay: 'hôm nay', thang: 'tháng này', nam: 'năm nay' };

/* ───────── Dữ liệu theo sao ───────── */

/** Ngành nghề / vai trò hợp với chính tinh ở Quan Lộc */
const CAREER: Record<string, string> = {
  '紫微': 'vị trí quản lý, lãnh đạo nhóm, hành chính, công việc cần uy tín',
  '天机': 'lập kế hoạch, phân tích, công nghệ, tư vấn chiến lược, marketing',
  '太阳': 'giáo dục, truyền thông, ngoại giao, công việc giao tiếp đông người',
  '武曲': 'tài chính, ngân hàng, kế toán, kinh doanh, kỹ thuật cơ khí',
  '天同': 'dịch vụ, chăm sóc khách hàng, nhân sự, ẩm thực, giải trí',
  '廉贞': 'pháp chế, quản lý quy trình, kỹ thuật, điện tử, công việc cần kỷ luật',
  '天府': 'quản lý tài sản, kho vận, hành chính, ngân hàng, bất động sản',
  '太阴': 'tài chính, bất động sản, thiết kế, viết nội dung, công việc tỉ mỉ',
  '贪狼': 'kinh doanh, bán hàng, quan hệ công chúng, làm đẹp, nghệ thuật',
  '巨门': 'luật, giảng dạy, tư vấn, nghiên cứu, bán hàng bằng lời nói',
  '天相': 'trợ lý điều hành, hành chính, nhân sự, công việc phối hợp nhiều bên',
  '天梁': 'y tế, giáo dục, bảo hiểm, tư vấn, công tác xã hội',
  '七杀': 'khởi nghiệp, quản lý dự án khó, kỹ thuật, bán hàng thử thách cao',
  '破军': 'đổi mới, khởi nghiệp, công nghệ mới, mở thị trường, cải tổ',
};

/** Phong cách và lĩnh vực đầu tư theo chính tinh ở Tài Bạch */
const MONEY: Record<string, { style: string; fields: string }> = {
  '紫微': { style: 'đầu tư bài bản, có người cố vấn', fields: 'cổ phiếu doanh nghiệp đầu ngành, bất động sản trung tâm' },
  '天机': { style: 'linh hoạt, lướt sóng ngắn nhưng dễ đổi ý', fields: 'công nghệ, giáo dục, dịch vụ tư vấn' },
  '太阳': { style: 'kiếm tiền nhờ danh tiếng, dễ chi cho người khác', fields: 'năng lượng, truyền thông, giáo dục' },
  '武曲': { style: 'quyết đoán, giỏi giữ tiền', fields: 'vàng, kim loại, ngân hàng, tài chính' },
  '天同': { style: 'tiền đến từ từ, thích an toàn', fields: 'tiết kiệm có kỳ hạn, ẩm thực, dịch vụ giải trí' },
  '廉贞': { style: 'kiếm tiền bằng kỹ năng chuyên môn', fields: 'điện tử, công nghệ, sản xuất' },
  '天府': { style: 'tích lũy bền vững, kho lộc', fields: 'tiết kiệm, trái phiếu, bất động sản cho thuê' },
  '太阴': { style: 'tích sản dài hạn, ổn định', fields: 'bất động sản, quỹ đầu tư, sản phẩm cho phụ nữ và gia đình' },
  '贪狼': { style: 'nhiều nguồn thu, dễ bị cám dỗ đầu cơ', fields: 'dịch vụ, giải trí, làm đẹp, ăn uống (chỉ dùng phần vốn nhỏ để thử)' },
  '巨门': { style: 'kiếm tiền bằng lời nói, chuyên môn', fields: 'đào tạo, tư vấn, nội dung số' },
  '天相': { style: 'tiền đến từ hợp tác, cộng sự', fields: 'góp vốn có hợp đồng rõ ràng, dịch vụ chuyên nghiệp' },
  '天梁': { style: 'thận trọng, có quý nhân về tiền', fields: 'bảo hiểm, y tế, giáo dục' },
  '七杀': { style: 'dám mạo hiểm, thắng thua rõ', fields: 'khởi nghiệp, cổ phiếu tăng trưởng (giới hạn tỷ trọng)' },
  '破军': { style: 'thu chi lớn, dễ hao', fields: 'chỉ đầu tư phần nhỏ vào lĩnh vực mới; ưu tiên giữ tiền mặt' },
};

/** Ngành hợp theo ngũ hành bản mệnh (nạp âm năm sinh) */
const ELEMENT_FIELDS: Record<string, string> = {
  'Kim': 'tài chính, kim loại, ô tô, máy móc, trang sức',
  'Mộc': 'giáo dục, nội thất gỗ, nông nghiệp, dược, xuất bản',
  'Thủy': 'logistics, du lịch, đồ uống, thủy sản, thương mại',
  'Hỏa': 'năng lượng, công nghệ, ẩm thực, truyền thông, làm đẹp',
  'Thổ': 'bất động sản, xây dựng, vật liệu, nông sản, kho bãi',
};

/** Bộ phận cơ thể cần để ý theo sao ở Tật Ách (theo sách Tử Vi truyền thống) */
const HEALTH: Record<string, string> = {
  '紫微': 'dạ dày, tỳ vị, tiêu hóa', '天机': 'gan, thần kinh, tay chân',
  '太阳': 'mắt, tim, huyết áp, đầu', '武曲': 'phổi, đường hô hấp, răng',
  '天同': 'thận, bàng quang, tiết niệu, tai', '廉贞': 'máu, tim mạch, da',
  '天府': 'dạ dày, tỳ vị', '太阴': 'thận, mắt, nội tiết',
  '贪狼': 'gan, mật, thận', '巨门': 'dạ dày, miệng, đường tiêu hóa',
  '天相': 'da, đường tiết niệu', '天梁': 'dạ dày, tim, vùng ngực',
  '七杀': 'phổi, hô hấp, chấn thương do va chạm', '破军': 'thận, máu, chấn thương',
  '擎羊': 'chấn thương, vết thương, phẫu thuật', '陀罗': 'xương khớp, răng, cột sống',
  '火星': 'viêm nhiễm, sốt, nóng trong', '铃星': 'viêm âm ỉ, căng thẳng thần kinh',
  '地空': 'suy nhược thần kinh, mất ngủ', '地劫': 'suy nhược, mệt mỏi kéo dài',
};

/** Cách yêu / phong cách tình cảm theo sao ở Phu Thê */
const LOVE: Record<string, string> = {
  '紫微': 'cần được tôn trọng, hợp người có chí hướng', '天机': 'thích trò chuyện, đổi mới, dễ nghĩ nhiều',
  '太阳': 'nhiệt tình, hay lo cho người kia', '武曲': 'thực tế, ít lời, thể hiện bằng hành động',
  '天同': 'ngọt ngào, thích bình yên', '廉贞': 'mãnh liệt, dễ ghen, cần sự chung thủy',
  '天府': 'ổn định, chu đáo', '太阴': 'tinh tế, giàu cảm xúc, cần được quan tâm',
  '贪狼': 'nhiều duyên, cần giữ ranh giới', '巨门': 'dễ hiểu lầm vì lời nói',
  '天相': 'công bằng, coi trọng cam kết', '天梁': 'che chở, như người đi trước',
  '七杀': 'mạnh mẽ, dễ va chạm', '破军': 'nhiều thay đổi, cần kiên nhẫn',
};


/** Bản thân (Mệnh): điểm mạnh / điểm cần rèn theo chính tinh */
const SELF: Record<string, [string, string]> = {
  '紫微': ['có uy, biết tổ chức, được người khác tin cậy', 'dễ tự ái, thích được tôn trọng, khó nhận góp ý'],
  '天机': ['nhanh trí, nhiều ý tưởng, giỏi lập kế hoạch', 'hay nghĩ nhiều, dễ đổi ý, thiếu kiên trì'],
  '太阳': ['nhiệt tình, rộng lượng, có tinh thần trách nhiệm', 'ôm việc người khác, dễ hao sức vì người'],
  '武曲': ['quyết đoán, thực tế, giỏi tiền bạc', 'cứng rắn, ít thể hiện cảm xúc'],
  '天同': ['hiền hòa, dễ gần, biết hưởng thụ', 'thiếu động lực, ngại thay đổi'],
  '廉贞': ['nguyên tắc, mạnh mẽ, đa tài', 'dễ căng thẳng, cố chấp'],
  '天府': ['ổn định, chu đáo, giỏi quản lý', 'bảo thủ, ngại rủi ro'],
  '太阴': ['tinh tế, nhạy cảm, chăm chút', 'dễ buồn, hay giữ trong lòng'],
  '贪狼': ['đa tài, giao tiếp giỏi, ham học hỏi', 'dễ bị cám dỗ, thiếu tập trung'],
  '巨门': ['phân tích sắc bén, ăn nói giỏi', 'dễ bị hiểu lầm vì lời nói, hay nghi ngờ'],
  '天相': ['công bằng, khéo léo, đáng tin', 'phụ thuộc người khác, ngại va chạm'],
  '天梁': ['bao dung, có tâm giúp người, chín chắn', 'hay dạy người khác, cô đơn trong suy nghĩ'],
  '七杀': ['dũng cảm, dám làm, độc lập', 'nóng vội, dễ xung đột'],
  '破军': ['tiên phong, dám phá cũ lập mới', 'hấp tấp, dễ hao tổn tiền bạc và sức lực'],
};

/** Nhà cửa (Điền Trạch) theo chính tinh */
const HOME: Record<string, string> = {
  '紫微': 'hợp nhà rộng, khu trung tâm, có thể sở hữu bất động sản giá trị', '天机': 'hay đổi chỗ ở, hợp nhà gần trường học, văn phòng',
  '太阳': 'hợp nhà sáng, hướng Đông hoặc Nam, nhiều ánh nắng', '武曲': 'tự tay gây dựng nhà cửa, hợp mua bằng tiền tích lũy',
  '天同': 'hợp nhà yên tĩnh, có cây xanh, nhận nhà từ gia đình', '廉贞': 'dễ có tranh chấp nhà đất, cần giấy tờ rõ ràng',
  '天府': 'kho lộc về nhà đất, hợp tích lũy bất động sản lâu dài', '太阴': 'rất hợp sở hữu nhà đất, giá trị tăng theo thời gian',
  '贪狼': 'hợp nhà gần khu vui chơi, buôn bán; tránh mua theo cảm hứng', '巨门': 'dễ có chuyện thị phi hàng xóm, hợp nhà kín đáo',
  '天相': 'hợp mua nhà qua người quen giới thiệu, giấy tờ chuẩn chỉnh', '天梁': 'có quý nhân về nhà cửa, hợp nhà cũ cải tạo',
  '七杀': 'hay thay đổi chỗ ở, hợp tự xây hoặc sửa lớn', '破军': 'dễ phá đi làm lại, chi phí sửa chữa cao, cần dự trù',
};

/** Con cái (Tử Nữ) theo chính tinh */
const CHILD: Record<string, string> = {
  '紫微': 'con có chí, tự trọng; nên tôn trọng ý kiến của con', '天机': 'con thông minh, hiếu động; hợp cho học tư duy, lập trình',
  '太阳': 'con hướng ngoại, có trách nhiệm; khuyến khích hoạt động nhóm', '武曲': 'con thực tế, cứng tính; dạy con bằng ví dụ cụ thể',
  '天同': 'con hiền, hay được chiều; cần rèn tính tự lập', '廉贞': 'con có cá tính mạnh; cần kỷ luật nhưng nhẹ nhàng',
  '天府': 'con ngoan, ổn định; hợp tích lũy quỹ học cho con', '太阴': 'con nhạy cảm, tình cảm; quan tâm cảm xúc của con',
  '贪狼': 'con đa tài, ham chơi; định hướng năng khiếu nghệ thuật, thể thao', '巨门': 'con hay hỏi, hay cãi; giải thích lý lẽ rõ ràng',
  '天相': 'con biết điều, hợp tác tốt; khen ngợi đúng lúc', '天梁': 'con chín chắn sớm; hợp cho học y, giáo dục',
  '七杀': 'con mạnh mẽ, độc lập; cho con thử thách vừa sức', '破军': 'con thích khác biệt; kiên nhẫn, tránh áp đặt',
};

/** Cha mẹ, bề trên (Phụ Mẫu) theo chính tinh */
const PARENT: Record<string, string> = {
  '紫微': 'cha mẹ, cấp trên có uy; nên tôn trọng, xin ý kiến trước việc lớn', '天机': 'cha mẹ, cấp trên hay thay đổi ý; xác nhận lại bằng văn bản',
  '太阳': 'được cha (bề trên nam) che chở; giữ liên lạc thường xuyên', '武曲': 'bề trên nghiêm khắc, coi trọng kết quả; báo cáo bằng số liệu',
  '天同': 'cha mẹ hiền, quan hệ êm ấm', '廉贞': 'dễ bất đồng quan điểm với bề trên; nhường nhịn, nói chuyện riêng',
  '天府': 'được thừa hưởng, bề trên chu đáo', '太阴': 'gắn bó với mẹ (bề trên nữ); quan tâm sức khỏe của mẹ',
  '贪狼': 'bề trên dễ gần nhưng hay đòi hỏi', '巨门': 'dễ hiểu lầm với bề trên vì lời nói; nói ít, làm nhiều',
  '天相': 'bề trên công bằng, được nâng đỡ', '天梁': 'có quý nhân là người lớn tuổi; nên nhờ cậy khi cần',
  '七杀': 'quan hệ với bề trên dễ căng; giữ khoảng cách vừa phải', '破军': 'quan hệ với cha mẹ nhiều thay đổi; chủ động hàn gắn',
};

/** Bạn bè, đồng nghiệp, anh chị em (Nô Bộc, Huynh Đệ) theo chính tinh */
const SOCIAL: Record<string, string> = {
  '紫微': 'bạn bè có địa vị; hợp kết giao người giỏi hơn mình', '天机': 'bạn bè thông minh nhưng hay thay đổi; chọn lọc người thân thiết',
  '太阳': 'bạn bè đông, mình hay là người giúp; biết từ chối khi quá sức', '武曲': 'bạn bè thực tế; tách bạch tình cảm và tiền bạc',
  '天同': 'bạn bè vui vẻ, hòa đồng', '廉贞': 'quan hệ dễ căng khi có quyền lợi; rõ ràng từ đầu',
  '天府': 'bạn bè đáng tin, hỗ trợ lâu dài', '太阴': 'hợp bạn nữ, bạn tâm giao',
  '贪狼': 'quen nhiều, nhưng ít người thật lòng; cẩn thận rủ rê ăn chơi', '巨门': 'dễ thị phi trong nhóm; tránh nói sau lưng',
  '天相': 'hợp làm việc nhóm, cộng sự tốt', '天梁': 'có người lớn tuổi nâng đỡ',
  '七杀': 'bạn bè mạnh mẽ, dễ va chạm; giữ hòa khí', '破军': 'bạn bè thay đổi nhiều; không góp vốn vội',
};

/** Đi lại, ra ngoài (Thiên Di) theo chính tinh */
const TRAVEL: Record<string, string> = {
  '紫微': 'ra ngoài được nể trọng, hợp làm việc ở môi trường lớn', '天机': 'hay di chuyển, hợp công việc đi lại nhiều',
  '太阳': 'ra ngoài nổi bật, hợp làm việc xa nhà, nước ngoài', '武曲': 'ra ngoài kiếm tiền tốt, hợp kinh doanh xa',
  '天同': 'đi đâu cũng dễ hòa nhập, hợp du lịch nghỉ dưỡng', '廉贞': 'ra ngoài dễ va chạm; giữ bình tĩnh nơi đông người',
  '天府': 'ra ngoài ổn định, có người giúp', '太阴': 'hợp đi xa vào ban đêm, làm việc ở nơi yên tĩnh',
  '贪狼': 'ra ngoài nhiều duyên, nhiều cơ hội giao tiếp', '巨门': 'ra ngoài dễ thị phi; cẩn trọng lời nói',
  '天相': 'ra ngoài được quý nhân phù trợ', '天梁': 'đi xa có người che chở, hợp công tác',
  '七杀': 'đi xa lập nghiệp, nhưng cẩn thận an toàn', '破军': 'đi xa nhiều biến động; chuẩn bị kỹ trước khi đi',
};

/** Tinh thần (Phúc Đức) theo chính tinh */
const SPIRIT: Record<string, string> = {
  '紫微': 'cần cảm giác được làm chủ; nghỉ ngơi bằng việc mình kiểm soát được', '天机': 'đầu óc hay suy nghĩ; hợp thiền, đọc sách',
  '太阳': 'vui khi giúp được người; nhưng cần thời gian cho riêng mình', '武曲': 'thư giãn bằng vận động, thể thao',
  '天同': 'biết hưởng phúc, thích ăn ngon, nghỉ ngơi', '廉贞': 'dễ căng thẳng; hợp yoga, thở sâu, âm nhạc',
  '天府': 'tinh thần vững, thích sự an toàn', '太阴': 'cảm xúc sâu; hợp viết nhật ký, nghe nhạc nhẹ',
  '贪狼': 'nhiều sở thích; chọn 1–2 thú vui lành mạnh', '巨门': 'hay lo, hay nghi; tập buông bỏ, bớt suy diễn',
  '天相': 'tinh thần ổn khi mọi thứ công bằng, rõ ràng', '天梁': 'hợp tu tập, làm việc thiện, tâm linh',
  '七杀': 'cần mục tiêu để thấy có ý nghĩa; tránh làm việc quá sức', '破军': 'tâm trạng thất thường; giữ nếp sinh hoạt đều đặn',
};

/** Màu hợp mệnh (bản mệnh và hành sinh ra mệnh) */
const LUCKY_COLORS: Record<string, string> = {
  'Kim': 'trắng, xám, bạc, vàng đất',
  'Mộc': 'xanh lá, đen, xanh dương',
  'Thủy': 'đen, xanh dương, trắng, bạc',
  'Hỏa': 'đỏ, hồng, tím, xanh lá',
  'Thổ': 'vàng, nâu, cam, đỏ',
};

/** Hóa giải thực tế theo cung */
const REMEDY: Record<string, string[]> = {
  '官禄': ['Chia mục tiêu lớn thành việc nhỏ, làm xong từng việc.', 'Chủ động xin phản hồi từ cấp trên, tránh đối đầu công khai.', 'Lưu lại email, hợp đồng, kết quả công việc làm bằng chứng.', 'Dùng thời gian này học thêm một kỹ năng hoặc chứng chỉ.'],
  '财帛': ['Lập quỹ khẩn cấp đủ 3–6 tháng chi tiêu trước khi đầu tư.', 'Ghi chép chi tiêu hằng ngày, cắt bớt khoản không cần thiết.', 'Tạm dừng đầu tư mới; trả trước các khoản nợ lãi cao.', 'Không cho vay, không đứng ra bảo lãnh.'],
  '夫妻': ['Dành ít nhất một buổi mỗi tuần chỉ cho hai người, tắt điện thoại.', 'Nói lời cảm ơn và xin lỗi nhiều hơn; không bàn chuyện tiền lúc đang căng thẳng.', 'Viết ra điều mình cần thay vì trách móc.', 'Nếu mâu thuẫn kéo dài, cân nhắc tư vấn tâm lý cặp đôi.'],
  '疾厄': ['Đặt lịch khám sớm, đừng chờ có triệu chứng nặng.', 'Ngủ trước 23h, đi bộ hoặc tập yoga 30 phút mỗi ngày.', 'Giảm rượu bia, đồ chiên rán; uống đủ 2 lít nước.', 'Đi lại chậm, tránh làm việc nặng khi đang mệt.'],
  '福德': ['Thiền hoặc hít thở sâu 10 phút mỗi sáng.', 'Viết nhật ký để giải tỏa suy nghĩ.', 'Gặp gỡ người tích cực, giảm thời gian trên mạng xã hội.', 'Cho bản thân một ngày nghỉ thật sự.'],
  '田宅': ['Dọn dẹp, bỏ đồ cũ hỏng; sửa ngay chỗ rò rỉ, chập điện.', 'Kiểm tra lại giấy tờ nhà đất, hợp đồng thuê.', 'Không mua bán, chuyển nhà gấp; chờ thời điểm tốt hơn.'],
  '子女': ['Dành thời gian chơi và lắng nghe con mỗi ngày.', 'Đưa con đi khám sức khỏe, kiểm tra việc học nhẹ nhàng.', 'Tránh so sánh con với người khác.'],
  '父母': ['Gọi điện, về thăm cha mẹ; đưa bố mẹ đi khám định kỳ.', 'Với cấp trên: báo cáo bằng văn bản, xin ý kiến trước khi làm.', 'Đọc kỹ giấy tờ trước khi ký.'],
  '迁移': ['Dời chuyến đi không cần thiết; nếu đi thì đi cùng người.', 'Kiểm tra xe, mua bảo hiểm du lịch, giữ giấy tờ cẩn thận.', 'Tránh tranh cãi nơi công cộng.'],
  '仆役': ['Không cho vay; mọi hợp tác cần hợp đồng rõ ràng.', 'Giữ khoảng cách với người hay than phiền, kéo mình vào thị phi.', 'Giữ bí mật kế hoạch công việc.'],
  '兄弟': ['Không góp vốn hay vay mượn với người thân lúc này.', 'Có hiểu lầm thì nói thẳng, trực tiếp.', 'Tránh bàn chuyện chia tài sản.'],
  '命宫': ['Chậm lại, ngủ đủ, hoãn quyết định lớn vài ngày.', 'Làm từng việc một, tránh ôm đồm.', 'Chăm sóc bản thân: ăn uống đủ chất, vận động nhẹ.'],
};

/** Việc thiện / tâm linh tham khảo theo cung */
const KIND_ACT: Record<string, string> = {
  '官禄': 'giúp đồng nghiệp mới, chia sẻ kiến thức miễn phí',
  '财帛': 'bố thí, ủng hộ người khó khăn một khoản nhỏ để "chuyển hóa" hao tài',
  '夫妻': 'cùng nhau làm một việc tốt (đi từ thiện, nấu ăn cho người thân)',
  '疾厄': 'hiến máu (nếu đủ sức khỏe), giúp đỡ người bệnh',
  '福德': 'đi chùa, phóng sinh, làm việc thiện thầm lặng',
  '田宅': 'thắp hương gia tiên, giữ bàn thờ sạch sẽ',
  '子女': 'tặng sách, đồ chơi cho trẻ em khó khăn',
  '父母': 'chăm sóc, biếu quà cha mẹ, người lớn tuổi',
  '迁移': 'giúp người lạ đi đường, nhường chỗ nơi công cộng',
  '仆役': 'giúp bạn bè một việc nhỏ không cần đáp lại',
  '兄弟': 'quan tâm anh chị em, họp mặt gia đình',
  '命宫': 'sống chậm, làm một việc tốt mỗi ngày',
};

const SHA_REMEDY: Record<string, string> = {
  '擎羊': 'Có Kình Dương: cẩn thận dao kéo, va chạm, phẫu thuật; đi xe chậm.',
  '陀罗': 'Có Đà La: việc dễ dây dưa; kiên nhẫn, chia nhỏ việc, đừng nóng.',
  '火星': 'Có Hỏa Tinh: dễ nóng giận bột phát; hít thở sâu trước khi nói.',
  '铃星': 'Có Linh Tinh: áp lực âm ỉ; chia sẻ với người tin cậy.',
  '地空': 'Có Địa Không: dễ hụt hẫng, hao tài; không đầu tư theo lời mời chào.',
  '地劫': 'Có Địa Kiếp: dễ mất mát bất ngờ; giữ tài sản cẩn thận, không cho vay.',
};

/* ───────── Tiện ích ───────── */

function majors(p: Palace | undefined) {
  return p ? p.stars.filter(s => s.type === 'major').map(s => s.name) : [];
}

/** Chính tinh của cung, nếu vô chính diệu thì mượn cung đối. */
function keyStars(p: Palace | undefined): string[] {
  if (!p) return [];
  const m = majors(p);
  if (m.length) return m;
  return p.borrowedStars ?? [];
}

const SHA = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

function has(factors: Factor[], word: string) {
  return factors.some(f => f.text.includes(word));
}

/** Hóa này đến từ ngày, tháng hay năm (để ghi đúng "hôm nay / tháng này / năm nay"). */
function hoaWhen(factors: Factor[], word: string, fallback: string): string {
  const f = factors.find(x => x.text.includes(word));
  if (!f) return fallback;
  if (f.text.includes('ngày')) return 'hôm nay';
  if (f.text.includes('tháng')) return 'tháng này';
  if (f.text.includes('năm')) return 'năm nay';
  return fallback;
}

function level(score: number): 'tot' | 'binh' | 'xau' {
  return score >= 58 ? 'tot' : score >= 46 ? 'binh' : 'xau';
}

/* ───────── Đề xuất theo cung ───────── */

export function suggestForPalace(
  idx: ChartIndex,
  key: string,
  ctx: { score: number; factors: Factor[]; scope: Scope; job?: JobTrend },
): SuggestionGroup[] {
  const nameKey = key === '命宫' ? '命' : key;
  const p = idx.byName[nameKey];
  const stars = keyStars(p);
  const starNames = stars.map(vi).join(', ') || 'cung này';
  const when = SCOPE_WORD[ctx.scope];
  const lv = level(ctx.score);
  const loc = has(ctx.factors, 'Hóa Lộc');
  const quyen = has(ctx.factors, 'Hóa Quyền');
  const khoa = has(ctx.factors, 'Hóa Khoa');
  const ky = has(ctx.factors, 'Hóa Kỵ');
  const xung = has(ctx.factors, 'xung');
  const female = idx.chart.birthInfo.gender === 'female';
  const b = idx.chart.birthInfo;
  const element = yearPillar(b.year, b.month, b.day).element;
  const out: SuggestionGroup[] = [];

  // "Hợp với bạn" theo sao cho các cung chưa có phần riêng bên dưới
  const PROFILE: Record<string, { title: string; table: Record<string, string> }> = {
    '田宅': { title: 'Nhà cửa của bạn', table: HOME },
    '子女': { title: 'Con cái của bạn', table: CHILD },
    '父母': { title: 'Cha mẹ, bề trên của bạn', table: PARENT },
    '仆役': { title: 'Bạn bè, đồng nghiệp của bạn', table: SOCIAL },
    '兄弟': { title: 'Anh chị em, cộng sự của bạn', table: SOCIAL },
    '迁移': { title: 'Khi ra ngoài, đi xa', table: TRAVEL },
    '福德': { title: 'Tinh thần của bạn', table: SPIRIT },
  };
  if (PROFILE[key]) {
    const lines = stars.map(st => PROFILE[key].table[st]).filter(Boolean);
    if (lines.length) out.push({ icon: '🧭', title: `${PROFILE[key].title} (theo ${starNames})`, items: lines.map(l => `${l[0].toUpperCase()}${l.slice(1)}.`) });
  }
  if (key === '命宫') {
    const sw = stars.map(st => SELF[st]).filter(Boolean);
    if (sw.length) out.push({
      icon: '🧭', title: `Con người bạn (Mệnh có ${starNames})`,
      items: [
        `Điểm mạnh: ${sw.map(x => x[0]).join('; ')}.`,
        `Điểm cần rèn: ${sw.map(x => x[1]).join('; ')}.`,
        `Màu hợp mệnh ${element}: ${LUCKY_COLORS[element]}.`,
      ],
    });
  }

  switch (key) {
    case '官禄': {
      const fit = stars.map(s => CAREER[s]).filter(Boolean);
      if (fit.length) out.push({ icon: '🧭', title: `Hợp với bạn (Quan Lộc có ${starNames})`, items: fit.map(f => `Hướng phát triển: ${f}.`) });
      const job = ctx.job;
      const items: string[] = [];
      if (job && job.label === 'Thiên về chủ động') {
        items.push('Có tín hiệu tự muốn đổi mới: cập nhật CV và hồ sơ LinkedIn, liên hệ lại mạng lưới cũ.');
        items.push('Nên nhận lời các buổi phỏng vấn hoặc trao đổi cơ hội mới, kể cả khi chưa chắc sẽ đổi.');
        items.push('Nếu ở lại: chủ động đề xuất dự án mới, xin thêm trách nhiệm hoặc đàm phán tăng lương.');
      } else if (job && job.label === 'Thiên về bị động') {
        items.push('Có dấu hiệu thay đổi ngoài ý muốn: lưu lại email, kết quả công việc, hợp đồng quan trọng.');
        items.push('Giữ quan hệ tốt với cấp trên, tránh tranh luận công khai; chuẩn bị sẵn phương án dự phòng (CV, khoản tiết kiệm 3–6 tháng).');
        items.push('Chưa nên tự ý nghỉ việc khi chưa có nơi mới chắc chắn.');
      } else if (job && job.label === 'Biến động cả hai chiều') {
        items.push('Vừa có cơ hội vừa có áp lực: tìm hiểu cơ hội mới nhưng đừng quyết vội; so sánh kỹ trước khi nhận lời.');
      }
      if (quyen) items.push(`Có Hóa Quyền ${hoaWhen(ctx.factors, 'Hóa Quyền', when)}: hợp nhận vai trò dẫn dắt, trình bày ý tưởng trước lãnh đạo.`);
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: hợp ký hợp đồng, chốt dự án, đề nghị thưởng hoặc tăng thu nhập.`);
      if (khoa) items.push(`Có Hóa Khoa ${hoaWhen(ctx.factors, 'Hóa Khoa', when)}: hợp thi chứng chỉ, nộp hồ sơ, xây dựng uy tín chuyên môn.`);
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: kiểm tra kỹ giấy tờ và số liệu, tránh hứa hẹn quá sức, giữ lời nói chừng mực.`);
      if (xung) items.push('Bị xung: dễ có thay đổi đột ngột trong công việc; chuẩn bị phương án B.');
      {
        items.push(lv === 'tot' ? `Vận công việc ${when} thuận: đẩy nhanh việc đang làm, mạnh dạn đề xuất.`
          : lv === 'binh' ? `Vận công việc ${when} bình ổn: hoàn thành tốt phần việc, học thêm kỹ năng mới.`
          : `Vận công việc ${when} trầm: làm chắc, tránh xung đột, chưa nên nhảy việc.`);
        if (lv === 'tot' && fit.length) items.push(`Nếu đang tìm việc hoặc muốn chuyển hướng: ưu tiên ${fit[0]}.`);
      }
      out.push({ icon: '💡', title: `Đề xuất công việc ${when}`, items });
      break;
    }
    case '财帛': {
      const money = stars.map(s => MONEY[s]).filter(Boolean);
      const fields = [...money.map(m => m.fields), ELEMENT_FIELDS[element]].filter(Boolean);
      out.push({
        icon: '🧭', title: `Hợp với bạn (Tài Bạch có ${starNames}, mệnh ${element})`,
        items: [
          ...money.map(m => `Phong cách tiền bạc: ${m.style}.`),
          `Lĩnh vực đầu tư/kinh doanh hợp: ${fields.join('; ')}.`,
        ],
      });
      const items: string[] = [];
      if (lv === 'tot' && !ky) {
        items.push(`Vận tài ${when} thuận: có thể giải ngân từng phần (ví dụ 20–30% số vốn dự định) vào ${fields.slice(0, 2).join('; ')}.`);
        items.push('Hợp thu hồi công nợ, chốt đơn hàng, đàm phán giá.');
      } else if (lv === 'binh') {
        items.push(`Vận tài ${when} bình: giữ đúng ngân sách, ưu tiên kênh an toàn (tiết kiệm, vàng tích lũy nhỏ).`);
      } else {
        items.push(`Vận tài ${when} yếu: chưa nên đầu tư mới, giữ tiền mặt, không cho vay hay bảo lãnh.`);
      }
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: dễ có khoản thu thêm, nên mở thêm nguồn thu phụ.`);
      if (khoa) items.push(`Có Hóa Khoa ${hoaWhen(ctx.factors, 'Hóa Khoa', when)}: hợp làm giấy tờ tài chính, vay vốn ngân hàng, hồ sơ thuế.`);
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: dễ hao tài vì sai sót, kiểm tra kỹ hợp đồng và chuyển khoản; tránh đầu cơ.`);
      if (stars.includes('破军') || stars.includes('贪狼')) items.push('Lá số dễ chi tiêu theo cảm hứng: đặt hạn mức chi tiêu tháng và tự động chuyển tiền tiết kiệm.');
      out.push({ icon: '💡', title: `Đề xuất tiền bạc ${when}`, items, note: 'Tham khảo theo lá số, không phải lời khuyên tài chính.' });
      break;
    }
    case '夫妻': {
      const style = stars.map(s => LOVE[s]).filter(Boolean);
      if (style.length) out.push({ icon: '🧭', title: `Kiểu tình cảm hợp với bạn (Phu Thê có ${starNames})`, items: style.map(s => `Bạn và người ấy: ${s}.`) });
      const items: string[] = [];
      if (lv === 'tot') {
        items.push(`Vận tình cảm ${when} tốt: hẹn hò, đi chơi xa hoặc nói chuyện về kế hoạch chung.`);
        items.push('Nếu đang độc thân: nhận lời các buổi gặp gỡ, tham gia sự kiện đông người, mở lòng với người mới.');
      } else if (lv === 'binh') {
        items.push('Giữ sự quan tâm nhỏ mỗi ngày: một tin nhắn hỏi han, bữa cơm cùng nhau.');
      } else {
        items.push('Khi có bất đồng: nói chuyện trực tiếp, không nhắn tin lúc đang nóng giận.');
        items.push('Lắng nghe trước khi giải thích, tránh nhắc lại chuyện cũ.');
        items.push('Dành thời gian riêng để mỗi người bình tĩnh; nếu căng thẳng kéo dài, nhờ người tin cậy hoặc chuyên gia tư vấn.');
      }
      if (ky) items.push(`Có Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: dễ hiểu lầm vì lời nói hoặc chuyện tiền bạc chung; nói rõ ràng, minh bạch.`);
      if (loc) items.push(`Có Hóa Lộc ${hoaWhen(ctx.factors, 'Hóa Lộc', when)}: nền tình cảm có phúc; một món quà nhỏ hay lời cảm ơn sẽ được đón nhận.`);
      if (stars.includes('贪狼') || stars.includes('廉贞')) items.push('Lá số dễ có người thứ ba để ý: giữ ranh giới rõ với người khác giới.');
      out.push({ icon: '💡', title: `Đề xuất tình cảm ${when}`, items });
      break;
    }
    case '疾厄': {
      const parts = [...new Set([...stars, ...(p?.stars.filter(s => SHA.includes(s.name)).map(s => s.name) ?? [])]
        .map(s => HEALTH[s]).filter(Boolean).join(', ').split(', '))];
      const items: string[] = [];
      if (parts.length) items.push(`Bộ phận nên để ý theo lá số: ${parts.join(', ')}.`);
      if (female) items.push('Là nữ: nên khám phụ khoa và tầm soát vú định kỳ mỗi năm.');
      items.push('Nên kiểm tra định kỳ: công thức máu, đường huyết, mỡ máu, chức năng gan thận.');
      out.push({ icon: '🩺', title: `Nên kiểm tra (Tật Ách có ${starNames})`, items, note: 'Gợi ý theo lá số, không thay thế chẩn đoán của bác sĩ.' });
      const now: string[] = [];
      if (lv === 'xau' || ky) {
        now.push(`Sức khỏe ${when} cần giữ: ngủ trước 23h, ăn nhẹ, hạn chế rượu bia và đồ cay nóng.`);
        if (parts.length) now.push(`Nếu thấy khó chịu ở ${parts.slice(0, 3).join(', ')} thì nên đi khám sớm, đừng tự chữa.`);
        now.push('Đi lại cẩn thận, tránh làm việc quá sức.');
      } else if (lv === 'binh') {
        now.push('Duy trì vận động nhẹ 30 phút mỗi ngày, uống đủ nước.');
      } else {
        now.push(`Thể lực ${when} tốt: hợp bắt đầu thói quen tập luyện mới hoặc đặt lịch khám tổng quát.`);
      }
      out.push({ icon: '💡', title: `Đề xuất sức khỏe ${when}`, items: now });
      break;
    }
    case '福德': {
      out.push({
        icon: '💡', title: `Đề xuất tinh thần ${when}`,
        items: lv === 'xau' || ky
          ? ['Dễ lo nghĩ: viết ra giấy điều đang lo và việc có thể làm ngay.', 'Thiền, đi bộ, nghe nhạc nhẹ 15–20 phút trước khi ngủ.', 'Hạn chế lướt mạng xã hội buổi tối.']
          : ['Tinh thần ổn định: dành thời gian cho sở thích, đọc sách, gặp bạn bè thân.', 'Hợp đi lễ chùa, làm việc thiện, tĩnh tâm.'],
      });
      break;
    }
    case '田宅':
      out.push({
        icon: '💡', title: `Đề xuất nhà cửa ${when}`,
        items: lv === 'tot' && !ky
          ? ['Hợp xem nhà, ký giấy tờ nhà đất, sửa sang, mua sắm đồ gia dụng lớn.', 'Dọn dẹp, sắp xếp lại không gian sống để đón năng lượng mới.']
          : ['Chưa nên mua bán, động thổ hay chuyển nhà; nếu bắt buộc thì đọc kỹ giấy tờ pháp lý.', 'Kiểm tra điện nước, khóa cửa, đồ đạc dễ hỏng.'],
      });
      break;
    case '子女':
      out.push({
        icon: '💡', title: `Đề xuất con cái ${when}`,
        items: lv === 'xau' || ky
          ? ['Để ý sức khỏe và việc học của con, hỏi han nhẹ nhàng thay vì trách mắng.', 'Hạn chế cho con đi xa, chơi thể thao mạo hiểm.']
          : ['Hợp đưa con đi chơi, cho con học thêm kỹ năng mới.', 'Khen ngợi và ghi nhận cố gắng của con.'],
      });
      break;
    case '父母':
      out.push({
        icon: '💡', title: `Đề xuất với bề trên, cha mẹ ${when}`,
        items: lv === 'xau' || ky || xung
          ? ['Gọi điện hỏi thăm cha mẹ; nhắc bố mẹ đi khám sức khỏe định kỳ.', 'Với cấp trên: báo cáo rõ ràng, tránh tranh luận.', 'Giấy tờ, hợp đồng cần đọc kỹ trước khi ký.']
          : ['Hợp xin ý kiến, nhờ cấp trên hoặc người lớn hỗ trợ.', 'Hợp nộp hồ sơ, làm thủ tục hành chính.'],
      });
      break;
    case '迁移':
      out.push({
        icon: '💡', title: `Đề xuất đi lại, ra ngoài ${when}`,
        items: lv === 'tot'
          ? ['Hợp đi công tác, gặp khách hàng ở xa, tham gia sự kiện, du lịch.', 'Mở rộng quan hệ ngoài môi trường quen thuộc.']
          : lv === 'binh'
            ? ['Đi lại bình thường; ưu tiên gặp gỡ trong thành phố, lịch trình gọn.', 'Giữ lời ăn tiếng nói ở nơi đông người.']
            : ['Hạn chế đi xa; nếu đi thì kiểm tra xe, giấy tờ, mua bảo hiểm du lịch.', 'Giữ lời ăn tiếng nói ở nơi đông người.'],
      });
      break;
    case '仆役':
      out.push({
        icon: '💡', title: `Đề xuất bạn bè, đồng nghiệp ${when}`,
        items: lv === 'tot' && !ky
          ? ['Hợp làm việc nhóm, nhờ bạn bè giới thiệu cơ hội, tuyển người.', 'Mời cà phê một người bạn lâu chưa gặp.']
          : ['Cẩn thận lời hứa của người ngoài; không cho vay, không góp vốn khi chưa rõ ràng.', 'Giữ bí mật công việc.'],
      });
      break;
    case '兄弟':
      out.push({
        icon: '💡', title: `Đề xuất anh chị em, cộng sự ${when}`,
        items: lv === 'tot'
          ? ['Hợp bàn chuyện hợp tác với người thân, cộng sự ngang hàng.', 'Họp mặt gia đình, kết nối anh chị em.']
          : ['Tránh vay mượn, góp vốn với người thân lúc này.', 'Nếu có hiểu lầm, chủ động nói chuyện thẳng thắn.'],
      });
      break;
    case '命宫':
      out.push({
        icon: '💡', title: `Đề xuất cho bản thân ${when}`,
        items: lv === 'tot'
          ? ['Tinh thần và sức bật tốt: hợp đặt mục tiêu mới, ra quyết định quan trọng.', `Phát huy điểm mạnh của ${starNames}.`]
          : lv === 'binh'
            ? ['Giữ nhịp đều, làm theo kế hoạch đã định.', 'Dành 10 phút cuối ngày nhìn lại việc đã làm.']
            : ['Dễ mệt và nóng vội: nghỉ ngơi đủ, hoãn quyết định lớn.', 'Làm từng việc nhỏ, tránh ôm đồm.'],
      });
      break;
  }

  // ───── Cách hóa giải khi cung xấu ─────
  const shaHere = p?.stars.filter(st => SHA.includes(st.name)).map(st => st.name) ?? [];
  const tuanTriet = p?.stars.some(st => ['旬空', '截路', '空亡'].includes(st.name)) ?? false;
  const needRemedy = lv === 'xau' || ky || xung;
  if (needRemedy) {
    const why: string[] = [];
    if (ky) why.push(`Hóa Kỵ ${hoaWhen(ctx.factors, 'Hóa Kỵ', when)}: chậm lại, kiểm tra kỹ mọi việc của cung này, giảm kỳ vọng và nói rõ ràng để tránh hiểu lầm.`);
    if (xung) why.push('Bị xung: tránh khởi sự việc lớn trong thời điểm xung; nếu được, dời sang ngày hợp tuổi (xem mục Lịch vận hạn).');
    for (const sh of shaHere) if (SHA_REMEDY[sh]) why.push(SHA_REMEDY[sh]);
    if (tuanTriet) why.push('Cung gặp Tuần/Triệt: việc của cung này thường đến chậm hoặc bị chặn; đừng nóng vội, kiên trì sẽ qua.');
    out.push({
      icon: '🛡', title: 'Cách hóa giải',
      items: [...why, ...(REMEDY[key] ?? [])],
    });
    out.push({
      icon: '🪷', title: 'Hóa giải theo quan niệm dân gian (tham khảo)',
      items: [
        `Dùng màu hợp mệnh ${element} (${LUCKY_COLORS[element]}) cho trang phục, vật dụng hằng ngày.`,
        `Làm việc thiện: ${KIND_ACT[key] ?? 'giúp đỡ người khác một việc nhỏ mỗi ngày'}.`,
        'Giữ nhà cửa sạch sẽ, thông thoáng; sống chậm và giữ tâm an.',
      ],
      note: 'Mang tính văn hóa, giúp tâm an; việc thực tế ở mục trên mới là chính.',
    });
  }
  return out;
}

/** Một gợi ý ngắn gọn nhất cho thẻ lĩnh vực / bản tin. */
export function topSuggestion(groups: SuggestionGroup[]): string | undefined {
  const g = groups.find(x => x.title.startsWith('Đề xuất')) ?? groups[0];
  return g?.items[0];
}

/**
 * Chọn cung để đề xuất cho một lĩnh vực gồm nhiều cung: lĩnh vực đang tốt thì lấy
 * cung tốt nhất (cơ hội), đang xấu thì lấy cung yếu nhất (cảnh báo), còn lại lấy cung chính.
 */
export function pickDomainPalace<T extends { key: string; score: number }>(domainScore: number, palaces: T[]): T | undefined {
  if (!palaces.length) return undefined;
  const ranked = [...palaces].sort((a, b) => b.score - a.score);
  if (domainScore >= 58) return ranked[0];
  if (domainScore < 46) return ranked[ranked.length - 1];
  return palaces[0];
}
