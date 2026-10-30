# Kịch bản demo Flow 3 — Payment & Report

## 1. Mục tiêu demo

Chứng minh một luồng nghiệp vụ tài chính xuyên suốt giữa hai vai trò:

1. **Receptionist** tra cứu hóa đơn, ghi nhận khoản thu và hoàn tất thanh toán.
2. Hệ thống cập nhật đúng số tiền đã thu, số dư, trạng thái hóa đơn và quyền lợi gói tập.
3. **Manager** xem số liệu doanh thu đã cập nhật trong đúng kỳ báo cáo, theo dõi vận hành và xuất báo cáo.

Thông điệp chính: **chỉ giao dịch thành công mới được ghi nhận vào doanh thu; chỉ hóa đơn được thanh toán đủ mới kích hoạt quyền lợi gói tập.**

## 2. Thời lượng và vai trò

- Thời lượng đề xuất: **8–10 phút**.
- Người demo đóng lần lượt hai vai trò: **Receptionist** và **Manager**.
- Nên mở sẵn hai cửa sổ hoặc hai profile trình duyệt để không mất thời gian đăng xuất/đăng nhập.

## 3. Dữ liệu cần chuẩn bị trước

Điền thông tin thật của môi trường demo vào bảng sau:

| Dữ liệu | Giá trị chuẩn bị |
|---|---|
| Tài khoản Receptionist | `[reception01@sportscenter.vn]` |
| Tài khoản Manager | `[manager01@sportscenter.vn]` |
| Hội viên demo | `[testmember18@sportscenter.vn]` |
| Mã hội viên | `[TEST-MEMBER-018]` |
| Mã hóa đơn | `[invoice number]` |
| Tổng tiền hóa đơn | `[amount] VNĐ` |
| Trạng thái ban đầu | `Issued / Chưa thanh toán` |
| Số tiền thu lần 1 | Khoảng 30–50% tổng tiền |
| Số tiền thu lần 2 | Toàn bộ số dư còn lại |

Điều kiện bắt buộc:

- Hóa đơn thuộc đúng trung tâm của Receptionist/Manager.
- Hóa đơn đang ở trạng thái `Issued`, chưa có giao dịch thành công.
- Khoảng báo cáo có chứa ngày thực hiện thanh toán. Khi demo nhanh, chọn **Hôm nay**.
- Ghi lại doanh thu thuần trước khi thanh toán để có số đối chiếu sau demo.
- Nếu dữ liệu report được cache hoặc tải chậm, chuẩn bị sẵn thao tác chuyển kỳ rồi chọn lại **Hôm nay** để tải mới.

## 4. Kịch bản demo chính

### Cảnh 1 — Giới thiệu Flow 3 (30 giây)

**Thao tác**

- Hiển thị sơ đồ hoặc đứng tại trang đăng nhập.

**Lời thoại**

> Flow 3 quản lý toàn bộ vòng đời tài chính từ lúc hóa đơn được phát hành, lễ tân ghi nhận thanh toán, hệ thống cập nhật trạng thái và quyền lợi, cho đến khi Manager xem doanh thu và xuất báo cáo. Trong phần demo này, em sẽ xử lý một hóa đơn theo hai lần thu để thể hiện rõ trạng thái thanh toán một phần và thanh toán đủ.

---

### Cảnh 2 — Receptionist tra cứu hóa đơn (1 phút)

**Thao tác**

1. Đăng nhập bằng tài khoản Receptionist.
2. Từ menu **GIAO DỊCH TẠI QUẦY**, chọn **Hóa đơn & Thu tiền**.
3. Tại ô **Tìm hóa đơn**, nhập mã hóa đơn, mã hội viên hoặc tên hội viên.
4. Nhấn **Tìm kiếm**.
5. Chọn hóa đơn có trạng thái **Chưa thanh toán**, nhấn **Xem chi tiết**.

**Lời thoại**

> Lễ tân chỉ nhìn thấy hóa đơn trong phạm vi trung tâm mình phụ trách. Có thể tìm theo mã hóa đơn, mã hội viên hoặc tên hội viên. Trong chi tiết hóa đơn, hệ thống hiển thị dịch vụ, tổng tiền, số đã thanh toán, số còn phải thu và toàn bộ lịch sử giao dịch.

**Điểm cần chỉ trên màn hình**

- Mã hóa đơn và thông tin hội viên.
- Trạng thái **Chưa thanh toán**.
- `Đã thanh toán = 0 VNĐ`.
- `Còn phải thu = tổng tiền hóa đơn`.

---

### Cảnh 3 — Chứng minh kiểm soát dữ liệu sai (45 giây)

**Thao tác**

1. Tại phần **Ghi Nhận Khoản Thu Tiếp**, nhập số tiền lớn hơn số **Còn phải thu**.
2. Chọn **Tiền mặt**.
3. Nhấn **Lưu khoản thu**.

**Kết quả mong đợi**

- Hệ thống từ chối và hiển thị thông báo số tiền phải nằm trong phạm vi còn phải thu.
- Không phát sinh payment mới; số dư và trạng thái hóa đơn không thay đổi.

**Lời thoại**

> Trước khi ghi nhận giao dịch, cả giao diện và backend đều kiểm tra số tiền. Hệ thống không cho thu số âm, số bằng 0 hoặc số vượt quá dư nợ, nhờ đó tránh ghi nhận sai doanh thu.

---

### Cảnh 4 — Thu tiền một phần (1 phút)

**Thao tác**

1. Nhập số tiền thu lần 1 đã chuẩn bị.
2. Chọn **Tiền mặt**.
3. Nhập ghi chú: `Thu lần 1 tại quầy`.
4. Nhấn **Lưu khoản thu**.

**Kết quả mong đợi**

- Hiển thị thông báo **Đã lưu khoản thanh toán**.
- Hóa đơn chuyển sang **Thanh toán một phần** (`PartiallyPaid`).
- **Đã thanh toán** tăng đúng bằng khoản vừa thu.
- **Còn phải thu** giảm tương ứng.
- Lịch sử thanh toán có giao dịch `CASH`, trạng thái `Succeeded` và mã tham chiếu.
- Gói tập chưa được kích hoạt vì hóa đơn chưa được thanh toán đủ.

**Lời thoại**

> Hệ thống hỗ trợ thu nhiều lần. Sau lần thu đầu tiên, hóa đơn chuyển sang thanh toán một phần và số dư được tính lại từ các giao dịch thành công. Ở thời điểm này quyền lợi chưa được kích hoạt, vì hóa đơn vẫn còn dư nợ.

---

### Cảnh 5 — Thu đủ số dư và hoàn tất hóa đơn (1 phút)

**Thao tác**

1. Giữ nguyên số tiền được hệ thống điền theo **Còn phải thu**, hoặc nhập chính xác số dư.
2. Chọn **Tiền mặt**.
3. Nhập ghi chú: `Thu đủ số dư tại quầy`.
4. Nhấn **Lưu khoản thu**.
5. Chỉ vào trạng thái và lịch sử thanh toán sau khi hệ thống cập nhật.

**Kết quả mong đợi**

- Hóa đơn chuyển sang **Đã thanh toán** (`Paid`).
- **Còn phải thu = 0 VNĐ**.
- Lịch sử có đủ hai giao dịch thành công.
- Tổng hai khoản thu bằng tổng tiền hóa đơn.
- Subscription/quyền lợi liên quan được kích hoạt hoặc lên lịch theo ngày hiệu lực của gói.
- Form thu tiếp không còn xuất hiện.

**Lời thoại**

> Khi tổng các giao dịch thành công bằng giá trị hóa đơn, hệ thống chuyển hóa đơn sang Đã thanh toán và số dư về 0. Chỉ tại mốc này gói tập mới được kích hoạt hoặc lên lịch theo ngày hiệu lực. Việc cập nhật payment, invoice và subscription được xử lý đồng bộ để tránh trạng thái dở dang.

**Thao tác bổ sung tùy chọn**

- Nhấn **In / Lưu PDF** để xem chứng từ.
- Hoặc nhấn **Xuất CSV** để tải chi tiết hóa đơn.

---

### Cảnh 6 — Chuyển sang Manager và mở báo cáo (1 phút)

**Thao tác**

1. Chuyển sang cửa sổ đã đăng nhập Manager.
2. Mở **Báo cáo & Thống kê**.
3. Trong **Kỳ nhanh**, chọn **Hôm nay**.
4. Nếu cần minh họa lọc tùy chỉnh, chọn **Từ**, **Đến**, cách nhóm **Theo Ngày**, rồi nhấn **Áp dụng**.

**Lời thoại**

> Manager xem báo cáo trong phạm vi trung tâm được phân công. Báo cáo có thể lọc nhanh theo ngày, tuần, tháng, quý, năm hoặc chọn khoảng ngày tùy chỉnh. Vì giao dịch vừa được ghi nhận hôm nay, em chọn kỳ Hôm nay để đối chiếu.

---

### Cảnh 7 — Đối chiếu Payment với Report (2 phút)

**Thao tác**

1. Chỉ vào thẻ **Doanh thu thuần**.
2. Đối chiếu ba số: **Thu**, **Hoàn** và **Doanh thu thuần**.
3. Cuộn đến biểu đồ doanh thu theo thời gian.
4. Chỉ vào các KPI liên quan: tổng thành viên, thành viên mới, check-in và tỷ lệ lấp đầy.
5. Mở phần **BẢNG TRA CỨU CHI TIẾT VẬN HÀNH**.
6. Lần lượt giới thiệu các tab:
   - **Bảng Lớp học**;
   - **Danh sách Bộ môn**;
   - **Bảng Sân & Phòng**;
   - **Hiệu suất HLV**;
   - **Lịch sử & Đăng ký**.

**Kết quả mong đợi**

- Khoản thu thành công vừa tạo nằm trong tổng thu của kỳ hiện tại.
- Doanh thu thuần tuân theo công thức: `Tổng payment thành công − khoản hoàn tiền đã xử lý`.
- Payment `Pending` hoặc `Failed` không được cộng vào doanh thu.
- Dữ liệu vận hành được tổng hợp trong cùng phạm vi trung tâm và kỳ báo cáo.

**Lời thoại**

> Báo cáo không lấy giá niêm yết của gói làm doanh thu, mà lấy dòng tiền thực tế từ các payment thành công theo thời điểm thanh toán. Khoản hoàn tiền đã xử lý được trừ riêng để tạo doanh thu thuần. Các giao dịch đang chờ hoặc thất bại không được tính. Ngoài tài chính, Manager còn theo dõi hội viên, lớp học, bộ môn, sân phòng và hiệu suất huấn luyện viên trên cùng một dashboard.

> Ta có thể đối chiếu số liệu trước và sau giao dịch: tổng thu tăng đúng bằng tổng số tiền vừa thu; nếu chưa có hoàn tiền mới thì doanh thu thuần cũng tăng cùng số tiền đó.

---

### Cảnh 8 — Xuất báo cáo và kết thúc (45 giây)

**Thao tác**

1. Nhấn **PDF** để tải báo cáo trình bày khổ A4.
2. Hoặc nhấn **Excel** để tải file phục vụ phân tích số liệu.
3. Giới thiệu thêm nút **CSV** cho nhu cầu xử lý dữ liệu thô và **In Báo Cáo** để in trực tiếp.

**Lời thoại**

> Sau khi lọc đúng kỳ, Manager có thể in trực tiếp hoặc xuất PDF, Excel và CSV. File báo cáo giữ đúng phạm vi và dữ liệu đang hiển thị, phù hợp cho lưu trữ, đối soát và phân tích tiếp.

> Như vậy Flow 3 đã khép kín từ thu tiền tại quầy, kiểm soát trạng thái hóa đơn và quyền lợi, đến tổng hợp doanh thu và xuất báo cáo quản trị.

## 5. Nhánh demo mở rộng — Hoàn tiền

Chỉ thực hiện nếu đã chuẩn bị sẵn một yêu cầu hoàn tiền `Pending` và ảnh chứng minh chuyển khoản.

### Các bước

1. Đăng nhập Manager.
2. Mở **Hóa đơn & Hoàn tiền**.
3. Chuyển sang tab **Yêu cầu hoàn tiền**.
4. Chọn nhóm `Pending`, mở một yêu cầu bằng nút **Xử lý yêu cầu**.
5. Chọn **Chấp nhận**.
6. Tải lên **Ảnh xác nhận chuyển khoản**, nhập mã giao dịch ngân hàng và ghi chú.
7. Nhấn **Xác nhận đã chuyển và duyệt**.
8. Quay lại **Báo cáo & Thống kê**, chọn đúng kỳ.
9. Chứng minh **Hoàn tiền** tăng và **Doanh thu thuần** giảm tương ứng.

### Lời thoại

> Hoàn tiền không xóa hoặc sửa giao dịch gốc. Hệ thống lưu một nghiệp vụ hoàn tiền riêng, người duyệt, bằng chứng và mã giao dịch để đảm bảo truy vết. Khi khoản hoàn được xử lý, báo cáo ghi nhận ở cột hoàn tiền và trừ khỏi doanh thu thuần của kỳ xử lý.

## 6. Kịch bản rút gọn 5 phút

Nếu thời gian ngắn, bỏ bước thu một phần và nhánh hoàn tiền:

1. Receptionist mở một hóa đơn `Issued`.
2. Nhập một số tiền vượt dư nợ để chứng minh validation.
3. Nhập đúng toàn bộ số dư và lưu khoản thu.
4. Chứng minh trạng thái `Paid`, dư nợ bằng 0 và payment `Succeeded`.
5. Chuyển sang Manager, mở báo cáo **Hôm nay**.
6. Đối chiếu tổng thu/doanh thu thuần và xuất Excel hoặc PDF.

## 7. Câu hỏi phản biện thường gặp

**Tại sao thanh toán một phần chưa kích hoạt gói?**  
Vì quyền lợi chỉ được cấp khi hóa đơn đã thanh toán đủ. Điều này ngăn hội viên sử dụng dịch vụ khi vẫn còn dư nợ.

**Nhấn nút lưu hai lần có tạo hai giao dịch không?**  
Không. Yêu cầu thanh toán dùng `Idempotency-Key`; retry cùng một thao tác không được ghi nhận tiền hai lần.

**Payment đang chờ hoặc thất bại có vào doanh thu không?**  
Không. Báo cáo chỉ cộng payment có trạng thái `Succeeded` theo thời điểm `PaidAt`.

**Doanh thu thuần được tính thế nào?**  
Doanh thu thuần bằng tổng tiền đã thu thành công trong kỳ trừ các khoản hoàn tiền đã xử lý trong kỳ.

**Manager có xem dữ liệu trung tâm khác không?**  
Không. Dữ liệu tài chính và báo cáo của Manager được giới hạn theo center scope. Admin có màn hình tổng hợp chỉ đọc và có thể drill-down theo từng cơ sở.

**Nếu cổng thanh toán timeout thì sao?**  
Hệ thống giữ giao dịch ở trạng thái chờ/đối soát, không tự đoán là thành công và không cộng doanh thu cho đến khi có kết quả xác thực.

**Có thể hủy hóa đơn đã thu tiền không?**  
Không hủy theo cơ chế hóa đơn chưa thanh toán. Với khoản đã thu, hệ thống phải đi qua nghiệp vụ hoàn tiền để giữ lịch sử và audit trail.

## 8. Checklist trước khi lên demo

- [ ] Backend, Frontend và SQL Server đang chạy.
- [ ] Hai tài khoản demo đăng nhập được và đúng center.
- [ ] Receptionist có quyền `register_counter_package`.
- [ ] Manager có quyền `view_reports`.
- [ ] Có hóa đơn `Issued` chưa có payment thành công.
- [ ] Đã ghi lại tổng tiền, mã hóa đơn và doanh thu trước demo.
- [ ] Ngày thanh toán nằm trong kỳ báo cáo sẽ chọn.
- [ ] Trình duyệt cho phép popup nếu muốn dùng **In / Lưu PDF**.
- [ ] Thư mục tải xuống dễ mở để trình bày file PDF/Excel.
- [ ] Không dùng dữ liệu thật nhạy cảm của hội viên khi trình chiếu.
- [ ] Có sẵn một hóa đơn dự phòng nếu hóa đơn chính bị thay đổi trước buổi demo.

## 9. Lưu ý khi trình bày

- Không đọc các con số mẫu; luôn chỉ trực tiếp giá trị đang hiển thị trên môi trường demo.
- Không diễn giải các huy hiệu phần trăm trang trí trên thẻ KPI như tốc độ tăng trưởng nếu chưa có kỳ so sánh tương ứng.
- Nếu báo cáo chưa đổi ngay, chọn một kỳ khác rồi chọn lại **Hôm nay**, hoặc dùng thao tác thử lại khi UI hiển thị lỗi.
- Khi demo POS, bắt buộc thu toàn bộ số dư và nhập mã chuẩn chi; để luồng ổn định, nên dùng **Tiền mặt** trong kịch bản chính.
