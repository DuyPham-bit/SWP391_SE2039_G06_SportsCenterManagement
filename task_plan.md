# Task Plan

## Milestone 22: Chuyển Đổi Sang Biểu Đồ Miền (Area Chart) Cho Dòng Tiền & Doanh Thu Card 1 — ĐANG THỰC HIỆN (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "thay bằng bản đồ miền cho tôi" (ảnh chụp `media_1794222471738_3cd439c7.jpg`), thay thế hoàn toàn các cột hình chữ nhật rời rạc (stalagmites/spikes) bằng **Biểu đồ miền (Gradient Area Chart)** mượt mà, uyển chuyển theo tiêu chuẩn tài chính quốc tế (Stripe, Robinhood, Apple Health).

### 1. Phân tích giải pháp kỹ thuật & So sánh (Brainstorming):
- **Hiện trạng**: Biểu đồ cột lai đường spline. Doanh thu phát sinh theo từng ngày rời rạc (cách 2-3 ngày 1 lần), khiến các cột chữ nhật trông giống các chóp nhọn rời rạc (mấp mô, thiếu tính liên tục dòng tiền).
- **Giải pháp chuyển sang Biểu đồ miền (Area Chart)**:
  - **Phương án A: Stacked Area Chart (Miền xếp chồng)**:
    - *Ưu điểm*: Thể hiện các thành phần doanh thu xếp chồng.
    - *Nhược điểm*: Khi các mốc ngày có nhiều ngày 0 đồng, các dải xếp chồng bị đè phẳng xuống đáy, dễ gây rối mắt.
  - **Phương án B: Luminous Dual-Tone Gradient Area Chart (Biểu đồ miền phát sáng đa tầng - KHUYẾN NGHỊ)**:
    - *Ưu điểm*:
      1. Miền doanh thu gộp (Gross Revenue) uốn lượn mượt mà Fritsch-Carlson từ trái sang phải, đổ màu dải gradient Emerald Teal (`#14B8A6` -> `#0D9488` -> `#0F766E` với opacity mờ dần xuống đáy).
      2. Đường viền đỉnh thực thu ròng (Net Profit) vắt ngang dải miền bằng dải ribbon vàng hổ phách (`#E5A33C`) sắc nét với hiệu ứng đổ bóng phát sáng `drop-shadow`.
      3. Điểm hoàn tiền (Refunds) được đánh dấu bằng các nốt ngọc đỏ san hô (`#EF4444`) tỏa vầng sáng (pulse halo).
      4. Tích hợp thanh quét dọc Crosshair tương tác mượt mà khi di chuột qua bất kỳ ngày nào trên biểu đồ.
      5. Thẻ đỉnh mốc kỷ lục `⭐ 5.8 tr` neo chính xác trên đỉnh miền cao nhất (sửa triệt để lỗi hiển thị dấu `$`).
- **Quyết định**: Triển khai **Phương án B** theo đúng triết lý của `ux-ui-promax`.

### 2. Các bước thực thi chi tiết (Implementation Plan):
- [ ] **Bước 1: Cập nhật hàm `TwelveMonthRevenueExpensesProfitChart` trong `ManagerOverviewCharts.jsx`**:
  - Chuyển đổi toàn bộ cơ chế vẽ từ cột chữ nhật (`<rect>`) sang Biểu đồ miền (`<path d={areaPath} fill="url(#revAreaGrad)" />`).
  - Đường biên trên sử dụng Fritsch-Carlson Monotone Spline với stroke Emerald Teal sắc nét (`stroke="#0D9488" strokeWidth="2.8"`).
  - Đường thực thu ròng sử dụng nét vàng Hổ phách (`#E5A33C" strokeWidth="2.2"`).
  - Điểm giao dịch ngọc trai ngà viền trắng tại các đỉnh có doanh thu; điểm hoàn tiền đỏ san hô tại ngày có hoàn tiền.
  - Sửa lỗi hiển thị peak badge: `⭐ 5.8 tr` (không có ký tự `$` thừa).
  - Tích hợp Crosshair tương tác: đường quét dọc nét đứt `line` + điểm sáng đa tầng khi rê chuột.
  - Cập nhật Legend phụ đề: `■ Miền doanh thu` · `— Thực thu ròng` · `● Điểm hoàn tiền`.
- [ ] **Bước 2: Kiểm thử Unit Tests**:
  - Chạy `npm --prefix Frontend test` (phải đảm bảo 153/153 tests pass).
- [ ] **Bước 3: Biên dịch Vite & Build Production**:
  - Chạy `npm --prefix Frontend run build`.
- [ ] **Bước 4: Tái khởi động Docker container `scms-frontend` (cổng 3004)**:
  - `docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build frontend`.
- [ ] **Bước 5: Xác minh dữ liệu & Đồ thị Graphify**:
  - Xác nhận cơ sở dữ liệu giữ nguyên 7 hội viên (`TotalMembers = 7`).
  - Refresh AST Graphify index.
- [ ] **Bước 6: Cập nhật tài liệu tiến độ & Hướng dẫn người dùng**.

---

## Milestone 21: Phóng To Toàn Diện & Khớp Đỉnh Đường Spline Biểu Đồ Doanh Thu Card 1 ("Biến Động Doanh Thu Theo Thời Gian") — HOÀN THÀNH (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "DES lại cái này luôn và phóng to ra cho vừa" (ảnh chụp `media_1794221698704_8b139e16.png`), loại bỏ khoảng trống thừa trần khổng lồ, phóng to cột biểu đồ lên tầm vóc bề thế chiếm trọn chiều cao thẻ, sửa lỗi đường spline thực thu bị tách rời khỏi đỉnh cột, và đảm bảo nhãn ngày trục X (DD/MM) hiển thị 100% không bị cắt.

### Các hạng mục thực thi:
- [x] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) tái cấu trúc hình học Biểu đồ Card 1**:
  - **Tối ưu hình học Canvas ("Phóng to ra cho vừa")**:
    - Nâng tỷ lệ hiển thị SVG với `chartWidth = 720`, `chartHeight = 340` (tỷ lệ 2.12 thay vì dẹp 2.45).
    - `niceMax = 6.0 tr` (thay vì 7.5 tr hoặc 10.0 tr): Cột doanh thu đạt đỉnh 5.8 tr chiếm trọn **96.7% chiều cao canvas** (`innerHeight = 260px`), xoá bỏ hoàn toàn khoảng trống trần lơ lửng.
    - Cột doanh thu đĩnh đạc, bề thế rộng 16–18px với gradient đa tầng Emerald Teal kết hợp bo góc `rx="5" ry="5"`.
  - **Khớp đỉnh Đường Spline Thực Thu & Nốt Ngọc Trai**:
    - Sử dụng thuật toán nội suy đường cong Fritsch-Carlson Monotone trực tiếp từ giá trị thực thu ròng ngày thay vì bộ lọc trung bình trượt làm tụt đỉnh.
    - Đỉnh đường cong vàng Hổ Phách `#E5A33C` đi xuyên suốt qua đỉnh các cột doanh thu thực tế, các nốt ngọc trai ngà viền trắng đính chuẩn xác ngay tại điểm mút của cột và đường.
  - **Hiển thị nhãn Trục X (DD/MM) sắc nét, không bị che khuất**:
    - Tăng `paddingBottom = 48px`, đặt nhãn ngày tại `y = baselineY + 20 = 312px` (đầy đủ 28px khoảng sáng phía dưới), bảo đảm hiển thị trọn vẹn mọi nhãn ngày `DD/MM`.
  - **Thu gọn dải thẻ KPI điều hành thành Viên nhộng (Capsules)**:
    - 3 thẻ mini (Thực thu ròng, Doanh thu gộp, Đã hoàn tiền) chuyển đổi từ dạng khối chữ nhật cao ~130px sang dạng viên nhộng tinh giản cao ~56px (`px-3 py-2 rounded-xl flex items-center gap-2.5`).
    - Tiết kiệm 70px chiều cao cho thẻ, chuyển toàn bộ không gian quý giá để biểu đồ cột phóng to tối đa.
- [x] **Kiểm thử & Rebuild**:
  - `npm --prefix Frontend test`: 153/153 tests pass.
  - `npm --prefix Frontend run build`: Bundle Vite build thành công (16.21s).
  - Docker frontend container `scms-frontend` (cổng 3004) được build và khởi động lại sạch sẽ.
- [x] **Bảo toàn cơ sở dữ liệu**:
  - Xác nhận cơ sở dữ liệu giữ nguyên đúng **7 hội viên** (`TotalMembers = 7`), không phát sinh tài khoản rác.
- [x] **Đồng bộ Graphify Code Index**:
  - Chạy `graphify extract` refresh AST index (5303 nodes, 16549 edges).

---

## Milestone 17: Tái thiết kế UI/UX Row 2 Analytics Cards (Donut, Sport Occupancy, Radial Gauge, Member Health) — HOÀN THÀNH (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "DES lại cái này luôn" (ảnh chụp Row 2 gồm 4 thẻ phân tích vận hành), xóa bỏ hoàn toàn hiện tượng khoảng trắng trống trải, thay thế các mã chữ cái viết tắt khó hiểu bằng tên & icon môn thể thao chuẩn chỉ, bổ sung các dải thẻ chỉ số vận hành điều hành thực tế.

### Các hạng mục thực thi:
- [x] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) tái cấu trúc 4 thẻ phân tích**:
  - **Thẻ 1: Trạng thái sân bãi & phòng tập (`RoomStatusDonutChart`)**:
    - Donut chart kích thước 136px thanh thoát, viền bo tròn (`strokeLinecap="round"`), tâm hiển thị 10 sân & phòng kèm badge "100% Khả dụng".
    - Bổ sung dải 2 thẻ chỉ số vận hành mini: `10 sân đang có lớp` (icon `sports_score` teal) và `0 sân trống` (icon `meeting_room` navy).
    - Chân thẻ: Chỉ báo nhịp tim pulse `10/10 sân mở lớp · Sẵn sàng 100%`.
  - **Thẻ 2: Lấp đầy theo bộ môn (`FacilityOccupancyBars`)**:
    - Xóa bỏ hoàn toàn các mã viết tắt khó hiểu (`BL`, `GF`, `YP`, `BV`, `CL`, `BB`, `BĐ`...).
    - Thay thế bằng **Tên bộ môn đầy đủ** (Bơi lội, Yoga & Pilates, Gym & Fitness, Boxing & Võ thuật, Cầu lông...) kèm **Icon thể thao chuyên biệt** (`pool`, `fitness_center`, `self_improvement`, `sports_mma`, `sports_tennis`).
    - Hiển thị xếp hạng Top `#1`–`#5` bộ môn có lượt đặt với thanh tiến độ gradient màu riêng biệt của từng bộ môn, số liệu rõ ràng `16.8% (56/334 chỗ)`.
    - Các môn chưa có lượt đặt (0%) được gom gọn trong nút toggle `+5 môn khác (0%)`, không chiếm dụng chiều cao vô lý.
  - **Thẻ 3: Tỷ lệ lấp đầy trung tâm (`PeriodCollectionRadialGauge`)**:
    - Thiết kế lại Gauge hình cung tròn 240° hiện đại, dải gradient Hổ phách - Ngọc lục bảo nổi bật (`#E5A33C`).
    - Bổ sung 2 chip chỉ số: `199 lượt đặt` (icon `event_available`) và `87 ca học mở` (icon `schedule`).
    - Chân thẻ: Tỷ lệ bình quân `~2.3 HV/ca · Toàn cơ sở`.
  - **Thẻ 4: Tình trạng gói tập hội viên (`MemberDocumentsStackedBars`)**:
    - Chuyển đổi từ 2 thanh trơ trọi thành Bảng sức khỏe gói tập toàn diện:
      - 2 ô chỉ số KPI đầu thẻ: `7/7 Có gói tập (100%)` và `7/7 Gói đang hiệu lực (100%)`.
      - 2 thanh tiến độ phân đoạn sắc nét: Trạng thái gói (100% có gói) & Thời hạn sử dụng (100% còn hạn).
      - Chân thẻ: Chỉ số giữ chân hội viên `Giữ chân 100% · 7 hội viên hoạt động tốt`.
  - Chiều cao cả 4 thẻ đạt độ cân xứng hoàn hảo, xóa sạch 100% khoảng trống thừa.
- [x] **Kiểm thử & Rebuild**:
  - `npm --prefix Frontend test`: 153/153 tests pass.
  - Rebuild Docker container `scms-frontend` (cổng 3004).
- [x] **Đồng bộ Graphify Code Index**:
  - Refresh AST code extraction.

---

## Milestone 16: Tối ưu UI/UX "Cột To Rõ" cho Biểu đồ Biến Động Doanh Thu (`TwelveMonthRevenueExpensesProfitChart`) — HOÀN THÀNH (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "cột này cho rõ đi khó nhìn des lại cho to rõ", khắc phục triệt để hiện tượng cột doanh thu mỏng như kim chỉ (~7px) bị đè chìm bởi đường spline và khoảng trắng trống trải vô lý ở phần trên thẻ.

### Các hạng mục thực thi:
- [x] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) thiết kế lại toàn diện biểu đồ cột kết hợp đường**:
  - **Kích thước cột ("To rõ")**:
    - Nâng bề rộng cột đơn từ ~7.4px lên **15px** (gấp đôi kích thước, chiếm 65% slot ngày).
    - Cột kép (ngày có hoàn tiền): chia tách trực quan 2 cột 10px (Doanh thu) + 10px (Hoàn tiền) với khoảng cách 2px.
    - Bo góc đỉnh cột mềm mại hiện đại: `rx="4" ry="4"`.
    - Thêm thanh định vị đáy mờ (`Baseline Slot Indicator`) cho cả các ngày 0 đồng để biểu đồ có nhịp điệu thời gian sắc sảo.
  - **Màu sắc & Gradient**:
    - Cột doanh thu: Gradient Emerald Teal đa tầng (`#2DD4BF` -> `#0F766E`), đổ bóng `drop-shadow(0 2px 4px rgba(15, 118, 110, 0.25))` khi tĩnh và bừng sáng `drop-shadow(0 4px 10px rgba(45, 212, 191, 0.5))` khi hover.
    - Cột hoàn tiền: Gradient Rose/Coral (`#F87171` -> `#DC2626`).
    - Đường Thực thu ròng: Spline vàng hổ phách (`#E5A33C`, `strokeWidth="2.8"`), điểm ngọc trai ngà viền trắng tại các mốc có giao dịch.
    - Đỉnh doanh thu cao nhất (5.8 tr): Hiển thị Huy hiệu nổi `5.8 tr` gắn trực tiếp trên đỉnh cột cao nhất để nhà quản lý nhận diện tức thì mà không cần rê chuột.
  - **Mở rộng chiều cao canvas & Tối ưu tỷ lệ trục Y**:
    - Nâng `chartHeight` từ 220px lên **310px** (`innerHeight` tăng 52% từ 164px lên 250px).
    - Loại bỏ `max-h-[220px]`, mở rộng container trong `ManagerDashboard.jsx` lên `min-h-[310px] justify-center`, xóa bỏ 100% khoảng trống thừa bên trên.
    - Hiệu chỉnh thuật toán `niceMax`: Với đỉnh doanh thu 5.8 triệu, `niceMax` định hình chính xác ở mức **7.5 triệu** (thay vì bị làm tròn vọt lên 10 triệu như trước). Cột cao nhất vươn tới **77.3%** chiều cao canvas, tạo cảm giác đĩnh đạc, bề thế và rõ nét.
  - **Tooltip Glassmorphism & Tương tác**:
    - Rê chuột vào từng ngày: Bật cột đèn nền mờ spotlight, nổi bật thông tin Ngày (DD/MM), Thu (tr), Hoàn (tr) và Thực thu (tr) với icon chỉ thị tương ứng.
- [x] **Kiểm thử & Biên dịch**:
  - `npm --prefix Frontend test`: 153/153 tests pass.
  - Rebuild Docker container `scms-frontend` (cổng 3004).
- [x] **Graphify Code Index**:
  - Refresh AST code extraction.

---

## Milestone 15: Fix UX/UI Dashboard Quản Lý: Trực quan hóa Lượt đặt lớp học & Dòng tiền tự nhiên — HOÀN THÀNH (2026-11-09)
Mục tiêu: Khắc phục triệt để lỗi đè chữ, chữ chồng lấn unreadable tại biểu đồ "Lượt đặt theo lớp học", đồng thời tối ưu chuỗi dữ liệu doanh thu tự nhiên, loại bỏ các đỉnh nhọn dị thường trên biểu đồ "Biến động doanh thu theo thời gian".

### Các hạng mục thực thi:
- [x] **Áp dụng Design Intelligence (`ux-ui-promax`) thiết kế lại hoàn toàn Row 3**:
   - **Thẻ 1 (Doanh thu theo thời gian - 6 cols)**: Bổ sung dải 3 thẻ thống kê Executive KPI (`Thực thu ròng`, `Doanh thu gộp`, `Đã hoàn tiền`), mở rộng chiều cao biểu đồ sóng Fritsch-Carlson, xóa bỏ 100% khoảng trống trắng vô lý trước đó.
   - **Thẻ 2 (Doanh thu theo bộ môn - 3 cols)**: Chuẩn hóa hiển thị Top 6 bộ môn thể thao chính, thanh tiến độ đồng bộ `1.5px`, khoảng cách nhịp điệu cân xứng tuyệt đối với Thẻ 3.
   - **Thẻ 3 (Lượt đặt theo lớp học - 3 cols)**: Tái cấu trúc thành **Card 2 tầng thông minh**:
     - Hàng 1: Badge hạng `#1`–`#6` + Tên lớp học trọn vẹn (chiếm 70% chiều ngang thẻ, không còn bị cắt chữ `...`) + Số lượt đặt.
     - Hàng 2: Thanh tiến độ ngang màu nhấn theo bộ môn.
     - Hàng 3: Tên bộ môn và Tỷ lệ lấp đầy `{occRate}%`.
     - Xóa bỏ `justify-center` làm trôi nổi nội dung, đưa danh sách neo sát đỉnh thẻ, loại bỏ lỗi xén viền trên item #1.
   - Chiều cao cả 3 thẻ trong Row 3 đạt mức đồng bộ hoàn hảo (~370px).
- [x] **Chuẩn hóa chuỗi dữ liệu doanh thu tự nhiên trong database (`systematic-debugging`)**:
   - Khắc phục nguyên nhân gốc rễ: 12 hóa đơn trước đó bị dồn cục vào 2 ngày (2026-10-25 và 2026-10-28) tạo ra 2 cột kim nhọn 18M và 14.6M.
   - Viết và chạy script `Backend/database/update_revenue_distribution.sql` rải đều 12 giao dịch qua các ngày (cách 2-3 ngày 1 giao dịch) từ 2026-10-12 đến 2026-11-07.
   - Bổ sung 2 khoản hoàn tiền thực tế (2026-10-18 và 2026-11-05) giúp đường Thực thu và Hoàn tiền phản ánh sát thực tế.
   - Giữ nguyên số lượng 7 hội viên hiện hữu, TUYỆT ĐỐI KHÔNG thêm hội viên mới.
- [x] **Kiểm chứng Frontend & Build**:
   - `npm --prefix Frontend test` đạt 153/153 tests pass.
   - `npm --prefix Frontend run build` xuất bản bundle production sạch lỗi.
   - Rebuild và cập nhật container Docker `scms-frontend` (cổng 3004) và `scms-backend` (cổng 5000).
- [x] **Cập nhật Graphify**:
   - Refresh thành công: 5300 nodes, 16540 edges.

---

## Milestone 14: Bổ sung số liệu kinh doanh demo cho hội viên hiện có (KHÔNG tạo thành viên mới) (2026-11-09)
Mục tiêu: Đảm bảo khi khởi chạy hệ thống qua Docker (`start-docker.bat`) truy cập `http://localhost:3004`, toàn bộ hệ thống có đầy đủ số liệu vận hành sinh động (10 bộ môn, gói tập chuẩn, lớp học, lịch học, ca học, đăng ký, hóa đơn doanh thu, thanh toán VNPAY/MOMO/Tiền mặt, điểm danh, check-in vào cổng...).
RÀNG BUỘC TUYỆT ĐỐI THEO YÊU CẦU NGƯỜI DÙNG: "trừ thêm thành viên mới" -> TUYỆT ĐỐI KHÔNG INSERT thêm bất kỳ user/member_profile mới nào. Toàn bộ gói tập, hóa đơn, thanh toán, ca học được gắn trực tiếp vào danh sách hội viên hiện có trong DB.

### Các hạng mục thực thi:
1. **Cập nhật `Backend/SportsCenterManagement.DAL/Context/DbInitializer.cs`**:
   - Thêm phương thức `EnsureDemoBusinessDataAsync(SportsCenterDbContext context)`.
   - Kiểm tra idempotent qua marker `seed.demo.business-data.v2`.
   - Bổ sung đủ 4 gói tập chuẩn (`Basic 30 ngày`, `Pro 90 ngày`, `Elite 180 ngày`, `All-Access Olympic Pass 365 ngày`) nếu chưa có.
   - Bổ sung lớp học và lịch học tuần (`ClassSchedule`) cho các môn chưa có lớp (Bơi lội, Boxing, Cầu lông, Bóng đá, Bóng rổ, Bóng bàn, Pickleball, Golf).
   - Tự động sinh `ClassSession` cho 30 ngày vừa qua và 30 ngày kế tiếp.
   - Lấy danh sách hội viên hiện hữu (`existingMembers`). KHÔNG thêm hội viên mới.
   - Gắn gói tập (`MemberSubscription`), hóa đơn đã thanh toán (`Invoice` + `InvoiceItem`), giao dịch thanh toán (`Payment` - VNPAY, MOMO, CASH) trong 3 tháng qua để sinh biểu đồ doanh thu và báo cáo tài chính đầy đủ.
   - Đăng ký lớp (`ClassEnrollment`), đặt chỗ ca học (`SessionBooking`), dữ liệu điểm danh (`Attendance` - PRESENT, LATE) và lượt check-in qua cổng (`CenterCheckin`).
2. **Cập nhật `Backend/database/seed_demo_data.sql`**:
   - Loại bỏ đoạn chèn 3 thành viên demo (`demo.member01..03`).
   - Tái sử dụng bảng hội viên hiện hữu `dbo.member_profiles`.
   - Đảm bảo idempotent và thống nhất cấu trúc dữ liệu.
3. **Biên dịch & Kiểm thử Backend**:
   - `dotnet build Backend/SWP391_SE2039_G06_SportsCenterManagement1.slnx` đạt 0 lỗi compiler.
4. **Kiểm tra Frontend**:
   - `npm --prefix Frontend test` và `npm --prefix Frontend run build` đảm bảo không phát sinh lỗi.
5. **Cập nhật chỉ mục Graphify**:
   - Chạy `& "$env:USERPROFILE/.local/bin/graphify.exe" extract . --code-only --no-cluster --max-workers 2`.
6. **Báo cáo và hướng dẫn người dùng**:
   - Chạy `.\start-docker.bat` và truy cập `http://localhost:3004`.

---

## Milestone 13: Đồng bộ màu toàn Frontend theo bảng màu Landing (đã duyệt, đang làm, 2026-11-07)
Mục tiêu: mọi trang (landing, login, OTP, member, coach, counter, manager, admin, payment-result…) dùng chung một
bảng màu lấy từ landing. Chỉ đổi styling; không đổi logic, API, routing, text. Landing nhìn y hệt hiện tại.
Chi tiết khảo sát và bảng màu: findings.md §13.

### Phương án token hoá (đã so sánh)
| | A. Ghi đè palette Tailwind (`slate`→navy, `emerald`→sage… trong config) | B. Codemod đổi tên class sang `brand-*` giữ nguyên nấc + semantic token | C. Viết lại tay từng component bằng semantic token |
|---|---|---|---|
| Công sức | Rất thấp (chỉ config) | Trung bình (script + rà từng phase) | Rất cao (14.230 chỗ) |
| Rủi ro vỡ giao diện | Thấp | Thấp–trung bình (giữ nấc, có test + soát mắt) | Cao |
| Rõ nghĩa / bảo trì | Kém: `bg-emerald-500` thực ra là sage, dễ gây nhầm | Tốt: tên class nói đúng màu brand; semantic cho phần dùng chung | Tốt nhất |
| Chặn màu lạc tông về sau | Không (palette mặc định vẫn "có vẻ" dùng được) | Có: tắt palette mặc định khỏi config sau khi migrate | Có |
**Đề xuất: B**, kết hợp semantic token cho shared/ui và widgets (phase a). A chỉ dùng tạm nếu cần đồng màu ngay trong 1 bước.

### Kiến trúc token
1. `app/styles/tokens.css` (mới, nguồn duy nhất): biến kênh RGB cho 6 thang `--brand-{navy|sage|sand|terra|teal|danger}-{50..950}`
   (tĩnh, không đổi theo dark mode) + semantic token đổi theo `html.dark`:
   `--color-primary, --color-primary-hover, --color-primary-strong, --color-secondary, --color-accent, --color-accent-hover,
   --color-surface, --color-surface-muted, --color-surface-raised, --color-border, --color-text (ink), --color-text-muted,
   --color-success/-soft, --color-warning/-soft, --color-danger/-soft, --color-info/-soft, --color-focus`.
2. `tailwind.config.cjs`: `colors.brand.{navy,sage,sand,terra,teal,danger}.{50..950}` + semantic
   (`primary`, `secondary`, `accent`, `surface`, `ink`, `ink-muted`, `line`, `success`, `warning`, `danger`, `info`) dạng
   `rgb(var(--…) / <alpha-value>)` để giữ được `bg-primary/20`. Palette categorical cho biểu đồ: `chart-1..8` từ màu gốc.
3. `theme.css` + `tiya-theme.css`: bỏ định nghĩa màu trùng; `--primary-color`, `--secondary-color`, `--fpt-*`, `--p-color`…
   thành alias trỏ vào token (comment `@deprecated`). `colors.fpt.*` giữ lại, trỏ sang token, đánh dấu deprecated.
4. Sau phase cuối: bỏ palette Tailwind mặc định không còn dùng (giữ white/black/transparent/current) để chặn tái phát.

### Quy tắc map (codemod, giữ nguyên nấc 50–950, kể cả tiền tố `dark:`, `hover:`, `/opacity`)
- slate, gray, zinc, neutral, stone → `brand-navy`
- emerald, green, lime → `brand-sage` · teal, cyan → `brand-teal` · amber, yellow → `brand-sand`
- orange → `brand-terra` · rose, red, pink → `brand-danger`
- blue, sky → **(cần quyết)** · indigo, violet, purple → **(cần quyết)**
- Hex tùy ý: `[#81B29A]`→`brand-sage-500`, `[#2D6A4F]`→`brand-sage-700`, `[#F2CC8F]`→`brand-sand-300` … (bảng đầy đủ sinh từ findings §13.4);
  hex lạc tông (`[#4F46E5]`, `[#E5A33C]`…) map về nấc gần nhất của thang tương ứng.
- Nâng nấc chữ để đạt AA **(cần quyết)**: `text-brand-{sage,sand,terra,teal}-{500,600}` không có tiền tố `dark:` → `-700`.
- Inline `style` hex của biểu đồ → `chart-*` token (đọc qua `getComputedStyle` hoặc hằng số dùng chung).

### Các phase (mỗi phase: codemod → build → npm test → test trình duyệt liên quan → soát mắt light/dark → ghi progress.md)
- [x] 0. Khảo sát màu landing, thống kê baseline, sinh thang + bảng tương phản (findings §13)
- [ ] 1. Token layer: tokens.css, tailwind.config.cjs, alias deprecated trong theme.css/tiya-theme.css. Landing chưa đổi gì → so ảnh chụp trước/sau phải trùng.
- [ ] a. shared/ui + widgets (Button, Modal, Table, StatCard, BusinessAlert, Toast, Logo, app-shell Header/Sidebar/Layout, support-inbox, …) — dùng semantic token
- [ ] b. auth: login, otp-verification (+ features/auth)
- [ ] c. member-* (+ features/member-ai-chat, notifications)
- [ ] d. coach-* (+ features/coach-workspace, widgets/coach-performance)
- [ ] e. counter-* / receptionist (member-lookup, member-checkin, counter-*, receptionist-dashboard, features/counter-desk)
- [ ] f. manager-*, admin-dashboard, audit-logs, roles-permissions, payroll
- [ ] g. payment-result, landing (chỉ đổi sang token, giá trị y hệt), các trang còn lại; bỏ palette mặc định khỏi config
- [ ] Kiểm chứng cuối: build, npm test, mọi test:*:browser, grep thống kê lại so với baseline, ảnh chụp landing + 1 trang/role × light/dark

### Công cụ kiểm chứng sẽ dùng
- Ảnh chụp tự động (Chrome headless, cùng khung test trình duyệt hiện có) cho landing + 1 trang mỗi role × light/dark, trước và sau mỗi phase.
- Script đo tương phản các cặp token chính (findings §13.5) chạy lại sau khi chốt thang.
- grep baseline (findings §13.2) để báo số class mặc định còn sót.

### Quyết định đã duyệt (2026-11-07)
- Phương án **B** (codemod brand-* giữ nấc + semantic token cho shared/ui).
- blue/sky → **brand-teal** (info); indigo/violet/purple → **brand-navy** (secondary).
- Landing: **chỉnh nhẹ cho đạt AA** (muted text tối hơn chút; chữ trắng trên sage/teal/terracotta dùng nấc đậm hơn).
- **Nâng nấc chữ** text-{sage,sand,terra,teal}-{500,600} (không có dark:) → 700.

### (Lưu trữ) Câu hỏi đã trình duyệt
1. Chọn phương án B (khuyến nghị) hay A.
2. `blue/sky` và `indigo/violet/purple` map sang đâu (đề bài: primary hoặc secondary).
3. Landing: giữ y hệt kể cả 4 cặp chưa đạt AA, hay chỉnh nhẹ (`--p-color` #717275 → ~#66676B; chữ trắng trên sage/teal/terracotta → dùng nấc đậm hơn).
4. Quy tắc nâng nấc chữ 500/600 → 700 cho AA.

## Milestone 12: Frontend Feature-Sliced Design migration (Phase 1-3a done, 2026-11-07)
Goal: finish the half-done FSD migration. Real code moves out of role folders (`features/<role>`) into
FSD layers; pass-through wrappers and shim folders are removed. Behaviour and UI must not change.

Layers (upper may import lower only): app → pages → widgets → features → entities → shared.
- [x] Phase 1 — relocate files (no logic changes): script-driven `git mv` + import rewrite.
  - pages/<route-slice>/ui + index.js (one slice per route; router lazy-loads the slice index)
  - widgets: app-shell (AppLayout/Header/Sidebar), support-inbox, coach-performance, member-reminders
  - features: auth, profile-edit, notifications, media-upload, member-ai-chat, refund-review,
    coach-workspace (CoachShared), counter-desk (ReceptionistShared), payment-checkout
  - entities: session (AuthContext), permission, member, coach, membership, landing-content, catalog
  - shared: api (http/authState/api/backendApi), lib (helpers, dateTime, motion, useCountUp),
    i18n (LanguageContext), ui (+ toast)
  - app: router (+RoleGuard), styles
  - delete: old pages/ wrappers, context/, components/, shared/components/, domain wrapper folders,
    duplicate useNotifications, .js re-export twins, BOMs
- [x] Phase 1 verification: orphan scan = 0, layer-violation scan = 0, `npm test`, `npm run build`,
      browser tests.
- [x] Phase 2 — split `shared/api/backendApi.js` + `api.js` into `entities/<x>/api` (@x for member→staff, class→report; AdminDashboard + PaymentResult moved onto entity APIs; tests use tests/helpers/apiSources.cjs).
- [x] Phase 3a — extract sub-components, helpers and constants of large pages into slice ui/lib/model files;
      dedupe identical helpers (shared/lib/calendar, greeting, avatarGradient; shared/ui/gradients;
      features/coach-workspace CoachCards); delete dead code (FacilitiesTab, 3 unused charts, StatusBadge,
      QUICK_SUGGESTIONS); fix MyAttendance ReferenceError and ForgotPasswordModal window.React dependency.
- [ ] Phase 3b — split huge component functions into model/use<Page>.js hook + ui/ section components
      (browser test added before each split).
  - [x] ClassesAndRooms 2140→247, StaffManagement 1914→153, HomeContentManagement 1654→198, PayrollPage 1607→94
  - [x] Fixed: PayrollPage read non-existent useAuth().user → managers/admins never got the payroll report
  - [x] ReportsAnalytics 1580→185, Attendance 1517→235, MemberManagement 1321→133, LandingPage 1254→143,
        MemberDashboard 1215→151, AdminDashboard 1201→178, ClassScheduleView 1119→125, TeachingSchedule 1103→141,
        TrainingPlan 1082→102, CoachAssignment 1043→130, MemberCheckIn 1019→290 (all pages now < 1000 lines)
  - [x] New browser coverage: admin.browser.cjs (new), payroll, members, reports tables, attendance, teaching
        schedule, training plans, member dashboard + class schedule booking, check-in desk
  - [x] Removed vite resolve-js-to-jsx + auto-import-react plugins and window.React globals (no longer needed)
  - [ ] Optional next: ~900-line pages (SupportRequests, PackageManagement, ManagerDashboard, MySupportRequests, ...)

## Milestone 6: SCMS Flow 1 Audit & Hardening (Completed & Verified)
- [x] Map Flow 1 authentication, member ownership, membership purchase, package management, and audit seams.
- [x] Fix unauthorized counter-sale request mutating an unassigned member's `CenterId` (`MemberService.cs`).
- [x] Fix DI registration of `IBusinessClock`, `IProfileService`, and `IUserRepository` in test harness and API layer.
- [x] Execute SQL-backed verification for authentication, OTP challenge/limit, HttpOnly cookie tab isolation, password reset/change lifecycle, and tenant boundaries: PASS (107/107).

## Milestone 7: SCMS Flow 2 Audit & Hardening (Completed & Verified)
- [x] Trace class/schedule management, session booking, cancellation, staff-assisted booking, coach roster, and attendance boundaries.
- [x] Enforce explicit `CenterId` requirement for member profile self-booking in `SessionBookingService.cs` and `ScheduleSupport.cs`.
- [x] Run SQL-backed concurrency tests for overlapping coach bookings and concurrent leave requests: PASS.
- [x] Verified frontend calendar scheduling, booking state refresh, and coach business rules: PASS (145/145 frontend tests, 17/17 coach business audit).

## Milestone 8: SCMS Flow 3 Audit & Hardening (Completed & Verified)
- [x] Trace gateway initiation, signed VNPay/MoMo callback/IPN, counter collection, refund, and reporting boundaries.
- [x] Confirmed server-side amount/reference comparison, idempotency, provider-transaction uniqueness, subscription activation, refund reservation, and center-scoped report queries.
- [x] Reject VNPay callbacks whose signed `vnp_CurrCode` differs from configured currency (`VnPayService.cs`): Verified in `CoachBusinessAudit`.
- [x] Execute isolated SQL integration tests for callback replay, concurrent payment attempts, and revenue/refund aggregation: PASS (107/107 in `LogicAudit`).

## Milestone 9: SCMS Flow 4 Audit & Hardening (Completed & Verified)
- [x] Fix case-insensitive attendance matching (`CountsAsPresentAttendance`, `CountsAsAbsentAttendance` in `CoachWorkflowRules.cs`).
- [x] Add missing EF Core migration for `communication_deliveries` locking columns (`20261102120000_AddCommunicationDeliveryLocking.cs`).
- [x] Verify coach professional workspace, leave requests with replacement coach, compensation policies, and workout progress tracking: PASS (17/17 coach audit, 107/107 logic audit).

## Milestone 10: SCMS Flow 5 & 6 AI Recommendations & Assistant (Completed & Verified)
- [x] Verified clinical assessment, biometric override (BMI/underweight/overweight), safety restriction guards, and NLP parsing: PASS (19/19 in `AiSafetyAudit`).
- [x] Verified multi-account and center isolation in frontend AI chat (`MemberAIChatPopup.jsx`): PASS (145/145 frontend suite).

## Milestone 11: Production Verification & Build Synchronization
- [x] Backend solution build (`SWP391_SE2039_G06_SportsCenterManagement1.slnx`): 0 warnings, 0 errors.
- [x] Frontend automated tests (`npm test`): 145/145 PASS.
- [x] Backend verification suites executed against real SQL Server:
  - `LogicAudit`: 107/107 PASS.
  - `CoachBusinessAudit`: 17/17 PASS.
  - `AiSafetyAudit`: 19/19 PASS.
  - `TimezoneAudit`: 7/7 PASS.
- [x] Frontend production bundle built and synchronized to `Backend/SportsCenterManagement.API/wwwroot`.

---

## Milestone 19: Tái thiết kế toàn diện UI/UX Row 3 Analytics Cards (Doanh thu theo thời gian, Doanh thu theo bộ môn, Lượt đặt theo lớp học) (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "DES lại cái này luôn" (ảnh chụp Row 3 gồm 3 thẻ phân tích tài chính & vận hành), xóa bỏ hoàn toàn hiện tượng cắt cụt chữ (`...`), loại bỏ hiệu ứng "hộp lồng hộp" (box-in-box), hiển thị đầy đủ mốc ngày trục X và tạo đồ thị dòng tiền mượt mà, đĩnh đạc, chuẩn executive.

### Các hạng mục thực thi:
- [x] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) tái cấu trúc 3 thẻ Row 3**:
  - **Thẻ 1: Biến động doanh thu theo thời gian (`TwelveMonthRevenueExpensesProfitChart`)**:
    - Hiển thị đầy đủ nhãn ngày trục X (DD/MM) với `paddingBottom` và tọa độ chuẩn xác, có vạch tick định vị mờ.
    - Làm mượt đường xu hướng Thực thu ròng (dùng đường xu hướng chuyển động mềm mại hoặc spline nối tự nhiên giữa các mốc giao dịch, loại bỏ hiện tượng đâm nhọn răng cưa cắm xuống đáy 0đ).
    - Đường tham chiếu đỉnh kỳ (`Peak Revenue Reference Line`) tinh tế thay vì 2 huy hiệu trùng lặp đè lên cột.
    - Cột doanh thu to rõ (15px), gradient Emerald Teal đa tầng, phản hồi hover mượt mà với Glassmorphism tooltip.
    - 3 thẻ Executive KPI đầu thẻ: Thực thu ròng, Doanh thu gộp, Đã hoàn tiền với icon và typography font-chivo sắc nét.
  - **Thẻ 2: Doanh thu theo bộ môn (`ThreeMonthExpensesBars`)**:
    - Xóa bỏ hoàn toàn tình trạng cắt cụt tên bộ môn ("Boxing & Võ t...").
    - Chuyển từ các ô hộp lồng hộp (nested cards) sang danh sách phân đoạn sang trọng với đường phân cách thanh mảnh.
    - Layout 2 tầng: Hàng 1 (Icon thể thao squircle + Tên bộ môn trọn vẹn + Doanh thu font-chivo), Hàng 2 (Thanh tiến độ gradient thương hiệu + Chip phần trăm đóng góp).
    - Hỗ trợ toggle xem toàn bộ 9 bộ môn hoặc top 6 gọn gàng.
  - **Thẻ 3: Lượt đặt theo lớp học (`SixMonthContractExpiryBars`)**:
    - Giải quyết triệt để 100% lỗi cắt chữ (`...`) trên tên lớp học (ví dụ: "Bơi sải Kỹ thuật Olympic K1", "Yoga Phục hồi & Trị liệu Cột sống"...).
    - Huy hiệu xếp hạng chuyên biệt: 🏆 Top 1 (Gold Medal), 🥈 Top 2 (Silver), 🥉 Top 3 (Bronze), #4-#6 (Navy).
    - Layout 2 tầng thông minh: Hàng 1 (Huy hiệu rank + Tên lớp đầy đủ không bị ép + Số lượt đặt), Hàng 2 (Chip môn thể thao + Thanh tiến độ lấp đầy + Tỷ lệ % lấp đầy).
    - Đồng bộ chiều cao hoàn hảo với Thẻ 1 và Thẻ 2 (~420px).
- [x] **Kiểm thử & Rebuild**:
  - Chạy `npm --prefix Frontend test` (đảm bảo 153/153 tests pass).
  - Rebuild Docker container `scms-frontend` (cổng 3004).
- [x] **Cập nhật Graphify AST Code Index**:
  - Refresh AST code extraction.

---

## Milestone 19: Tái thiết kế toàn diện UI/UX Row 3 Analytics Cards (Doanh thu theo thời gian, Doanh thu theo bộ môn, Lượt đặt theo lớp học) (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "DES lại cái này luôn" (ảnh chụp Row 3 gồm 3 thẻ phân tích tài chính & vận hành), xóa bỏ hoàn toàn hiện tượng cắt cụt chữ (`...`), loại bỏ hiệu ứng "hộp lồng hộp" (box-in-box), hiển thị đầy đủ mốc ngày trục X và tạo đồ thị dòng tiền mượt mà, đĩnh đạc, chuẩn executive.

### Các hạng mục thực thi:
- [ ] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) tái cấu trúc 3 thẻ Row 3**:
  - **Thẻ 1: Biến động doanh thu theo thời gian (`TwelveMonthRevenueExpensesProfitChart`)**:
    - Hiển thị đầy đủ nhãn ngày trục X (DD/MM) với `paddingBottom` và tọa độ chuẩn xác, có vạch tick định vị mờ.
    - Làm mượt đường xu hướng Thực thu ròng (dùng đường xu hướng chuyển động mềm mại hoặc spline nối tự nhiên giữa các mốc giao dịch, loại bỏ hiện tượng đâm nhọn răng cưa cắm xuống đáy 0đ).
    - Đường tham chiếu đỉnh kỳ (`Peak Revenue Reference Line`) tinh tế thay vì 2 huy hiệu trùng lặp đè lên cột.
    - Cột doanh thu to rõ (15px), gradient Emerald Teal đa tầng, phản hồi hover mượt mà với Glassmorphism tooltip.
    - 3 thẻ Executive KPI đầu thẻ: Thực thu ròng, Doanh thu gộp, Đã hoàn tiền với icon và typography font-chivo sắc nét.
  - **Thẻ 2: Doanh thu theo bộ môn (`ThreeMonthExpensesBars`)**:
    - Xóa bỏ hoàn toàn tình trạng cắt cụt tên bộ môn ("Boxing & Võ t...").
    - Chuyển từ các ô hộp lồng hộp (nested cards) sang danh sách phân đoạn sang trọng với đường phân cách thanh mảnh.
    - Layout 2 tầng: Hàng 1 (Icon thể thao squircle + Tên bộ môn trọn vẹn + Doanh thu font-chivo), Hàng 2 (Thanh tiến độ gradient thương hiệu + Chip phần trăm đóng góp).
    - Hỗ trợ toggle xem toàn bộ 9 bộ môn hoặc top 6 gọn gàng.
  - **Thẻ 3: Lượt đặt theo lớp học (`SixMonthContractExpiryBars`)**:
    - Giải quyết triệt để 100% lỗi cắt chữ (`...`) trên tên lớp học (ví dụ: "Bơi sải Kỹ thuật Olympic K1", "Yoga Phục hồi & Trị liệu Cột sống"...).
    - Huy hiệu xếp hạng chuyên biệt: 🏆 Top 1 (Gold Medal), 🥈 Top 2 (Silver), 🥉 Top 3 (Bronze), #4-#6 (Navy).
    - Layout 2 tầng thông minh: Hàng 1 (Huy hiệu rank + Tên lớp đầy đủ không bị ép + Số lượt đặt), Hàng 2 (Chip môn thể thao + Thanh tiến độ lấp đầy + Tỷ lệ % lấp đầy).
    - Đồng bộ chiều cao hoàn hảo với Thẻ 1 và Thẻ 2 (~420px).
- [ ] **Kiểm thử & Rebuild**:
  - Chạy `npm --prefix Frontend test` (đảm bảo 153/153 tests pass).
  - Rebuild Docker container `scms-frontend` (cổng 3004).
- [ ] **Cập nhật Graphify AST Code Index**:
  - Refresh AST code extraction.

---

## Milestone 20: Tái thiết kế UI/UX Doanh thu theo bộ môn & Thị phần đặt chỗ (SportRevenueRow) trên trang Báo cáo Quản lý (/manager/reports) (2026-11-09)
Mục tiêu: Đáp ứng yêu cầu người dùng "DES lại cái này luôn" (ảnh chụp Tier 4 gồm Thẻ Doanh thu theo bộ môn và Thẻ Thị phần đặt chỗ theo bộ môn), loại bỏ 100% khoảng trắng thừa vô lý (~500px) ở thẻ bên phải, xóa bỏ hiện tượng "hộp lồng hộp" (box-in-box) và dải màu đơn điệu ở thẻ bên trái, đồng thời bổ sung các chỉ số vận hành điều hành thực tế.

### Các hạng mục thực thi:
- [x] **Áp dụng UX/UI Pro Max (`ux-ui-promax`) tái cấu trúc 2 thẻ Tier 4**:
  - **Thẻ 1: Doanh thu theo bộ môn (`SportRevenueBarChart`)**:
    - Chuyển từ các ô hộp lồng hộp thô kệch sang danh sách phân đoạn sang trọng với đường phân cách thanh mảnh.
    - Bổ sung huy hiệu xếp hạng Olympic (`🏆 #1` Gold, `🥈 #2` Silver, `🥉 #3` Bronze, `#4`–`#9` Navy) và icon thể thao chuyên biệt squircle (`pool`, `fitness_center`, `sports_mma`, `self_improvement`...).
    - Thanh tiến độ màu nhận diện thương hiệu theo môn với dải gradient đa tầng rực rỡ thay cho màu xanh lá - cát đơn điệu trước đây.
    - Hàng số liệu tài chính rõ ràng: Doanh thu thuần (font Chivo), Doanh thu gộp (Thu) và Hoàn tiền (đỏ nổi bật khi có hoàn tiền).
    - Hỗ trợ toggle xem Top 6 hoặc toàn bộ 9 bộ môn kèm chỉ số Tổng doanh thu phân bổ.
  - **Thẻ 2: Thị phần đặt chỗ & Hiệu suất bộ môn (`SportsDonutChart`)**:
    - Xóa bỏ triệt để 500px khoảng trắng trống trơn ở nửa dưới thẻ!
    - Tối ưu Donut chart SVG kích thước chuẩn 460x210 (giữ nguyên marker `data-chart-id="chart-donut"` để tương thích 100% tính năng xuất file PDF), hiển thị tổng lượt đặt ở tâm kèm tương tác hover nổi bật từng môn.
    - Bổ sung dải 3 thẻ KPI điều hành mini:
      1. `Môn Dẫn Đầu`: Bơi lội (56 lượt · 40.3% thị phần).
      2. `Lấp Đầy Trung Bình`: ~2.1 HV/ca toàn cơ sở.
      3. `Ca Học Vận Hành`: 67 ca đang mở lớp.
    - Bổ sung bảng phân bổ & tiến độ đặt chỗ chi tiết cho toàn bộ các môn (kể cả các môn nhỏ #6–#9), cân bằng chiều cao ngang bằng tuyệt đối với Thẻ 1.
- [x] **Kiểm thử & Rebuild**:
  - `npm --prefix Frontend test` pass toàn bộ tests.
  - Rebuild Docker container `scms-frontend` (cổng 3004).
- [x] **Đồng bộ Graphify Code Index**:
  - Refresh AST code extraction.
