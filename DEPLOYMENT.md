# Để mọi máy dùng chung

1. Đưa Frontend, Backend và một SQL Server lên cùng dịch vụ máy chủ.
2. Gắn tên miền và bật HTTPS.
3. Cấu hình web server để `/api` chuyển tới Backend. Frontend đã dùng `/api` tự động.
4. Cấu hình Backend trỏ tới SQL Server đó, rồi tạo tài khoản quản trị đầu tiên.

Nếu backend phục vụ cả giao diện, chạy `npm.cmd run build:api` trong `Frontend/` trước khi publish backend. Thư mục `wwwroot` là đầu ra build tự tạo; giữ tài nguyên nguồn trong `Frontend/public/`. Nếu triển khai frontend riêng, chạy `npm.cmd run build` và phục vụ `Frontend/dist`.

Xác thực dùng JWT Bearer; backend cần khóa ký JWT riêng và frontend giữ JWT trong bộ nhớ từng tab. Không cấu hình Session đăng nhập hoặc cookie xác thực. F5 cần đăng nhập lại, mỗi tab có thể dùng tài khoản khác nhau.

Mọi người mở cùng tên miền và đăng nhập bằng tài khoản riêng. Dữ liệu lưu ở SQL Server chung. Không cần cài Backend hay database trên từng máy.

Để đưa hệ thống lên thật, cần có dịch vụ máy chủ và tên miền. Hiện workspace chưa kết nối với dịch vụ nào.
