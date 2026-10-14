# Để mọi máy dùng chung

1. Đưa Frontend, Backend và một SQL Server lên cùng dịch vụ máy chủ.
2. Gắn tên miền và bật HTTPS.
3. Cấu hình web server để `/api` chuyển tới Backend. Frontend đã dùng `/api` tự động.
4. Cấu hình Backend trỏ tới SQL Server đó, rồi tạo tài khoản quản trị đầu tiên.

Nếu backend phục vụ cả giao diện, chạy `npm.cmd run build:api` trong `Frontend/` trước khi publish backend. Thư mục `wwwroot` là đầu ra build tự tạo; giữ tài nguyên nguồn trong `Frontend/public/`. Nếu triển khai frontend riêng, chạy `npm.cmd run build` và phục vụ `Frontend/dist`.

Xác thực dùng JWT Bearer; backend cần khóa ký JWT riêng và frontend giữ JWT trong bộ nhớ từng tab. Không cấu hình Session đăng nhập hoặc cookie xác thực. F5 cần đăng nhập lại, mỗi tab có thể dùng tài khoản khác nhau.

Mọi người mở cùng tên miền và đăng nhập bằng tài khoản riêng. Dữ liệu lưu ở SQL Server chung. Không cần cài Backend hay database trên từng máy.

Để đưa hệ thống lên thật, cần có dịch vụ máy chủ và tên miền. Hiện workspace chưa kết nối với dịch vụ nào.

## Dùng chung SQL trong mạng LAN

Chạy một backend trên máy giữ kết nối SQL, rồi mọi máy mở cùng địa chỉ backend. Không chạy frontend/API riêng với database riêng trên từng máy.

Từ workspace, dừng bản backend đang giữ cổng 54162 rồi chạy:

```powershell
.\start-shared.ps1
```

Script build frontend với `/api`, giữ cấu hình SQL/JWT hiện có và lắng nghe ở cổng 54162 trên các giao diện mạng. Dữ liệu demo được tắt. Script không thay file cấu hình, không tự mở firewall và không xóa/reset database. Các máy trong LAN mở `http://DESKTOP-M1NP3N6:54162` hoặc `http://<IP-máy-chạy-backend>:54162`; nếu không truy cập được, kiểm tra kết nối LAN và inbound rule của cổng này trên máy backend. Đây là cách chạy trong mạng nội bộ; triển khai Internet dùng HTTPS theo phần trên.

Nếu cần trỏ backend tới SQL Server khác bằng Windows Authentication:

```powershell
.\start-shared.ps1 -SqlServer 'TEN-SQL-SERVER' -Database 'SportsCenterManagement'
```

SQL Authentication được cung cấp bằng `ConnectionStrings__SportsCenter` hoặc User Secrets, không đưa mật khẩu vào source. Tài khoản chạy backend phải có quyền truy cập SQL đã chọn. Frontend đăng ký cần `VITE_SPORTS_CENTER_ID` trùng một center đang hoạt động trong database đó; database hiện tại có center 15. Build lại frontend nếu đổi center.

**Cùng một database mới chia sẻ dữ liệu.** Cài SQL Server cùng phiên bản, tạo database cùng tên hoặc chạy lại script tạo bảng trên máy khác không chép các tài khoản/bản ghi đã lưu. Nếu chuyển hẳn database sang máy khác, cần backup/restore cả dữ liệu rồi cấu hình backend trỏ tới bản đã restore. Không ghi đè database đang dùng bằng script reset.

Chi tiết nguyên nhân, bản sửa và kiểm chứng: [lưu dữ liệu SQL](Frontend/docs/sql-persistence-fix.md).
