# Fix item 4 - Phân công Coach

Ngày hoàn thành: 17/10/2026

## Yêu cầu

- Không sử dụng tài khoản/nhân sự Coach mẫu.
- Lớp chưa có Coach phải hiển thị thống nhất là `Chưa có Coach`.
- Giúp Manager biết lịch dạy và phát hiện Coach trùng lịch trước khi phân công.
- Có tìm kiếm và bộ lọc trong danh sách Coach.

## Đã sửa

### Backend theo mô hình 3-layer

- Thêm `ICoachAssignmentQueryService` và `CoachAssignmentQueryService` ở BLL.
- Controller chỉ kiểm tra quyền truy cập trung tâm rồi gọi BLL, không tự truy vấn nghiệp vụ Coach.
- API danh sách Coach trả thêm mã Coach, bộ môn phụ trách và các ca dạy đang còn hiệu lực.
- Dữ liệu lịch chỉ lấy từ lớp đang hoạt động, lịch `Active` và chưa hết hạn.
- Giữ nguyên kiểm tra bắt buộc ở Backend khi xác nhận phân công: đúng trung tâm, tài khoản hoạt động, đúng chuyên môn, không trùng lịch, không vượt giới hạn giờ dạy và không trùng ngày nghỉ được duyệt.

### Loại bỏ Coach mẫu

- Ngừng tạo Coach demo trong `DbInitializer`.
- Các lớp và buổi học demo mới được tạo với `CoachId = null`.
- Với database cũ, tài khoản demo chỉ bị ngừng hoạt động khi còn khớp đầy đủ chữ ký seed (`username`, email và số điện thoại); tài khoản đã được chỉnh thành dữ liệu thật không bị tác động.
- Gỡ phân công lớp và Coach của các buổi tương lai khỏi tài khoản demo cũ.
- Xóa tên Coach mẫu khỏi mock data; giá trị trống được giữ là `null`.
- Chuẩn hóa nhãn trống ở các màn liên quan thành `Chưa có Coach`.

### Frontend

- Thay dropdown khó quan sát bằng danh sách thẻ Coach trực quan.
- Thêm tìm kiếm theo tên, mã Coach, chuyên môn và chứng chỉ.
- Thêm bộ lọc `Tất cả trạng thái`, `Phù hợp lịch`, `Đang trùng lịch`, `Chưa thể đối chiếu`.
- Hiển thị số lớp đang phụ trách, số ca dạy sắp tới và tên lớp gây xung đột.
- Hiển thị lịch của lớp đang cần phân công ở cột đối chiếu riêng.
- Coach sai chuyên môn hoặc trùng lịch bị khóa, không thể chọn.
- Nếu lớp chưa có lịch, giao diện thông báo rõ chưa thể dự báo trùng ca nhưng vẫn cho phép chọn Coach đúng chuyên môn; Backend tiếp tục kiểm tra khi lịch được tạo/cập nhật.
- Modal được mở rộng và vẫn tương thích màn hình mobile.

## Happy case

- Manager mở lớp có lịch, thấy Coach đúng chuyên môn và không trùng ca với trạng thái `Phù hợp lịch`.
- Tìm Coach theo tên/mã/chứng chỉ và lọc theo trạng thái.
- Chọn Coach rảnh và phân công thành công; request vẫn gửi `replacePrimary: true`.
- Lớp chưa có lịch vẫn có thể được phân Coach đúng chuyên môn với cảnh báo minh bạch.

## Unhappy case

- Coach sai chuyên môn bị khóa.
- Coach có lịch lặp cùng thứ, giao nhau về giờ và giao nhau về khoảng ngày bị đánh dấu `Trùng lịch` và bị khóa.
- Hai ca chỉ chạm biên giờ, ví dụ 08:00-09:00 và 09:00-10:00, không bị nhận nhầm là xung đột.
- Lỗi tải lịch được hiển thị trong form và không cho xác nhận khi chưa có lựa chọn hợp lệ.
- Backend vẫn từ chối nếu dữ liệu lịch/nghỉ phép/khối lượng dạy thay đổi sau lúc giao diện vừa đối chiếu.

## Xác minh

- Frontend unit tests: `57/57` pass.
- Frontend production build: pass.
- Backend Release build: pass, `0` lỗi biên dịch.
- Browser integration: `16/16` pass, không có lỗi JavaScript hay API ngoài dự kiến.
- `git diff --check`: không có lỗi whitespace mới.

## Lưu ý còn tồn tại

- Backend build vẫn báo các cảnh báo dependency `System.Security.Cryptography.Pkcs` và API Google credential đã có từ trước; không thuộc phạm vi mục 4.
