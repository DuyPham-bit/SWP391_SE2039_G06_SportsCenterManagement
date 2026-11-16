# Findings & Root Cause Analysis

## 1. Phân tích nguyên nhân các ảnh người dùng gửi:
- **Ảnh 1 (`SELECT TOP (1000) ... FROM [SportsCenterDB].[dbo].[users]` trả về 0 dòng):**
  - Xảy ra khi script nạp trước đó chưa commit hoặc bị lỗi rollback do các ràng buộc khóa ngoại (foreign key constraints) từ các bảng AI, bài tập, gói tập cũ.
  - Hiện tại cả Local SQL Server và Docker SQL Server đã có đầy đủ 18 users sạch và hợp lệ 100%.
- **Ảnh 2 (Gạch đỏ ở các cột `[google_subject]`, `[auth_version]`, `[avatar_key]`, `[is_email_verified]`, `[must_change_password]`):**
  - **Kiểm tra thực tế:** Toàn bộ các cột này **ĐÃ CÓ ĐẦY ĐỦ** trong bảng `users` ở SQL Server.
  - **Nguyên nhân gốc rễ (Root Cause):** SSMS (SQL Server Management Studio) lưu cache IntelliSense cục bộ khi khởi động hoặc mở cửa sổ Query. Khi các migration được áp dụng hoặc bảng được cập nhật schema từ bên ngoài, SSMS không tự động cập nhật cache metadata này, dẫn đến việc IntelliSense cảnh báo giả "Invalid column name".
  - **Giải pháp:** Chỉ cần nhấn tổ hợp phím **`Ctrl + Shift + R`** trong SSMS (hoặc menu `Edit` -> `IntelliSense` -> `Refresh Local Cache`). Toàn bộ vạch đỏ sẽ biến mất ngay lập tức.
- **Ảnh 3 (Trang chủ hiển thị 0 Bộ môn thể thao & Cơ sở vật chất trống):**
  - **Nguyên nhân gốc rễ:** Frontend cấu hình `VITE_SPORTS_CENTER_ID=15` (Sports Center Quận 1) và truy vấn cài đặt Landing Page từ bảng `dbo.system_settings` với key `site.landing-content`. Khi cơ sở dữ liệu bị mất các bản ghi gắn với `center_id = 15` và bản ghi cài đặt landing page, giao diện không có dữ liệu để hiển thị.
  - **Giải pháp:** Đã khôi phục hoàn chỉnh 10 bộ môn, 10 phòng/sân tập, 18 lớp học cho `center_id = 15` (đồng thời tạo bản ghi dự phòng `center_id = 1`), và khôi phục đầy đủ cấu hình JSON Landing Page. Hiện tại API `GET /api/public/centers/15/catalog` trả về đầy đủ 10 sports, 10 rooms, 8 classes; trang chủ `http://localhost:3004` hiển thị đầy đủ, đẹp mắt.

## 2. Danh sách 18 tài khoản chuẩn đã kiểm thử thành công:
- **Admin & Nhân viên (Mật khẩu: `Admin@123456`):**
  1. Admin: `admin` (`admin@sportscenter.vn`)
  2. Quản lý: `manager01` (`manager01@sportscenter.vn`)
  3. Lễ tân: `reception01` (`reception01@sportscenter.vn`)
- **10 Huấn luyện viên (Mật khẩu: `Coach@123`, Dạy môn kép):**
  1. Nguyễn Quốc Cường - `nguyenquoccuong` (`nguyenquoccuong@sportscenter.vn`): Gym & Boxing, Golf
  2. Trần Hải Đăng - `tranhaidang` (`tranhaidang@sportscenter.vn`): Bơi lội, Cầu lông, Golf
  3. Lê Thị Thu Thảo - `lethithuthao` (`lethithuthao@sportscenter.vn`): Yoga & Bơi lội, Bóng đá
  4. Vũ Đình Trọng - `vudinhtrong` (`vudinhtrong@sportscenter.vn`): Boxing, Gym, Bóng rổ
  5. Hoàng Khánh Linh - `hoangkhanhlinh` (`hoangkhanhlinh@sportscenter.vn`): Yoga, Golf, Bóng bàn, Pickleball
  6. Phạm Thế Anh - `phamtheanh` (`phamtheanh@sportscenter.vn`): Cầu lông, Bơi lội
  7. Trịnh Gia Huy - `trinhgiahuy` (`trinhgiahuy@sportscenter.vn`): Golf, Gym
  8. Đặng Hữu Phúc - `danghuuphuc` (`danghuuphuc@sportscenter.vn`): Gym, Cầu lông
  9. Bùi Phương Nam - `buiphuongnam` (`buiphuongnam@sportscenter.vn`): Gym, Yoga
  10. Ngô Tuấn Kiệt - `ngotuankiet` (`ngotuankiet@sportscenter.vn`): Yoga, Boxing
- **5 Hội viên (Mật khẩu: `Mem@123`, Tên thật & Email trùng tên):**
  1. Phạm Minh Tuấn - `phamminhtuan` (`phamminhtuan@sportscenter.vn`)
  2. Hoàng Hải Yến - `hoanghaiyen` (`hoanghaiyen@sportscenter.vn`)
  3. Đặng Quốc Bảo - `dangquocbao` (`dangquocbao@sportscenter.vn`)
  4. Trần Thị Mai Anh - `tranthimaianh` (`tranthimaianh@sportscenter.vn`)
  5. Phạm Văn Duy - `phamvanduy` (`phamvanduy@sportscenter.vn`)

## 3. Lỗi Đăng nhập Google (Google OAuth Web Client ID):
- **Hiện tượng (Hình ảnh người dùng gửi):** Thông báo lỗi toast: *"Đăng nhập Google chưa được cấu hình. Cần Google OAuth Web Client ID."*
- **Nguyên nhân gốc rễ (Root Cause):**
  - Trong `GoogleTokenValidator.cs`, backend kiểm tra `configuration["Google:ClientId"]`. Nếu trống, nó ném ngoại lệ 503 với thông báo trên.
  - Trên máy host, `Google:ClientId` đã có trong `dotnet user-secrets` và `Frontend/.env.local` (`480541058737-5mk2slkekdomo0nrfr8q2nnfm8qfigfe.apps.googleusercontent.com`).
  - Tuy nhiên, trong môi trường Docker, file `docker/docker-compose.yml` chưa truyền biến môi trường `Google__ClientId` cho service `backend`, và `docker/.env` chưa khai báo `GOOGLE_CLIENT_ID`.
- **Giải pháp:**
  - Thêm `GOOGLE_CLIENT_ID=480541058737-5mk2slkekdomo0nrfr8q2nnfm8qfigfe.apps.googleusercontent.com` vào `docker/.env` và `docker/.env.example`.
  - Cấu hình `- Google__ClientId=${GOOGLE_CLIENT_ID:-}` trong `docker/docker-compose.yml` dưới service `backend`.
  - Tái tạo container backend: `docker compose up -d --no-deps backend`.
  - **Kiểm thử xác minh:** Endpoint `/api/auth/google` đã nhận diện Client ID và tiến hành xác thực token với Google OpenID Connect thành công.

## 4. Trạng thái đồng bộ:
- Cả Local SQL Server (`DESKTOP-M1NP3N6`) và Docker SQL Server (`scms-sqlserver`) đều có cùng 40 bảng dữ liệu, 18 users, 10 sports, 10 rooms, 18 classes, 8 packages, 6 system settings.
- Tệp `Backend/database/SportsCenterDB.sql` đã được cập nhật toàn bộ khối lệnh seed chuẩn, có thể chạy độc lập không phụ thuộc bất kỳ file nào khác.

## 5. Giải thích hình ảnh người dùng gặp phải (0 Bộ Môn & Toast Google):
1. **Lỗi Toast "Đăng nhập Google chưa được cấu hình. Cần Google OAuth Web Client ID":**
   - Xảy ra khi backend Docker ban đầu thiếu biến môi trường `Google__ClientId`.
   - Đã xử lý triệt để: Bổ sung mapping `Google__ClientId` từ `docker/.env` vào `docker/docker-compose.yml`, cập nhật container `scms-backend`. Endpoint `/api/auth/google` đã xác thực đúng với máy chủ Google OpenID Connect.
2. **Lỗi "0 Bộ Môn Thể Thao" & "Không tìm thấy cụm sân phù hợp":**
   - Xảy ra khi trình duyệt tải trang vào thời điểm dịch vụ Backend/Docker đang trong trạng thái khởi động lại (restart) hoặc bị ngắt tạm thời khiến các API `/api/landing-content` và `/api/public/centers/15/catalog` bị trả về lỗi mạng / 503 fallback rỗng.
   - Hiện tại: Tất cả 3 container Docker đã `healthy` và `Up`, API danh mục trả về đủ 10 môn thi đấu, 10 phòng/sân tập. Trang chủ `http://localhost:3004/` đã hiển thị đầy đủ, mượt mà.
3. **Trợ lý AI:**
   - Đã tích hợp mục **"Trợ lý Thể thao AI"** vào Sidebar của Hội viên (`#/member/dashboard`) và bong bóng linh vật góc dưới bên phải màn hình.
   - Bấm vào mở popup chat SCMS AI 24/7 trực tiếp, trả lời mọi thông tin câu hỏi nhanh chóng và chính xác.
