# Ghi chú phát hành

Mỗi phiên bản tương ứng một nhánh `deploy/scms-v1.x`. `main` luôn trùng với phiên bản mới nhất.

## v1.4 — `deploy/scms-v1.4`

### Thay đổi chính

- **Avatar:** lưu trên Cloudflare R2 (`users.avatar_key`). Danh sách hội viên và nhân viên trả `avatarUrl`, nên Manager thấy ảnh của mọi tài khoản. Ảnh cũ chỉ còn trong trình duyệt được tự chuyển lên server ở lần đăng nhập kế tiếp. Lễ tân tải được ảnh cho hội viên.
- **Hoàn tiền:** hội viên chỉ yêu cầu hoàn cho gói đã mua còn hiệu lực (kể cả gói mua trước). Hoàn đủ tiền thì gói chuyển `Refunded`. Ảnh chuyển khoản mở qua API có xác thực (link R2 tạm 5 phút).
- **Khu vực tập luyện:** sơ đồ mặt bằng dựng từ bảng `rooms`, nhóm theo vị trí `Khu X • Tầng Y`, kèm sức chứa. Manager/Admin chỉnh tên, biểu tượng, màu, mô tả, vị trí, thứ tự và ẩn/hiện từng khu ở tab 5 của trang Nội dung trang chủ. Trình soạn trang chủ có bản nháp lưu trên server.
- **Giao diện:** banner của mọi vai trò dùng chung hiệu ứng động; trang 404; chuẩn hóa đường dẫn.
- **Hội viên:** trang đăng ký môn học (tự chọn HLV khi đã xác định, chỉ hiện môn đã đăng ký); hồ sơ có giới tính, ngày sinh, trình độ; đăng nhập bằng email hoặc số điện thoại.
- **Lễ tân:** tạo nhanh hội viên tại quầy với mật khẩu khởi tạo (kiểm tra theo chính sách mật khẩu).
- **Thông báo:** tự đánh dấu đã đọc khi mở, mở thẳng chi tiết buổi học liên quan.

### Chức năng đang tắt

- **Lương & KPI:** buổi học chưa có trạng thái "Completed", KPI và bảng lương đếm buổi khác nhau, hoa hồng doanh số chưa được tính. Backend `PayrollService` vẫn giữ nguyên.
- **Kích hoạt tài khoản qua email** và **mức ưu tiên yêu cầu hỗ trợ:** cần bảng/cột mới chưa có migration.

### Triển khai

Không có migration mới và không thêm biến môi trường. Deploy backend (Render) trước, frontend (Vercel) sau. Quay lại: chọn nhánh `deploy/scms-v1.3`.

## v1.3 — `deploy/scms-v1.3`

Mô tả bộ môn và cơ sở vật chất sửa được trên trang chủ; dọn dẹp repo.

## v1.2 — `deploy/scms-v1.2`

Gộp phần triển khai v1.1 với frontend kiến trúc FSD.

## v1.1 — `deploy/scms-v1.1`

PostgreSQL, Docker, thư viện ảnh Cloudflare R2, proxy Vercel → Render, sửa callback VNPay/MoMo.
