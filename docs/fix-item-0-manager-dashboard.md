# Biên bản sửa mục 0 — Bảng quản lý trực quan

Ngày hoàn tất: 17/10/2026

## Phạm vi

Chỉ xử lý mục 0 trong `Fix_item.txt`: làm bảng quản lý của Manager trực quan, dễ nhìn và dễ theo dõi hơn. Các mục từ 1 đến 9 chưa được sửa trong lượt này.

## Nguyên nhân

- Bốn KPI chỉ hiển thị số rời rạc, thiếu tỷ lệ để Manager đánh giá nhanh tình trạng vận hành.
- Chín chức năng quản lý nằm chung trong một danh sách nên khó quét và tìm đúng nghiệp vụ.
- Nhật ký gần đây hiển thị mã hành động và thời gian thô từ API, khó đọc với người dùng nghiệp vụ.
- Trạng thái tải, lỗi API và danh sách nhật ký rỗng chưa được phân biệt rõ; lỗi không có thao tác thử lại tại chỗ.

## Thay đổi đã thực hiện

### Giao diện Manager Dashboard

- Thiết kế lại phần tiêu đề theo style chung của web: slate/red, Lexend, Material Symbols, card bo tròn và responsive.
- Giữ bốn KPI chính nhưng chuẩn hóa cách định dạng số và mô tả ngữ cảnh.
- Thêm khu vực **Nhịp vận hành** với:
  - tỷ lệ thành viên có gói hiệu lực;
  - tỷ lệ lấp đầy lớp học.
- Thêm khu vực **Điểm đáng chú ý** với số thành viên mới và lớp được quan tâm nhất.
- Chia chức năng thành ba nhóm rõ ràng:
  - Vận hành hằng ngày;
  - Kinh doanh & báo cáo;
  - Cấu hình hệ thống.
- Chuyển hoạt động gần đây thành timeline có biểu tượng, màu theo loại nghiệp vụ, nhãn tiếng Việt và thời gian Việt Nam.
- Bổ sung đầy đủ trạng thái loading, empty, lỗi độc lập của số liệu và audit log, cùng nút **Thử lại**.
- Bổ sung thuộc tính accessibility cho trạng thái tải và progress bar.

### Logic và kiến trúc

- Tách logic trình bày/chuẩn hóa dữ liệu sang `managerDashboardView.js` để component không trộn xử lý dữ liệu với JSX.
- Giá trị số lỗi, âm, `NaN`, tỷ lệ vượt 100% và dữ liệu highlight bị thiếu đều có fallback an toàn.
- Không thay đổi Backend vì API báo cáo hiện đã cung cấp đủ dữ liệu. Việc giữ nguyên Controller/BLL/DAL tránh đưa yêu cầu thuần trình bày vào sai layer và không làm thay đổi hợp đồng API.
- Không sửa các thay đổi đang tồn tại của người dùng trong `MemberPackages.jsx`, `backendApi.js` và `payment-api.test.cjs`.

## Happy case đã kiểm tra

- API trả dữ liệu hợp lệ: KPI, tỷ lệ, doanh thu, thành viên mới và lớp nổi bật hiển thị đúng.
- Danh sách audit rỗng: hiển thị empty state dễ hiểu.
- Các nhóm chức năng điều hướng hiển thị đúng trên desktop và mobile.
- Dashboard ở viewport 375 x 812 không gây tràn ngang trang.

## Unhappy case đã kiểm tra

- Số âm, chuỗi không hợp lệ hoặc trường bị thiếu được đưa về giá trị an toàn.
- `activeMembers` lớn hơn `totalMembers` và `occupancyRate` lớn hơn 100% được giới hạn hợp lệ.
- Mã audit chưa biết vẫn được chuyển thành nhãn đọc được; mã rỗng có nhãn mặc định.
- Timestamp rỗng/sai định dạng có fallback `Chưa rõ thời gian`.
- API tổng quan và API audit lỗi độc lập, mỗi khu vực vẫn hiển thị lỗi đúng và cho phép thử lại.

## File đã thay đổi

- `Frontend/src/features/manager/ManagerDashboard.jsx`
- `Frontend/src/features/manager/managerDashboardView.js`
- `Frontend/tests/manager-dashboard.test.cjs`
- `Frontend/tests/manager-merge.browser.cjs`

## Kết quả xác minh

- `node --test tests/manager-dashboard.test.cjs`: 3/3 test đạt.
- `npm.cmd test`: 46/46 test đạt.
- `npm.cmd run build`: production build thành công, 197 modules được transform.
- `node tests/manager-merge.browser.cjs`: 10/10 browser check đạt; không có JavaScript exception hoặc API ngoài dự kiến.
- `git diff --check`: không có lỗi whitespace (chỉ có cảnh báo chuyển LF sang CRLF của Git trên Windows).

## Ngoài phạm vi

Các màn hình nghiệp vụ khác không được thay đổi trong mục 0.
