# Kế hoạch Cập nhật SportsCenterDB & Docker Environment

## 1. Mục tiêu
- Giải thích rõ ràng nguyên nhân dấu nháy đơn `'...'` trong tệp `docker/.env` và xử lý triệt để.
- Khôi phục đầy đủ dữ liệu nghiệp vụ gốc (Bộ môn, Sân bãi, Lớp học, Lịch học, Gói hội viên, Cấu hình Landing Page `site.landing-content`).
- Cập nhật đúng **5 Hội viên** tên thật, email trùng tên, mật khẩu `Mem@123`.
- Cập nhật đúng **10 Huấn luyện viên (HLV)** tên thật, email trùng tên, phụ trách **môn kép** ($\ge 2$ môn/HLV), mật khẩu `Coach@123`.
- Cập nhật tài khoản Admin/Manager/Receptionist mật khẩu `Admin@123456`.
- Đồng bộ toàn bộ dữ liệu nghiệp vụ chuẩn khớp hoàn toàn 100% giữa Local SQL Server (`DESKTOP-M1NP3N6`) và Docker SQL Server (`scms-sqlserver`).
- Xuất toàn bộ dữ liệu sạch, tự chứa vào tệp `Backend/database/SportsCenterDB.sql` để có thể triển khai độc lập.
- Kiểm tra toàn bộ 18 tài khoản đăng nhập trực tiếp qua Backend API trên container Docker đạt 200 OK.
- Tuyệt đối không sửa code Backend/Frontend.

## 2. Các bước thực hiện
- [x] Bước 1: Khảo sát cấu trúc bảng và các ràng buộc khóa ngoại liên quan đến `users`.
- [x] Bước 2: Viết script SQL/PowerShell dọn sạch dữ liệu cũ theo đúng thứ tự phụ thuộc (Child -> Parent).
- [x] Bước 3: Tạo và nạp bộ dữ liệu chuẩn mới (1 Admin, 1 Quản lý, 1 Lễ tân, 10 HLV môn kép, 5 Hội viên) kèm toàn bộ nghiệp vụ liên đới.
- [x] Bước 4: Khôi phục toàn bộ danh mục 10 bộ môn, 10 phòng/sân tập, 18 lớp học, 8 gói tập và nội dung Landing Page.
- [x] Bước 5: Đồng bộ dữ liệu chuẩn khớp 100% giữa Local SQL Server (`DESKTOP-M1NP3N6`) và Docker SQL Server (`scms-sqlserver`).
- [x] Bước 6: Cập nhật toàn bộ vào `Backend/database/SportsCenterDB.sql` (schema migrations + clean seed data).
- [x] Bước 7: Khởi chạy và kiểm tra Docker containers: `scms-sqlserver`, `scms-backend`, `scms-frontend`.
- [x] Bước 8: Kiểm thử API đăng nhập thực tế qua Backend Docker (`http://localhost:5000/api/auth/login`) cho toàn bộ 18 tài khoản (100% đạt 200 OK).
- [x] Bước 9: Dọn dẹp database tạm `SportsCenterDB_Original` và giải phóng dung lượng đĩa.
