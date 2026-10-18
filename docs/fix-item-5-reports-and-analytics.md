# Fix item 5 - Báo cáo & Thống kê

Ngày hoàn thành: 17/10/2026

## Yêu cầu

- Kiểm tra mục Báo cáo thống kê của Manager hiện có lỗi gì không và fix.
- Sửa lại phần báo cáo "TOP PERFORMERS" / Điểm nhấn vận hành kiểu khác, loại bỏ cảm giác "AI quá" (văn mẫu tự động, thiếu tính thực tiễn).
- Gợi ý và thêm những gì liên quan đến báo cáo cần thiết để Manager quản lý trung tâm (Đồng bộ cả FE, BE, nhất là truy vấn SQL cho đúng).
- Chức năng xuất CSV xuất bản doanh thu và đối soát đẹp mắt, có cấu trúc bảng biểu và định dạng số, tiền tệ, không chỉ là text đơn thuần.
- Báo cáo số lượng nhân viên, học viên... chi tiết và theo dõi sát sao.

## Nguyên nhân lỗi ban đầu được phát hiện & khắc phục

1. **Lỗi biên dịch & 404 Endpoint `/reports/operations`**:
   - `ReportService.cs` dòng 270 sử dụng tên biến `from` trong biểu thức LINQ `session.SessionDate >= from`, dẫn đến lỗi biên dịch C# `CS1525: Invalid expression term 'from'` do xung đột từ khóa LINQ query comprehension.
   - Do lỗi biên dịch nên Backend chạy bản build cũ thiếu route `/reports/operations`, dẫn đến lỗi `HTTP 404 Not Found` trên trình duyệt khi Manager mở trang Báo cáo.
   - **Khắc phục**: Đổi tên tham số thành `@from` (hoặc `rangeFrom`), dọn process chạy nền cũ và rebuild Backend thành công 100%.

2. **Truy vấn SQL phức tạp ở EF Core**:
   - Truy vấn ca học ban đầu join trực tiếp nhiều bảng lồng nhau với subquery tính số người đăng ký khiến EF Core gặp khó khăn khi sinh SQL tối ưu.
   - **Khắc phục**: Tách biệt rõ ràng 2 bước: Bước 1 tải danh sách session trong kỳ (`AsNoTracking`), Bước 2 gom nhóm và tính toán thống kê khối lượng ca dạy, lớp học, phòng tập và huấn luyện viên với hiệu năng cao.

## Đã bổ sung & nâng cấp

### 1. Đồng bộ Backend & SQL (3-layer Architecture)
- **Hội viên & Gói tập (`GetMembershipReportAsync`)**:
  - Tính toán chính xác: `totalMembers`, `activeMembers` (còn hạn), `expiredMembers` (đã hết hạn gói), `inactiveMembers` (chưa từng mua gói), `newMembers` (tạo mới trong kỳ).
  - Phân tích chi tiết từng gói hội viên (`MembershipPackageStatsItem`): số người đang sở hữu gói (`activeSubscribers`), số lượt mua mới trong kỳ (`soldInPeriod`), và doanh thu thực tế tương ứng trong kỳ (`revenueInPeriod`).
- **Năng suất Huấn luyện viên (`GetOperationsReportAsync`)**:
  - Bổ sung danh sách chi tiết `topCoaches` (`OperationalCoachItem`): ID, họ tên, chuyên môn, số lớp phụ trách, số ca đã dạy trong kỳ, tổng học viên tiếp nhận, tổng sức chứa và tỷ lệ lấp đầy ca học.

### 2. Thiết kế lại phần TOP PERFORMERS (Khắc phục "AI quá")
- Thay vì các thẻ màu tối với khuyến nghị tự động mang tính văn mẫu ("Khuyến nghị AI: Chưa đủ ngưỡng 80% để kết luận..."):
  - **Bảng Chỉ Số Vận Hành Trọng Yếu (4 Trụ Cột Hoạt Động)**:
    1. *Lớp học đông nhất*: Tên lớp, bộ môn, phòng học, HLV, lượt đặt/sức chứa, tỷ lệ lấp đầy.
    2. *Bộ môn doanh thu số 1*: Tên môn, doanh thu thuần, tiền đã hoàn, tỷ trọng doanh thu toàn trung tâm.
    3. *HLV năng suất nhất*: Tên HLV, chuyên môn, số lớp, số ca dạy thực tế, lượng học viên giảng dạy, tỷ lệ lấp đầy lớp.
    4. *Sân / Phòng sử dụng nhiều nhất*: Tên sân, loại phòng, số ca tổ chức, lượt khách tiếp nhận, tỷ lệ khai thác.
  - **Ma Trận Cảnh Báo Tải Vận Hành & Khuyến Nghị Tác Vụ Quản Lý**:
    - *Cảnh báo tải cao (≥ 80% công suất)*: Liệt kê đích danh các lớp sắp/đã kín chỗ kèm hành động cụ thể (mở thêm khung giờ ca mới hoặc đổi phòng lớn hơn).
    - *Cảnh báo dưới tải (< 40% công suất)*: Liệt kê các lớp ít học viên kèm hành động cụ thể (chạy ưu đãi trải nghiệm, ghép ca học).
    - *Hạ tầng sân bãi & Giữ chân hội viên*: Cảnh báo sân có tỷ lệ khai thác thấp nhất và số lượng hội viên hết hạn cần đội ngũ Lễ tân gọi chăm sóc gia hạn.

### 3. Nguồn lực Nhân sự, Hội viên & Cơ sở vật chất (360 độ)
- **Top KPI Cards**:
  - Doanh thu thuần (Tổng thu & hoàn tiền).
  - Học viên & Hội viên (`Active / Total`, số hết hạn, số đăng ký mới).
  - Đội ngũ nhân sự (`Active / Total`, số HLV, Lễ tân, Quản lý).
  - Check-in & Lấp đầy (Lượt check-in hôm nay, % lấp đầy lớp).
- **Lưới 8 thẻ nguồn lực trung tâm**: Nhân sự tổng, HLV, Lễ tân, Quản lý, Hội viên có gói, Hội viên hết hạn, Lớp hoạt động, Sân & Phòng.

### 4. Bổ sung 2 Tab tra cứu chuyên sâu trong Bảng Chi Tiết
- **Tab 👨‍🏫 Năng Suất Huấn Luyện Viên**:
  - Bảng thống kê chi tiết từng HLV với ảnh đại diện, mã HLV, môn thể thao, số lớp, số ca dạy, lượng học viên, tỷ lệ lấp đầy lớp (thanh progress bar màu), đánh giá tải (🔥 Lịch dày / ✅ Ổn định / ⚠️ Nhận thêm ca).
  - Có ô tìm kiếm theo tên/chuyên môn và sắp xếp theo Học viên / Số ca / % Lấp đầy.
- **Tab 💳 Gói Tập & Hội Viên**:
  - Dải tóm tắt: Tổng số gói, Hội viên đang dùng, Hội viên hết hạn, Doanh thu từ gói trong kỳ.
  - Bảng thống kê chi tiết từng gói tập: Thời hạn, đơn giá niêm yết, số hội viên đang dùng, lượt bán mới trong kỳ, doanh thu thuần và tỷ trọng doanh thu.
  - Có ô tìm kiếm theo tên gói và sắp xếp theo Doanh thu / Lượt bán / Số HV.

### 5. Nâng cấp Xuất Báo Cáo Doanh Thu (CSV & Excel)
- **Xuất CSV (.csv)**:
  - Bổ sung UTF-8 BOM (`\uFEFF`) giúp mở trực tiếp bằng Microsoft Excel mà không bị lỗi font tiếng Việt.
  - Không đơn thuần là text thô: Được cấu trúc thành từng phần rõ ràng với tiêu đề phân mục, thông tin trung tâm, khoảng ngày đối soát.
  - Có đầy đủ các bảng con:
    1. Bảng đối soát doanh thu theo mốc thời gian (Kỳ, Doanh thu thuần, Thu gross, Hoàn tiền, Đơn vị tiền tệ).
    2. Bảng cơ cấu hội viên và nhân sự trung tâm.
    3. Bảng thống kê doanh thu theo từng gói hội viên.
    4. Bảng doanh thu theo từng bộ môn thể thao.
    5. Bảng năng suất và số ca dạy của Huấn luyện viên.
    6. Bảng hiệu suất khai thác của từng lớp học và sân bãi.
  - Xử lý an toàn công thức (chống CSV Injection), bọc dấu ngoặc kép chuẩn RFC 4180 và định dạng tiền tệ Việt Nam (`1.500.000 đ`).
- **Xuất Excel (.xls)**:
  - Bảng tính XML chuẩn hóa định dạng màu sắc theo nhận diện thương hiệu Olympic, phân vùng rõ ràng bảng doanh thu, phân bổ bộ môn, hiệu suất lớp học, năng suất HLV và doanh thu gói tập.

## Xác minh & Kiểm thử

1. **Frontend Unit Tests**: Chạy `npm test` -> **57/57 test cases PASS**.
2. **Frontend Production Build**: Chạy `npm run build` -> Hoàn tất trong **3.82s**, không có lỗi cú pháp JSX hay bundle.
3. **Backend Live API Tests**: Chạy `tests/api-live.cjs` -> **50/50 checks PASS**, 91/91 live HTTP requests thành công.
4. **Kiểm tra dữ liệu thực tế trên SQL Server**: Xác thực khớp 14 HLV, 5 gói hội viên, 27 hội viên (5 active, 1 expired, 21 inactive) và doanh thu đối soát chính xác 100%.
